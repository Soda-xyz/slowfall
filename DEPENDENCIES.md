# Dependency Summary

This document provides a summary of all top-level dependencies and packages used in the slowfall project.

## Backend Dependencies (Gradle/Java)

### Gradle Plugins

**org.springframework.boot (v3.5.7)**
- Primary application framework plugin for Spring Boot applications
- Provides auto-configuration, dependency management, and executable JAR packaging for the backend

**io.spring.dependency-management (v1.1.7)**
- Manages dependency versions across the Spring ecosystem
- Ensures compatible versions of Spring libraries are used together

**com.diffplug.spotless (v6.25.0)**
- Code formatting and style enforcement tool
- Configured to use Palantir Java Format for consistent code style

**checkstyle (v10.12.7)**
- Static code analysis tool for enforcing coding standards
- Configured via `config/checkstyle.xml` to ensure code quality

### Runtime Dependencies

**org.springframework.boot:spring-boot-starter-data-jpa**
- Provides JPA (Java Persistence API) support for database access
- Used for ORM (Object-Relational Mapping) to interact with the database using entities

**org.springframework.boot:spring-boot-starter-validation**
- Bean validation with Hibernate Validator
- Enables annotation-based validation of request/response data (e.g., @NotNull, @Valid)

**org.springframework.boot:spring-boot-starter-web**
- Core web application framework with embedded Tomcat
- Provides REST API capabilities and MVC support for the backend

**org.springframework.boot:spring-boot-starter-websocket**
- WebSocket support for real-time bidirectional communication
- Likely used for live updates in the skydive dashboard application

**org.springframework.boot:spring-boot-starter-aop**
- Aspect-Oriented Programming support
- Used for cross-cutting concerns like the LoggingAspect mentioned in the README

**org.springframework.boot:spring-boot-starter-actuator**
- Production-ready monitoring and management endpoints
- Provides health checks, metrics, and operational insights

**com.h2database:h2**
- Lightweight in-memory database
- Used for development/testing purposes as a runtime-only dependency

**net.logstash.logback:logstash-logback-encoder (v9.0)**
- JSON logging encoder for structured logging
- Formats logs in a machine-readable format compatible with ELK stack

### Test Dependencies

**org.springframework.boot:spring-boot-starter-test**
- Comprehensive testing framework including JUnit, Mockito, AssertJ
- Provides all necessary tools for unit and integration testing

**org.junit.platform:junit-platform-launcher**
- Runtime support for launching JUnit tests
- Required for test execution in the Gradle environment

## Frontend Dependencies (npm/React)

### Core Framework Dependencies

**react (v19.2.1)**
- Core React library for building user interfaces
- The fundamental framework for the frontend application

**react-dom (v19.2.1)**
- React rendering library for web browsers
- Handles the DOM manipulation and rendering of React components

**react-router-dom (v6.30.2)**
- Client-side routing library for React
- Manages navigation and URL routing in the single-page application

### UI Framework

**@mantine/core (v8.3.9)**
- Comprehensive React component library
- Provides pre-built, accessible UI components (buttons, inputs, modals, etc.) for the dashboard interface

**@mantine/dates (v8.3.9)**
- Date picker and date-related components from Mantine
- Used for date selection in the skydive scheduling/tracking features

**@mantine/hooks (v8.3.9)**
- Collection of React hooks from Mantine
- Provides utility hooks for common UI patterns (viewport, media queries, etc.)

**@mantine/notifications (v8.3.9)**
- Toast notification system from Mantine
- Displays user feedback messages and alerts in the UI

**@tabler/icons-react (v3.35.0)**
- Icon library with React components
- Provides SVG icons that integrate seamlessly with Mantine components

### Utilities

**dayjs (v1.11.9)**
- Lightweight date/time manipulation library
- Alternative to moment.js for parsing, validating, and formatting dates

## Frontend Development Dependencies

### Build Tools

**vite (v7.2.4)**
- Next-generation frontend build tool
- Provides fast development server with hot module replacement and optimized production builds

**@vitejs/plugin-react (v5.1.0)**
- Official Vite plugin for React support
- Enables React Fast Refresh and JSX transformation

**vite-plugin-checker (v0.11.0)**
- Runs TypeScript and ESLint checks during build
- Provides faster feedback on type and lint errors

**vite-plugin-eslint (v1.7.0)**
- Integrates ESLint into Vite development workflow
- Shows linting errors in the browser console during development

### TypeScript

**typescript (~5.9.3)**
- Static type checking for JavaScript
- Provides type safety and better IDE support throughout the frontend codebase

**@types/node (v24.10.0)**
- TypeScript type definitions for Node.js APIs
- Enables type checking for Node.js built-in modules

**@types/react (v19.2.7)**
- TypeScript type definitions for React
- Provides type safety for React components and hooks

**@types/react-dom (v19.2.3)**
- TypeScript type definitions for React DOM
- Provides type safety for React DOM APIs

### Code Quality Tools

**eslint (v9.39.1)**
- JavaScript/TypeScript linter for identifying code issues
- Enforces code quality and consistency across the frontend

**@eslint/js (v9.39.1)**
- ESLint's default JavaScript configuration
- Provides base linting rules for JavaScript

**@typescript-eslint/eslint-plugin (v8.46.4)**
- ESLint rules specific to TypeScript
- Catches TypeScript-specific issues and bad patterns

**@typescript-eslint/parser (v8.46.4)**
- Parser for ESLint to understand TypeScript syntax
- Enables ESLint to analyze TypeScript code

**eslint-config-prettier (v10.1.8)**
- Disables ESLint rules that conflict with Prettier
- Ensures ESLint and Prettier work together without conflicts

**eslint-plugin-import (v2.32.0)**
- ESLint rules for import/export statements
- Enforces consistent import ordering and prevents import errors

**eslint-plugin-jsx-a11y (v6.7.1)**
- Accessibility linting for JSX elements
- Ensures the application follows accessibility best practices

**eslint-plugin-prettier (v5.5.4)**
- Runs Prettier as an ESLint rule
- Reports formatting issues as ESLint errors

**eslint-plugin-react (v7.32.2)**
- React-specific linting rules
- Enforces React best practices and coding patterns

**eslint-plugin-react-hooks (v7.0.1)**
- Enforces rules of React Hooks
- Prevents common mistakes with useState, useEffect, and other hooks

**eslint-plugin-tsdoc (v0.5.0)**
- Linting for TSDoc comments
- Ensures consistent and valid TypeScript documentation comments

**eslint-import-resolver-typescript (v4.4.4)**
- Resolves TypeScript paths for eslint-plugin-import
- Enables ESLint to understand TypeScript path mappings

**prettier (v3.6.2)**
- Opinionated code formatter
- Automatically formats code for consistency across the team

**globals (v16.5.0)**
- Global variable definitions for ESLint
- Provides environment-specific global variable declarations

### Testing

**vitest (v4.0.14)**
- Fast unit test framework powered by Vite
- Modern alternative to Jest with native ESM support and faster execution

**@testing-library/react (v16.3.0)**
- Testing utilities for React components
- Encourages testing from the user's perspective

**@testing-library/jest-dom (v6.0.0)**
- Custom Jest matchers for DOM assertions
- Provides readable assertions like toBeInTheDocument(), toHaveClass()

**@testing-library/user-event (v14.6.1)**
- User interaction simulation for tests
- Simulates realistic user interactions (clicks, typing, etc.)

**jsdom (v27.2.0)**
- JavaScript implementation of web standards
- Provides a DOM environment for running tests in Node.js

## Summary

The slowfall project is a **full-stack web application** built with:
- **Backend**: Java 21 + Spring Boot 3.5.7 with JPA, WebSocket, and AOP support
- **Frontend**: React 19 + TypeScript + Mantine UI + Vite

The backend provides a robust REST API with WebSocket support for real-time features, structured logging, and comprehensive monitoring. The frontend is a modern single-page application with a rich component library, strong type safety, and comprehensive testing infrastructure.
