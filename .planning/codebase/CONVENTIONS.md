# Coding Conventions

**Analysis Date:** 2026-06-08

## Naming Patterns

**Files:**
- PascalCase for all Java classes, interfaces, and entities (e.g., `RegisterController.java`, `CartService.java`).
- lowercase/snake_case for resource files (e.g., `application.properties`).

**Methods & Functions:**
- camelCase for all methods (e.g., `getAllUsers()`, `getUserById(Long id)`, `addItemToCart()`).
- Getters/Setters follow standard JavaBeans pattern (`getId()`, `setId(Long id)`).

**Variables:**
- camelCase for local variables and fields (e.g., `userService`, `cartId`, `headerGenerator`).
- UPPER_SNAKE_CASE for static final constants.

**Packages:**
- lowercase, dot-separated names (e.g., `package com.rainbowforest.userservice.controller`).

## Code Style

**Formatting:**
- Standard Java syntax with braces starting on the same line.
- 4-space indentation for code blocks.
- Semicolons are required.

**Dependency Injection:**
- Relies on field-level injection using `@Autowired` annotation. (Note: Recommend refactoring to constructor injection during the Spring Boot 3.x upgrade).

## Import Organization

**Order:**
1. Standard Java imports (`java.util.*`, `java.time.*`).
2. Third-party packages (`org.projectlombok`, `com.fasterxml.jackson`).
3. Spring Framework dependencies (`org.springframework.*`).
4. Microservice internal imports (`com.rainbowforest.*`).

## Error Handling

**Patterns:**
- Errors in database operations or downstream client queries are caught locally within controllers using `try-catch` blocks.
- Caught exceptions print stack traces to stdout using `e.printStackTrace()`.
- Controllers return appropriate HTTP Status codes (`HttpStatus.NOT_FOUND`, `HttpStatus.BAD_REQUEST`, `HttpStatus.INTERNAL_SERVER_ERROR`) along with an error header object constructed by `HeaderGenerator`.

## Logging

**Framework:**
- SLF4J with Logback (the default Spring Boot logging framework).
- Logger instantiation:
  ```java
  private static final Logger logger = LoggerFactory.getLogger(ClassName.class);
  ```
- Levels: Primarily uses `logger.info()` for tracking requests and actions (e.g., session routing).

## Comments

**TODO Comments:**
- Format: Inline line comments `// TODO` or `//` explaining what is mocked or what needs integration.

---

*Convention analysis: 2026-06-08*
*Update when patterns change*
