#!/usr/bin/env bash
# Mirror origin/<branch> to the same branch in the public TypeScript SDK repo.
# Local commits and working-tree changes are not included. History is not filtered.
# Usage:
#   ./scripts/sync_to_public.sh [branch]           # dry run; defaults to main
#   ./scripts/sync_to_public.sh [branch] --push    # push after confirmation
#   ./scripts/sync_to_public.sh [branch] --push -y # push without prompting
set -euo pipefail

PUBLIC_REMOTE_NAME="public"
PUBLIC_REMOTE_URL="git@github.com:pinecone-io/pinecone-ts-client.git"
BRANCH="main"
DO_PUSH=false
ASSUME_YES=false
branch_given=false

usage() {
    echo "Usage: $0 [branch] [--push] [-y|--yes]"
}

for arg in "$@"; do
    case "$arg" in
        --push) DO_PUSH=true ;;
        -y|--yes) ASSUME_YES=true ;;
        -h|--help) usage; exit 0 ;;
        -*) echo "Unknown argument: $arg" >&2; usage >&2; exit 1 ;;
        *)
            if [ "$branch_given" = true ]; then
                echo "Only one branch may be specified." >&2
                exit 1
            fi
            BRANCH="$arg"
            branch_given=true
            ;;
    esac
done

git check-ref-format "refs/heads/$BRANCH" >/dev/null || {
    echo "Invalid branch name: $BRANCH" >&2
    exit 1
}

# Resolve from the script so invocation from another directory cannot sync it.
cd "$(dirname "${BASH_SOURCE[0]}")/.."
cd "$(git rev-parse --show-toplevel)"

if ! git remote get-url "$PUBLIC_REMOTE_NAME" >/dev/null 2>&1; then
    echo "==> Adding remote '$PUBLIC_REMOTE_NAME' -> $PUBLIC_REMOTE_URL"
    git remote add "$PUBLIC_REMOTE_NAME" "$PUBLIC_REMOTE_URL"
fi

# Check both fetch and push destinations, including multiple configured URLs.
for mode in fetch push; do
    if [ "$mode" = push ]; then
        urls=$(git remote get-url --push --all "$PUBLIC_REMOTE_NAME")
    else
        urls=$(git remote get-url --all "$PUBLIC_REMOTE_NAME")
    fi
    while IFS= read -r url; do
        case "$url" in
            git@github.com:pinecone-io/pinecone-ts-client.git|https://github.com/pinecone-io/pinecone-ts-client.git|https://github.com/pinecone-io/pinecone-ts-client|ssh://git@github.com/pinecone-io/pinecone-ts-client.git) ;;
            *) echo "ERROR: Unexpected public $mode URL: $url" >&2; exit 1 ;;
        esac
    done <<< "$urls"
done

echo "==> Fetching origin/$BRANCH"
git fetch --no-tags origin "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH"
# Pin the previewed commit even if another process fetches during confirmation.
source_head=$(git rev-parse "refs/remotes/origin/$BRANCH")
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    if [ "$(git rev-parse "refs/heads/$BRANCH")" != "$source_head" ]; then
        echo "NOTE: your local '$BRANCH' differs from 'origin/$BRANCH'."
        echo "      Syncing origin's copy -- push/pull locally first if that's stale."
    fi
fi

# A failed lookup is an error, not evidence that the branch is absent.
public_heads=$(git ls-remote --heads "$PUBLIC_REMOTE_NAME")
has_public_branch() {
    local _sha ref
    while read -r _sha ref; do
        if [ "$ref" = "refs/heads/$1" ]; then return 0; fi
    done <<< "$public_heads"
    return 1
}

baseline_excludes=()
if has_public_branch "$BRANCH"; then
    echo "==> Fetching $PUBLIC_REMOTE_NAME/$BRANCH"
    git fetch --no-tags "$PUBLIC_REMOTE_NAME" "+refs/heads/$BRANCH:refs/remotes/$PUBLIC_REMOTE_NAME/$BRANCH"
    public_head=$(git rev-parse "refs/remotes/$PUBLIC_REMOTE_NAME/$BRANCH")
    if [ "$public_head" = "$source_head" ]; then
        echo "Nothing to sync -- $PUBLIC_REMOTE_NAME/$BRANCH is already up to date."
        exit 0
    fi
    if ! git merge-base --is-ancestor "$public_head" "$source_head"; then
        echo "ERROR: $PUBLIC_REMOTE_NAME/$BRANCH is not an ancestor of origin/$BRANCH." >&2
        echo "Reconcile public commits (including release version bumps) into origin first." >&2
        echo "This script will not force-push." >&2
        exit 1
    fi
    baseline_excludes+=("$public_head")
else
    echo "==> $PUBLIC_REMOTE_NAME/$BRANCH does not exist yet -- it will be created."
    if [ "$BRANCH" != main ] && has_public_branch main; then
        git fetch --no-tags "$PUBLIC_REMOTE_NAME" "+refs/heads/main:refs/remotes/$PUBLIC_REMOTE_NAME/main"
        baseline_excludes+=("$(git rev-parse "refs/remotes/$PUBLIC_REMOTE_NAME/main")")
    fi
fi

if [ ${#baseline_excludes[@]} -gt 0 ]; then
    commits=$(git log --oneline "$source_head" --not "${baseline_excludes[@]}")
else
    commits=$(git log --oneline "$source_head")
fi
echo
echo "Target: $PUBLIC_REMOTE_NAME/$BRANCH -> $source_head"
echo "Commits beyond the public baseline:"
echo "${commits:-No additional commits; the branch will still be created.}"
echo

if [ "$DO_PUSH" = false ]; then
    echo "Dry run only. Re-run with --push to actually sync."
    exit 0
fi
if [ "$ASSUME_YES" = false ]; then
    read -r -p "Push this commit to the PUBLIC repo's $BRANCH? [y/N] " reply
    case "$reply" in
        [yY]|[yY][eE][sS]) ;;
        *) echo "Aborted."; exit 1 ;;
    esac
fi

echo "==> Pushing $BRANCH to $PUBLIC_REMOTE_NAME (fast-forward only)"
# Explicitly disable configured mirroring and automatic tag publication.
git -c remote.public.mirror=false push --no-follow-tags "$PUBLIC_REMOTE_NAME" "$source_head:refs/heads/$BRANCH"
echo "Done. Public repo $BRANCH is now at $source_head."
