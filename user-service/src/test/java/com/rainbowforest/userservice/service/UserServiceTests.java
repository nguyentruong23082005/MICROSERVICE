package com.rainbowforest.userservice.service;

import com.rainbowforest.userservice.entity.User;
import com.rainbowforest.userservice.entity.UserDetails;
import com.rainbowforest.userservice.exception.DuplicateEmailException;
import com.rainbowforest.userservice.repository.UserDetailsRepository;
import com.rainbowforest.userservice.repository.UserRepository;
import com.rainbowforest.userservice.repository.UserRoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class UserServiceTests {

    private final Long USER_ID = 2L;
    private final String USER_NAME = "test";
    private User user;
    private List<User> userList;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserRoleRepository userRoleRepository;

    @Mock
    private UserDetailsRepository userDetailsRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    @BeforeEach
    public void setUp(){
        user = new User();
        user.setId(USER_ID);
        user.setUserName(USER_NAME);
        userList = new ArrayList<>();
        userList.add(user);
    }

    @Test
    public void get_all_users_test(){
        // given
        when(userRepository.findAll()).thenReturn(userList);

        // when
        List<User> foundUsers = userService.getAllUsers();

        // then
        assertEquals(USER_NAME, foundUsers.get(0).getUserName());
        Mockito.verify(userRepository, Mockito.times(1)).findAll();
        Mockito.verifyNoMoreInteractions(userRepository);
    }

    @Test
    public void get_user_by_id_test(){
        // given
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(user));

        // when
        User foundUser = userService.getUserById(USER_ID);

        // then
        assertEquals(USER_NAME, foundUser.getUserName());
        Mockito.verify(userRepository, Mockito.times(1)).findById(anyLong());
        Mockito.verifyNoMoreInteractions(userRepository);
    }

    @Test
    public void get_user_by_name_test(){
        // given
        when(userRepository.findByUserName(anyString())).thenReturn(user);

        // when
        User foundUser = userService.getUserByName(USER_NAME);

        // then
        assertEquals(USER_ID, foundUser.getId());
        Mockito.verify(userRepository, Mockito.times(1)).findByUserName(USER_NAME);
        Mockito.verifyNoMoreInteractions(userRepository);
    }

    @Test
    void login_identifier_prefers_exact_username() {
        when(userRepository.findByUserName(USER_NAME)).thenReturn(user);

        User foundUser = userService.getUserByLoginIdentifier("  " + USER_NAME + "  ");

        assertEquals(USER_ID, foundUser.getId());
        verify(userRepository).findByUserName(USER_NAME);
        verify(userRepository, never()).findByUserDetails_EmailIgnoreCase(anyString());
    }

    @Test
    void login_identifier_falls_back_to_case_insensitive_email() {
        when(userRepository.findByUserName("Customer@Example.com")).thenReturn(null);
        when(userRepository.findByUserDetails_EmailIgnoreCase("Customer@Example.com")).thenReturn(user);

        User foundUser = userService.getUserByLoginIdentifier(" Customer@Example.com ");

        assertEquals(USER_ID, foundUser.getId());
        verify(userRepository).findByUserDetails_EmailIgnoreCase("Customer@Example.com");
    }

    @Test
    public void update_user_active_should_save_existing_user(){
        // given
        user.setActive(1);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        User updatedUser = userService.updateUserActive(USER_ID, false);

        // then
        assertEquals(0, updatedUser.getActive());
        Mockito.verify(userRepository, Mockito.times(1)).findById(USER_ID);
        Mockito.verify(userRepository, Mockito.times(1)).save(user);
        Mockito.verifyNoMoreInteractions(userRepository);
    }

    @Test
    void save_user_should_reject_duplicate_email_ignoring_case() {
        UserDetails details = new UserDetails();
        details.setEmail("  Existing@Example.com  ");
        user.setUserDetails(details);
        user.setUserPassword("valid-password");
        when(userDetailsRepository.existsByEmailIgnoreCase("existing@example.com")).thenReturn(true);

        DuplicateEmailException exception = assertThrows(
                DuplicateEmailException.class,
                () -> userService.saveUser(user));

        assertEquals("Email is already in use", exception.getMessage());
        Mockito.verify(userDetailsRepository).existsByEmailIgnoreCase("existing@example.com");
        Mockito.verify(userRepository, Mockito.never()).save(any(User.class));
    }

    @Test
    void jwt_token_service_should_reject_missing_weak_and_exposed_secrets() {
        StringRedisTemplate redisTemplate = mock(StringRedisTemplate.class);
        long expirationMillis = 86_400_000L;
        String exposedPlaceholder =
                "rainbowforest-local-development-secret-key-must-be-at-least-256-bits";

        assertThrows(IllegalArgumentException.class,
                () -> new JwtTokenService(null, expirationMillis, redisTemplate));
        assertThrows(IllegalArgumentException.class,
                () -> new JwtTokenService("   ", expirationMillis, redisTemplate));
        assertThrows(IllegalArgumentException.class,
                () -> new JwtTokenService("short-secret", expirationMillis, redisTemplate));
        assertThrows(IllegalArgumentException.class,
                () -> new JwtTokenService(exposedPlaceholder, expirationMillis, redisTemplate));
    }

    @Test
    void jwt_token_service_should_accept_a_secret_with_at_least_256_bits() {
        assertDoesNotThrow(() -> new JwtTokenService(
                "5f8c2d7a1b9e4f6c8d0a3b7e9f1c5d2a",
                86_400_000L,
                mock(StringRedisTemplate.class)));
    }
}
