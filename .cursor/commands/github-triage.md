# github-triage

Quick triage and routing of GitHub issues. This is the **first step** for handling new or updated GitHub issues.

**IMPORTANT: This command must be idempotent.** Before taking any action, check the current state to avoid duplicates:

- Check if a Linear issue already exists for this GitHub issue (search by GitHub issue URL or number)
- Check if comments requesting information have already been posted
- Check if the issue has already been closed
- Check existing labels before adding or removing any

**When to use this command:**
- Initial triage of new GitHub issues
- Quick assessment and routing
- Requesting missing information
- Managing issue lifecycle (labels, closing stale issues)

**When NOT to use this command:**
- For deep code analysis or root cause investigation (use `investigate-github-issue` instead)
- When you need to understand complex technical details before routing

## Triage Process

1. **Categorize the issue**
   - Determine if it's a bug, feature request, question, documentation issue, or other
   - Assess priority based on severity, impact, and user needs (surface-level assessment)
   - Check if it's a duplicate of existing issues (GitHub or Linear)
   - **Update labels**: Ensure appropriate labels are applied:
     - Type labels: `bug`, `enhancement`, `question`, `documentation`, etc.
     - Status labels: `needs-info`, `needs-reproduction`, `needs-investigation`, `in-progress`, etc.
     - Priority labels: `priority:high`, `priority:medium`, `priority:low`, etc.
     - Component/area labels if applicable
     - **Check first**: Review existing labels before adding new ones
     - **Only add**: Labels that are missing and appropriate
     - **Remove**: Incorrect or outdated labels (e.g., remove `needs-info` if information has been provided)

2. **Extract key information**
   - Summarize the problem or request clearly
   - Identify affected components or areas of the codebase (high-level)
   - Note any relevant context (OS, Node.js version, TypeScript version, SDK version, etc.)
   - Extract any code examples or error messages

3. **Quick verification**
   - **Check first**: Review existing comments to see if verification has already been attempted
   - For bug reports: Do a quick check if the issue seems reproducible based on provided information
   - If reproduction seems straightforward and information is complete, note this
   - If the issue is complex, unclear, or needs deeper analysis, add `needs-investigation` label
   - **Update labels**: 
     - Add `needs-reproduction` if reproduction steps are missing or unclear
     - Add `needs-investigation` if deeper technical analysis is needed
     - Remove `needs-reproduction` if reproduction steps are clear and complete

4. **Request additional information (if needed)**
   - **Check first**: Review existing comments to see if information has already been requested
   - **Skip if**: A similar information request comment already exists from a maintainer
   - If key information is missing (version, OS, code example, error logs, etc.), draft a response requesting:
     - Specific details needed to reproduce or understand the issue
     - Code examples or minimal reproduction cases
     - Error messages or stack traces
     - Environment details (Node.js version, TypeScript version, SDK version, OS, etc.)
   - Be polite, specific, and helpful in the request
   - **Update labels**: Add `needs-info` label if not already present

5. **Handle incomplete issues**
   - **Check first**: Verify the issue is still open (don't attempt to close if already closed)
   - **Check first**: Verify that an information request was made and enough time has passed
   - **Skip if**: The issue has already been closed for this reason
   - If an issue has been open for an extended period without the requested information:
     - Check if enough time has passed since the information request
     - Draft a closing comment explaining why the issue is being closed
     - Offer to reopen if the information becomes available
     - Close the issue with an appropriate label (e.g., "needs-info", "stale")

6. **Route to next step**
   - **Check first**: Search Linear for an existing issue linked to this GitHub issue before creating a new one
   - **Skip if**: A Linear issue already exists for this GitHub issue
   - **Route based on issue state:**
     - **Clear bug with reproduction steps**: Create Linear bug issue using `create-bug` command
     - **Clear feature request**: Create Linear improvement issue using `create-improvement` command
     - **Needs investigation** (complex, unclear root cause, or needs code analysis): 
       - Add `needs-investigation` label
       - Recommend using `investigate-github-issue` command for deep analysis
     - **Question**: Provide a helpful answer or direct to documentation (only if not already answered)
     - **Missing information**: Wait for user response (already handled in step 4)

7. **Link tracking**
   - Always include the GitHub issue URL when creating Linear issues
   - Maintain bidirectional references between GitHub and Linear
   - If a Linear issue already exists, update it with any new information rather than creating a duplicate

## Workflow Integration

**Typical workflow:**
1. Run `github-triage` for initial assessment and routing
2. If triage determines `needs-investigation`, run `investigate-github-issue` for deep analysis
3. Based on investigation results, create appropriate Linear issues (`create-bug`, `create-improvement`, or `create-investigation`)

**When multiple issues are provided**, prioritize them and suggest a triage order based on:
- Severity and user impact
- Dependencies between issues
- Effort required to resolve

## Batch Processing Workflow

To triage all GitHub issues iteratively:

### Option 1: Manual Iteration
1. Fetch a list of open GitHub issues (use GitHub CLI or API):
   ```bash
   gh issue list --state open --limit 100
   ```
2. For each issue, invoke this command with the issue URL or number:
   - Provide the GitHub issue URL: `https://github.com/owner/repo/issues/123`
   - Or provide the issue number and repository context
3. Process issues one at a time, allowing the command to be idempotent (it will skip already-processed issues)

### Option 2: Automated Batch Processing
When processing multiple issues:
1. **Fetch all open issues** first (using GitHub API or CLI)
2. **Prioritize the list** based on:
   - Issues without labels (untriaged)
   - Issues with `needs-info` that have received responses
   - Issues with `needs-reproduction` that now have reproduction steps
   - Recently updated issues
   - High-priority labels
3. **Process in batches** (e.g., 5-10 at a time) to avoid overwhelming the system
4. **Review results** after each batch before proceeding

### Option 3: Focused Triage
To triage specific subsets:
- **Untriaged issues**: `gh issue list --label "status:needs-triage" --state open`
- **Issues needing info**: `gh issue list --label "needs-info" --state open`
- **Issues needing reproduction**: `gh issue list --label "needs-reproduction" --state open`
- **Recently updated**: `gh issue list --state open --limit 20 --sort updated`

### Best Practices for Batch Triage
- Start with untriaged issues (no status labels)
- Process high-priority issues first
- Review the command output for each issue to ensure proper routing
- If an issue needs investigation, mark it and move on (investigate separately)
- Keep a log of issues that need follow-up (e.g., waiting for user response)
