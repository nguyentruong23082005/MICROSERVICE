# Testing Patterns

**Analysis Date:** 2026-06-08

## Test Framework

**Runner:**
- JUnit 4 / JUnit 5 (integrated via `spring-boot-starter-test`).
- Spring Boot Test context support (`@SpringBootTest` and `@WebMvcTest`).

**Assertion Library:**
- Spring MockMvc matchers (`status()`, `jsonPath()`, `content()`).
- Mockito assertion matchers (`then()`, `verify()`).
- Standard JUnit assertions (`assertEquals()`, `assertNotNull()`).

**Run Commands:**
```bash
.\mvnw.cmd clean test                         # Run all tests in a service (Windows)
./mvnw clean test                             # Run all tests in a service (Unix/macOS)
.\mvnw.cmd test -Dtest=UserControllerTests    # Run a specific test suite
```

## Test File Organization

**Location:**
- Located inside `src/test/java/` in each service under the corresponding package structure.

**Naming:**
- suffix `Tests.java` or `Test.java` (e.g., `UserControllerTests.java`, `ProductServiceTests.java`).

**Structure:**
```
[service-directory]/
└── src/
    └── test/
        └── java/
            └── com/
                └── rainbowforest/
                    └── [service]/
                        ├── [Service]ApplicationTests.java
                        ├── controller/
                        │   └── [Controller]Tests.java
                        └── service/
                            └── [Service]Tests.java
```

## Test Structure

**Suite Organization (Controller Test Example):**
```java
@RunWith(SpringRunner.class)
@WebMvcTest(UserController.class)
public class UserControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private HeaderGenerator headerGenerator;

    @Test
    public void testGetAllUsersSuccess() throws Exception {
        // Arrange
        List<User> users = Arrays.asList(new User(), new User());
        when(userService.getAllUsers()).thenReturn(users);

        // Act & Assert
        mockMvc.perform(get("/users"))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$", hasSize(2)));
    }
}
```

## Mocking

**Framework:**
- **Mockito** - for mocking service interfaces in Controller tests.
  - Declared via `@MockBean` inside web layer tests.
  - Stubbed using `when(mockObject.method()).thenReturn(value)`.
- **Hoverfly** - for API mocking in `product-recommendation-service` tests.
  - Used in `RecommendationServiceTests.java` to simulate product catalog and user microservice endpoints.

## Fixtures and Factories

**Test Data:**
- Simple inline creation or private helper methods inside test files to populate mock data lists.
- Mock database setups are not heavily featured; they rely on Mockito behavior stubs.

## Test Types

**Context Load Tests:**
- Each microservice has an `*ApplicationTests.java` file verifying the Spring application context boots correctly.

**Controller/API Tests:**
- Tests endpoints in isolation by mocking service calls using MockMvc.

**Service Logic Tests:**
- Unit tests validating business rules (e.g. `OrderServiceTests.java`) by mocking repositories.

---

*Testing analysis: 2026-06-08*
*Update when test patterns change*
