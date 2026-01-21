# investigate-github-issue

Conduct a thorough, deep investigation of a GitHub issue to understand root causes, verify behavior, and produce actionable next steps.

**When to use this command:**

- After `github-triage` has determined the issue needs investigation (has `needs-investigation` label)
- When you need to understand root causes before creating a fix plan
- When an issue is complex or unclear and needs code analysis
- When you need to assess impact and scope before prioritizing

**When NOT to use this command:**

- For initial triage (use `github-triage` instead)
- For simple, clear-cut bugs with obvious fixes
- For straightforward feature requests that don't need technical analysis

**IMPORTANT: This command must be idempotent.** Before starting, check:

- If a Linear investigation issue already exists for this GitHub issue
- If an investigation has already been completed and documented
- The current state of the GitHub issue (open/closed, labels, comments)
- If `github-triage` has already been run (if not, run it first for proper labeling)

## Investigation Process

### 1. **Understand the Issue**

- Read the GitHub issue title, description, and all comments thoroughly
- Extract key information:
  - Problem description and expected vs actual behavior
  - Code examples, error messages, stack traces
  - Environment details (Node.js version, TypeScript version, SDK version, OS, dependencies)
  - Steps to reproduce (if provided)
  - Related issues or PRs mentioned
- Identify what type of issue this is (bug, feature request, question, etc.)
- Note any ambiguity or missing information

### 2. **Codebase Analysis**

- Search for relevant code using semantic search:
  - Identify components/modules mentioned in the issue
  - Find code paths that handle the described functionality
  - Locate error handling or validation logic related to the issue
  - Find tests that might be relevant
- Read and analyze the relevant source code:
  - Understand the current implementation
  - Identify potential root causes
  - Check for similar patterns or related code
  - Review error handling and edge cases
- Check test coverage:
  - Find existing tests for the affected functionality
  - Identify gaps in test coverage
  - Review test cases that might be related

### 3. **Reproduction and Verification**

- **Note**: This is deeper than triage-level verification. Focus on understanding the technical conditions.
- If reproduction steps are provided:
  - Trace through the code paths that would be executed during reproduction
  - Analyze the code to understand what conditions are required
  - Identify edge cases or specific configurations needed
  - Document the exact code flow that leads to the issue
- If reproduction steps are missing:
  - Analyze the code to determine what minimal information would be needed
  - Suggest specific reproduction cases based on code analysis
  - Identify what code paths need to be exercised
- Check for similar issues:
  - Search GitHub issues for similar problems
  - Check Linear for related investigations or bugs
  - Look for patterns across multiple issues
  - Analyze if this is part of a broader problem

### 4. **Root Cause Analysis**

- Analyze the code to identify potential causes:
  - Logic errors or bugs
  - Missing validation or error handling
  - Race conditions or concurrency issues
  - API contract violations
  - Configuration or environment issues
- Consider edge cases:
  - Boundary conditions
  - Error scenarios
  - Integration points
- Review related code:
  - Dependencies and how they interact
  - Recent changes that might have introduced the issue
  - Design decisions that might be relevant

### 5. **Impact Assessment**

- Determine the severity and scope:
  - How many users might be affected?
  - Is this a regression or a long-standing issue?
  - What's the impact on functionality?
- Identify affected areas:
  - Which components/modules are involved?
  - Are there related features that might be affected?
  - What are the dependencies?

### 6. **Document Findings**

Create a comprehensive investigation report that includes:

**Summary**

- Brief overview of the issue
- Type of issue (bug, feature request, etc.)
- Severity assessment

**Analysis**

- Key findings from codebase analysis
- Root cause hypothesis (if identified)
- Relevant code references with explanations
- Related issues or patterns found

**Reproduction Status**

- Can the issue be reproduced? (Yes/No/Needs Info)
- Reproduction steps (if available or if created)
- What information is still needed (if any)

**Impact**

- Severity and scope
- Affected components
- User impact

**Next Steps**

- Recommended actions:
  - If bug: Create Linear bug issue with fix plan using the create-bug command
  - If feature: Create Linear improvement issue with implementation plan via the create-improvement command
  - If needs more info: Document what's needed and suggest follow-up
  - If question: Provide answer or documentation reference
- Suggested priority
- Estimated effort (if determinable)
- Dependencies or blockers

### 8. **Update GitHub Issue (If Appropriate)**

- If new information was discovered, consider adding a comment:
  - Share key findings and root cause analysis
  - Provide code references with explanations
  - Suggest next steps and recommended actions
  - Request additional information if needed (only if not already requested in triage)
- Update labels if investigation reveals new information:
  - Remove `needs-investigation` if investigation is complete
  - Add `reproduced` if reproduction was successful
  - Update priority labels if impact assessment changed
- Only comment if it adds value and hasn't been covered in existing comments

## Output Format

The investigation should produce a structured report that can be:

- Used to create a Linear issue (if needed)
- Used as a basis for creating bug or improvement issues (preferred if investigation is complete)
- Shared with the team for decision-making
- Referenced when implementing fixes

Focus on actionable insights and clear next steps rather than just summarizing the issue.

## Workflow Integration

**This command typically follows `github-triage`:**

1. `github-triage` → Quick assessment, labels issue as `needs-investigation`
2. `investigate-github-issue` → Deep analysis (this command)
3. Based on findings → Create Linear issue (`create-bug`, `create-improvement`, or `create-investigation`)

**This command can also be used standalone** when you already know an issue needs deep investigation.
