package com.rainbowforest.userservice.controller;

import com.rainbowforest.userservice.dto.LoginResponse;
import com.rainbowforest.userservice.entity.User;
import com.rainbowforest.userservice.entity.UserDetails;
import com.rainbowforest.userservice.entity.UserRole;
import com.rainbowforest.userservice.exception.DuplicateEmailException;
import com.rainbowforest.userservice.exception.FirebaseTokenVerificationException;
import com.rainbowforest.userservice.service.AuthService;
import com.rainbowforest.userservice.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "security.jwt.secret=unit-test-only-secret-value-32-bytes",
        "security.auth.cookie-secure=true"
})
@AutoConfigureMockMvc
@WithMockUser(username = "boundary-test-admin", authorities = "ROLE_ADMIN")
class RequestValidationIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private UserService userService;

    @Test
    void loginRejectsBlankCredentialsBeforeCallingService() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userName\":\"   \",\"password\":\"\"}"))
                .andExpect(status().isBadRequest());

        verify(authService, never()).login(any());
    }

    @Test
    void loginRejectsOversizedUsernameBeforeCallingService() throws Exception {
        String oversizedUsername = "a".repeat(51);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userName\":\"" + oversizedUsername + "\",\"password\":\"valid-password\"}"))
                .andExpect(status().isBadRequest());

        verify(authService, never()).login(any());
    }

    @Test
    void refreshRejectsMissingCookieBeforeCallingService() throws Exception {
        mockMvc.perform(post("/auth/refresh"))
                .andExpect(status().isUnauthorized());

        verify(authService, never()).refresh(any());
    }

    @Test
    void loginSetsSecureHttpOnlyCookiesWithoutExposingTokensInJson() throws Exception {
        when(authService.login(any())).thenReturn(new LoginResponse(
                "access-token", "refresh-token", 42L, "valid-user", "ROLE_USER"));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userName\":\"valid-user\",\"password\":\"valid-password\"}"))
                .andExpect(status().isOk())
                .andExpect(cookie().value("rf_access", "access-token"))
                .andExpect(cookie().httpOnly("rf_access", true))
                .andExpect(cookie().secure("rf_access", true))
                .andExpect(cookie().path("rf_access", "/"))
                .andExpect(cookie().value("rf_refresh", "refresh-token"))
                .andExpect(cookie().httpOnly("rf_refresh", true))
                .andExpect(cookie().secure("rf_refresh", true))
                .andExpect(cookie().path("rf_refresh", "/api/accounts/auth"))
                .andExpect(cookie().exists("XSRF-TOKEN"))
                .andExpect(cookie().httpOnly("XSRF-TOKEN", false))
                .andExpect(cookie().maxAge("XSRF-TOKEN", 604800))
                .andExpect(header().stringValues("Set-Cookie",
                        org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.containsString("SameSite=Strict"))))
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(jsonPath("$.userId").value(42L))
                .andExpect(jsonPath("$.userName").value("valid-user"))
                .andExpect(jsonPath("$.role").value("ROLE_USER"));
    }

    @Test
    void adminLoginSetsOnlyAdminCookiesForAdminAccount() throws Exception {
        when(authService.login(any())).thenReturn(new LoginResponse(
                "admin-access-token", "admin-refresh-token", 7L, "admin-user", "ROLE_ADMIN"));

        mockMvc.perform(post("/auth/login")
                        .header("X-Auth-Scope", "admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userName\":\"admin-user\",\"password\":\"valid-password\"}"))
                .andExpect(status().isOk())
                .andExpect(cookie().value("rf_admin_access", "admin-access-token"))
                .andExpect(cookie().value("rf_admin_refresh", "admin-refresh-token"))
                .andExpect(cookie().value("XSRF-ADMIN-TOKEN", org.hamcrest.Matchers.not(org.hamcrest.Matchers.blankString())))
                .andExpect(cookie().doesNotExist("rf_access"))
                .andExpect(cookie().doesNotExist("rf_refresh"))
                .andExpect(cookie().doesNotExist("XSRF-TOKEN"));
    }

    @Test
    void adminLoginRejectsCustomerWithoutCreatingAdminCookies() throws Exception {
        when(authService.login(any())).thenReturn(new LoginResponse(
                "customer-access-token", "customer-refresh-token", 42L, "valid-user", "ROLE_USER"));

        mockMvc.perform(post("/auth/login")
                        .header("X-Auth-Scope", "admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userName\":\"valid-user\",\"password\":\"valid-password\"}"))
                .andExpect(status().isForbidden())
                .andExpect(cookie().doesNotExist("rf_admin_access"))
                .andExpect(cookie().doesNotExist("rf_admin_refresh"))
                .andExpect(cookie().doesNotExist("XSRF-ADMIN-TOKEN"));
    }

    @Test
    void adminLogoutRevokesAndExpiresOnlyAdminCookies() throws Exception {
        mockMvc.perform(post("/auth/logout")
                        .header("X-Auth-Scope", "admin")
                        .cookie(new jakarta.servlet.http.Cookie("rf_admin_access", "admin-access-token"))
                        .cookie(new jakarta.servlet.http.Cookie("rf_admin_refresh", "admin-refresh-token"))
                        .cookie(new jakarta.servlet.http.Cookie("rf_access", "customer-access-token")))
                .andExpect(status().isOk())
                .andExpect(cookie().maxAge("rf_admin_access", 0))
                .andExpect(cookie().maxAge("rf_admin_refresh", 0))
                .andExpect(cookie().maxAge("XSRF-ADMIN-TOKEN", 0))
                .andExpect(cookie().doesNotExist("rf_access"));

        verify(authService).logout("admin-access-token", "admin-refresh-token");
    }

    @Test
    void refreshUsesCookieAndRotatesTokenCookies() throws Exception {
        when(authService.refresh("old-refresh-token")).thenReturn(new LoginResponse(
                "new-access-token", "new-refresh-token", 42L, "valid-user", "ROLE_USER"));

        mockMvc.perform(post("/auth/refresh")
                        .cookie(new jakarta.servlet.http.Cookie("rf_refresh", "old-refresh-token")))
                .andExpect(status().isOk())
                .andExpect(cookie().value("rf_access", "new-access-token"))
                .andExpect(cookie().value("rf_refresh", "new-refresh-token"))
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.refreshToken").doesNotExist());

        verify(authService).refresh("old-refresh-token");
    }

    @Test
    void logoutRevokesCookieTokensAndExpiresAllAuthCookies() throws Exception {
        mockMvc.perform(post("/auth/logout")
                        .cookie(new jakarta.servlet.http.Cookie("rf_access", "access-token"))
                        .cookie(new jakarta.servlet.http.Cookie("rf_refresh", "refresh-token")))
                .andExpect(status().isOk())
                .andExpect(cookie().maxAge("rf_access", 0))
                .andExpect(cookie().maxAge("rf_refresh", 0))
                .andExpect(cookie().maxAge("XSRF-TOKEN", 0));

        verify(authService).logout("access-token", "refresh-token");
    }

    @Test
    void firebaseLoginReturnsUnauthorizedForRejectedTokenWithoutDetails() throws Exception {
        when(authService.loginWithFirebase("rejected-token")).thenThrow(
                new FirebaseTokenVerificationException(
                        FirebaseTokenVerificationException.Category.INVALID_TOKEN,
                        "internal Firebase detail"));

        mockMvc.perform(post("/auth/firebase-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"rejected-token\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$").doesNotExist());
    }

    @Test
    void firebaseLoginReturnsServiceUnavailableForFirebaseUpstreamFailure() throws Exception {
        when(authService.loginWithFirebase("upstream-token")).thenThrow(
                new FirebaseTokenVerificationException(
                        FirebaseTokenVerificationException.Category.UPSTREAM_UNAVAILABLE,
                        "internal Firebase detail"));

        mockMvc.perform(post("/auth/firebase-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"upstream-token\"}"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$").doesNotExist());
    }

    @Test
    void registrationRejectsMissingPasswordBeforeCallingService() throws Exception {
        mockMvc.perform(post("/auth/registration")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userName\":\"valid-user\"}"))
                .andExpect(status().isBadRequest());

        verify(userService, never()).saveUser(any(User.class));
    }

    @Test
    void registrationRejectsMissingEmailBeforeCallingService() throws Exception {
        mockMvc.perform(post("/auth/registration")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userName\":\"valid-user\",\"userPassword\":\"valid-password\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Email is required")));

        verify(userService, never()).saveUser(any(User.class));
    }

    @Test
    void registrationRejectsOversizedUsernameBeforeCallingService() throws Exception {
        String oversizedUsername = "a".repeat(51);

        mockMvc.perform(post("/auth/registration")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userName\":\"" + oversizedUsername
                                + "\",\"email\":\"valid@example.com\",\"userPassword\":\"valid-password\"}"))
                .andExpect(status().isBadRequest());

        verify(userService, never()).saveUser(any(User.class));
    }

    @Test
    void registrationResponseDoesNotExposePassword() throws Exception {
        User savedUser = savedUserWithPassword();
        when(userService.saveUser(any(User.class))).thenReturn(savedUser);

        mockMvc.perform(post("/auth/registration")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userName\":\"valid-user\",\"email\":\"valid@example.com\",\"userPassword\":\"valid-password\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(42L))
                .andExpect(jsonPath("$.userName").value("valid-user"))
                .andExpect(jsonPath("$.userPassword").doesNotExist());
    }

    @Test
    void registrationMapsAndNormalizesTopLevelEmail() throws Exception {
        doAnswer(invocation -> {
            User submitted = invocation.getArgument(0);
            org.junit.jupiter.api.Assertions.assertEquals(
                    "customer@example.com",
                    submitted.getUserDetails().getEmail());
            User saved = savedUserWithPassword();
            saved.getUserDetails().setEmail(submitted.getUserDetails().getEmail());
            return saved;
        }).when(userService).saveUser(any(User.class));

        mockMvc.perform(post("/auth/registration")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"userName":"valid-user","email":"  Customer@Example.com  ","userPassword":"valid-password"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userDetails.email").value("customer@example.com"));
    }

    @Test
    void registrationReturnsConflictWhenEmailAlreadyExists() throws Exception {
        when(userService.saveUser(any(User.class)))
                .thenThrow(new DuplicateEmailException("Email is already in use"));

        mockMvc.perform(post("/auth/registration")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"userName":"valid-user","email":"existing@example.com","userPassword":"valid-password"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Email is already in use"));
    }

    @Test
    void userCreationRejectsMissingUsernameBeforeCallingService() throws Exception {
        mockMvc.perform(post("/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userPassword\":\"valid-password\"}"))
                .andExpect(status().isBadRequest());

        verify(userService, never()).saveUser(any(User.class));
    }

    @Test
    void userCreationResponseDoesNotExposePassword() throws Exception {
        when(userService.saveUser(any(User.class))).thenReturn(savedUserWithPassword());

        mockMvc.perform(post("/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userName\":\"valid-user\",\"email\":\"valid@example.com\",\"userPassword\":\"valid-password\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(42L))
                .andExpect(jsonPath("$.userPassword").doesNotExist());
    }

    @Test
    void adminUserListDoesNotExposePassword() throws Exception {
        when(userService.getAllUsers()).thenReturn(List.of(savedUserWithPassword()));

        mockMvc.perform(get("/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(42L))
                .andExpect(jsonPath("$[0].userPassword").doesNotExist())
                .andExpect(jsonPath("$[0].role").value("ROLE_ADMIN"))
                .andExpect(jsonPath("$[0].roleName").doesNotExist())
                .andExpect(jsonPath("$[0].userDetails.id").doesNotExist());
    }

    private User savedUserWithPassword() {
        UserRole role = new UserRole();
        role.setId(9L);
        role.setRoleName("ROLE_ADMIN");

        UserDetails details = new UserDetails();
        details.setId(7L);
        details.setFirstName("Valid");
        details.setLastName("User");
        details.setEmail("valid@example.com");

        User savedUser = new User();
        savedUser.setId(42L);
        savedUser.setUserName("valid-user");
        savedUser.setUserPassword("bcrypt-password-hash");
        savedUser.setRole(role);
        savedUser.setUserDetails(details);
        return savedUser;
    }
}
