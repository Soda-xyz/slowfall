# Commit Activity Summary

## Saturday, November 30, 2025
- Implemented login page with authentication flow and protected routes
- Added token store with refresh functionality and cross-tab synchronization
- Created comprehensive tests for login, protected routes, and token management
- Updated documentation (README, README_ENV)

## Friday, November 29, 2025
- Continued CI/CD pipeline improvements and troubleshooting
- Fixed logback configuration by using springProperty and removing Janino-dependent conditionals
- Added Docker entrypoint script to decode APP_SECURITY_JKS_BASE64 to keystore
- Updated frontend and backend Dockerfiles
- Configured frontend Dockerfile with environment variable injection and nginx setup

## Thursday, November 28, 2025
- Set up CI/CD pipeline with GitHub Actions workflow
- Configured Docker deployments for frontend and backend
- Fixed logback logging configuration
- Updated JWKS controller tests
- Prepared codebase for cloud deployment with documentation (README_CLOUD.md, README_ENV.md)
- Added login control component to frontend
- Updated API clients with environment-aware configuration

## Wednesday, November 27, 2025
- Added TSDoc comments and cleaned up code
- Worked on Playwright testing for jump form (faced challenges)
- Fixed bugs with Playwright test and Vitest integration
- Created Docker security configuration MVP
- Made big UX improvements with theme work

## Tuesday, November 26, 2025
- Added linting and formatting using Prettier and ESLint
- Fixed LF/CRLF line ending inconsistencies

## Sunday, November 24, 2025
- Fixed jump controller tests
- Improved PersonForm component
- Refactored jump-related entities (CreateJumpRequest, JumpController, JumpDto, JumpService, Jump domain)

## Saturday, November 23, 2025
- Refactored code using "skydiver" naming convention for consistency
- Worked on refactoring and tests
- Controller refactoring MVP

## Friday, November 22, 2025
- Initial project setup
- Started controller refactoring
