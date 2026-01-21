# list-github-issues

List GitHub issues for batch triage or review. This helper command fetches issues and prepares them for processing with `github-triage`.

## Usage

This command helps you get a list of GitHub issues to process. You can then use the issue URLs/numbers with `github-triage` for iterative processing.

## Output Format

The command should provide:

- Issue numbers and URLs
- Current labels (especially status labels)
- Last updated date
- Issue title
- Priority suggestion based on labels and recency

## Filtering Options

When listing issues, consider filtering by:

- **State**: `open`, `closed`
- **Labels**: `status:needs-triage`, `needs-info`, `needs-reproduction`, `needs-investigation`
- **Sort order**: `created`, `updated`, `comments`
- **Limit**: Number of issues to fetch (start with 20-50 for manageable batches)

## Suggested Workflow

1. **List untriaged issues**:

   ```
   List open issues with no status labels or with "status:needs-triage" label
   ```

2. **Prioritize the list**:

   - Issues without any status labels (highest priority)
   - Issues with `needs-info` that have new comments
   - Issues with `needs-reproduction` that have new information
   - Recently updated issues

3. **Process iteratively**:

   - Take the first N issues from the prioritized list
   - For each issue, run `github-triage` with the issue URL/number
   - Review results before proceeding to the next batch

4. **Track progress**:
   - Note which issues were processed
   - Identify issues that need follow-up (investigation, waiting for info, etc.)
   - Update your list to exclude already-processed issues

## Integration with github-triage

After listing issues, use the issue URLs/numbers with `github-triage`:

- Provide issue URLs: `https://github.com/owner/repo/issues/123`
- Or provide issue numbers with repository context
- Process one at a time or in small batches

The `github-triage` command is idempotent, so you can safely re-run it on issues that have already been processed.
