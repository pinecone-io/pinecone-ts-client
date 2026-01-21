# create-subplan

Create a detailed implementation plan focused on a specific feature or change.

Make sure the plan includes:

- Consideration for performance, security, maintainability
- The proposed changes should avoid breaking changes to public interfaces
- If breaking changes are unavoidable, include a migration path and deprecation strategy
- The proposed changes should ideally preserve flexibility/extensibility for future changes
- The proposed changes should follow TypeScript/JavaScript idioms and best practices
- Error handling strategy and error class design
- All changes should be thoroughly tested:
  - Use unit tests for the bulk of testing, including errors and edge cases.
  - Use integration tests sparingly to confirm a feature is working end-to-end but without delving into all edge cases.
- All interfaces need high-quality JSDoc comments
    - Use unit tests for the bulk of testing, including errors and edge cases. 
    - Use integration tests sparingly to confirm a feature is working end-to-end but without delving into all edge cases.
- All interfaces need high-quality JSDoc comments
