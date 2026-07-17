package com.rainbowforest.userservice.service;

import com.rainbowforest.userservice.client.NotificationClient;
import com.rainbowforest.userservice.dto.LoginRequest;
import com.rainbowforest.userservice.dto.LoginResponse;
import com.rainbowforest.userservice.entity.User;
import com.rainbowforest.userservice.entity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTests {

    @Mock
    private UserService userService;

    @Mock
    private JwtTokenService jwtTokenService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private FirebaseIdentityService firebaseIdentityService;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private NotificationClient notificationClient;

    private AuthServiceImpl authService;
    private User activeUser;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(
                userService,
                jwtTokenService,
                passwordEncoder,
                firebaseIdentityService,
                redisTemplate,
                notificationClient,
                "http://localhost:5173");
        UserRole role = new UserRole();
        role.setRoleName("ROLE_USER");
        activeUser = new User();
        activeUser.setId(42L);
        activeUser.setUserName("customer");
        activeUser.setUserPassword("encoded-password");
        activeUser.setActive(1);
        activeUser.setRole(role);
    }

    @Test
    void loginAcceptsUsernameIdentifier() {
        LoginRequest request = request("customer", "valid-password");
        when(userService.getUserByLoginIdentifier("customer")).thenReturn(activeUser);
        when(passwordEncoder.matches("valid-password", "encoded-password")).thenReturn(true);
        when(jwtTokenService.generateToken(activeUser)).thenReturn("access-token");
        when(jwtTokenService.generateRefreshToken(42L)).thenReturn("refresh-token");

        LoginResponse response = authService.login(request);

        assertEquals("customer", response.getUserName());
        verify(userService).getUserByLoginIdentifier("customer");
    }

    @Test
    void loginNormalizesEmailIdentifierBeforeLookup() {
        LoginRequest request = request("  Customer@Example.com  ", "valid-password");
        when(userService.getUserByLoginIdentifier("Customer@Example.com")).thenReturn(activeUser);
        when(passwordEncoder.matches("valid-password", "encoded-password")).thenReturn(true);
        when(jwtTokenService.generateToken(activeUser)).thenReturn("access-token");
        when(jwtTokenService.generateRefreshToken(42L)).thenReturn("refresh-token");

        LoginResponse response = authService.login(request);

        assertEquals(42L, response.getUserId());
        verify(userService).getUserByLoginIdentifier("Customer@Example.com");
    }

    @Test
    void loginRejectsUnknownIdentifierWithoutCheckingPassword() {
        LoginRequest request = request("missing@example.com", "valid-password");
        when(userService.getUserByLoginIdentifier("missing@example.com")).thenReturn(null);

        SecurityException exception = assertThrows(SecurityException.class, () -> authService.login(request));

        assertEquals("Invalid credentials", exception.getMessage());
        verify(passwordEncoder, never()).matches("valid-password", "encoded-password");
    }

    @Test
    void loginRejectsInactiveAccountWithGenericCredentialError() {
        activeUser.setActive(0);
        LoginRequest request = request("customer@example.com", "valid-password");
        when(userService.getUserByLoginIdentifier("customer@example.com")).thenReturn(activeUser);

        SecurityException exception = assertThrows(SecurityException.class, () -> authService.login(request));

        assertEquals("Invalid credentials", exception.getMessage());
    }

    private LoginRequest request(String identifier, String password) {
        LoginRequest request = new LoginRequest();
        request.setUserName(identifier);
        request.setPassword(password);
        return request;
    }
}
