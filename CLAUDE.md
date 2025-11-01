AI Coding Assistant Context
Core Principles

    DRY (Don't Repeat Yourself) - Avoid code duplication
    KISS (Keep It Simple, Stupid) - Prefer simplicity
    YAGNI (You Aren't Gonna Need It) - Don't add unnecessary functionality
    SOLID - Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion /cl

Code Quality

    Prefer functional approaches and pure functions
    Use strict typing and explicit parameters
    Write self-documenting code with clear names
    Keep functions small and focused
    Check if logic exists before writing new code

Error Handling

    Use guard clauses and early returns
    Handle errors at function start
    Always raise errors explicitly with descriptive messages
    Validate all inputs

Security

    Validate and sanitize all inputs
    Implement proper authentication/authorization
    Use HTTPS for external requests
    Never commit secrets or credentials

Testing

    Write meaningful automated tests
    Test edge cases and error conditions
    Maintain critical path coverage

Changes

    Make focused, minimal changes only
    Respect existing patterns and architecture
    Avoid unnecessary refactoring

Documentation

    Write clear commit messages
    Document complex logic and architectural decisions
    Comment the "why" not the "what"
    Please ALWAYS check if we are up to date with the remote end before we make a change, and check at the end if we should commit and push the changes to git
    Before making any database change, ALWAYS perform a local dump of the database into database_backups directory please. Create if not present.
