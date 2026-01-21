# create-improvement

Create a Linear issue for this work in the "SDK Maintenance" project.

Give the issue these labels:

- sdk:ts
- Improvement

Include the plan and any relevant context in the issue description.

If the plan was made to address a GitHub issue, be sure to include a link to the original GitHub issue in the description.

Every Linear issue created should include these additional instructions at the end of the description.

```
When the planned code changes are complete, the agent should take the following steps:

1. **Code Quality Review**
   - Review JSDoc comments near the changed code to ensure they are still up to date
   - Ensure the code compiles (TypeScript) and that unit tests pass
   - Ensure changes are adequately tested

2. **Create Pull Request**
   - Create a PR
   - Rename the PR with a title that follows the Conventional Commits 1.0.0 format
   - Update the PR description with:
     - A clear description of the problem and solution
     - A reference to the related Github issue, if any, as well as the Linear issue number.
     - Examples showing how to use the code that was changed
     - A summary of the value and approach taken in the work (without overwhelming detail - reviewers can read the code for specifics)
```

