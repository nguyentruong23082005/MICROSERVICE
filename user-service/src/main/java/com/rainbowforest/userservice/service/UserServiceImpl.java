package com.rainbowforest.userservice.service;

import com.rainbowforest.userservice.entity.User;
import com.rainbowforest.userservice.entity.UserDetails;
import com.rainbowforest.userservice.entity.UserRole;
import com.rainbowforest.userservice.exception.DuplicateEmailException;
import com.rainbowforest.userservice.repository.UserDetailsRepository;
import com.rainbowforest.userservice.repository.UserRepository;
import com.rainbowforest.userservice.repository.UserRoleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserDetailsRepository userDetailsRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(
            UserRepository userRepository,
            UserRoleRepository userRoleRepository,
            UserDetailsRepository userDetailsRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.userDetailsRepository = userDetailsRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public Page<User> searchUsersAdmin(String search, Pageable pageable) {
        if (search == null || search.trim().isEmpty()) {
            return userRepository.findAll(pageable);
        }
        String searchParam = "%" + search.trim().toLowerCase() + "%";
        return userRepository.searchUsersAdmin(searchParam, pageable);
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public User getUserById(Long id) {
        return id == null ? null : userRepository.findById(id).orElse(null);
    }

    @Override
    public User getUserByName(String userName) {
        return userRepository.findByUserName(userName);
    }

    @Override
    public User getUserByLoginIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return null;
        }
        String normalizedIdentifier = identifier.trim();
        User user = userRepository.findByUserName(normalizedIdentifier);
        return user != null ? user : userRepository.findByUserDetails_EmailIgnoreCase(normalizedIdentifier);
    }

    @Override
    public User saveUser(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User is required");
        }
        normalizeAndValidateEmail(user);
        user.setActive(1);
        UserRole role = userRoleRepository.findUserRoleByRoleName("ROLE_USER");
        if (role == null) {
            throw new IllegalStateException("ROLE_USER is not configured");
        }
        user.setRole(role);
        if (user.getUserPassword() != null) {
            user.setUserPassword(passwordEncoder.encode(user.getUserPassword()));
        }
        return userRepository.save(user);
    }

    @Override
    public User createFirebaseUser(String email, String displayName, String firebaseUid) {
        if (email == null || email.isBlank() || firebaseUid == null || firebaseUid.isBlank()) {
            throw new IllegalArgumentException("Firebase email and UID are required");
        }
        User existing = userRepository.findByUserDetails_EmailIgnoreCase(email.trim());
        if (existing != null) {
            return existing;
        }

        String cleanName = displayName == null ? "" : displayName.trim();
        String firstName = cleanName.isBlank() ? "Customer" : cleanName.split("\\s+", 2)[0];
        String lastName = cleanName.contains(" ") ? cleanName.substring(cleanName.indexOf(' ') + 1).trim() : firstName;
        UserDetails details = new UserDetails();
        details.setFirstName(limit(firstName, 50));
        details.setLastName(limit(lastName, 50));
        details.setEmail(email.trim().toLowerCase(Locale.ROOT));

        User user = new User();
        user.setUserName(uniqueFirebaseUsername(email, firebaseUid));
        user.setUserPassword(randomPassword());
        user.setUserDetails(details);
        return saveUser(user);
    }

    @Override
    public void updatePassword(Long userId, String rawPassword) {
        if (rawPassword == null || rawPassword.length() < 8) {
            throw new IllegalArgumentException("Password must contain at least 8 characters");
        }
        User existing = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        existing.setUserPassword(passwordEncoder.encode(rawPassword));
        userRepository.save(existing);
    }

    private String uniqueFirebaseUsername(String email, String firebaseUid) {
        String localPart = email.substring(0, email.indexOf('@'))
                .replaceAll("[^A-Za-z0-9._-]", "");
        if (localPart.isBlank()) {
            localPart = "customer";
        }
        String uidSuffix = firebaseUid.replaceAll("[^A-Za-z0-9]", "");
        uidSuffix = uidSuffix.substring(0, Math.min(uidSuffix.length(), 10));
        String candidate = limit(localPart, 39) + "_" + uidSuffix;
        if (userRepository.findByUserName(candidate) == null) {
            return candidate;
        }
        return limit(localPart, 32) + "_" + Long.toUnsignedString(SECURE_RANDOM.nextLong(), 36);
    }

    private String randomPassword() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String limit(String value, int maxLength) {
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private void normalizeAndValidateEmail(User user) {
        if (user.getUserDetails() == null || user.getUserDetails().getEmail() == null) {
            return;
        }
        String normalizedEmail = user.getUserDetails().getEmail().trim().toLowerCase(Locale.ROOT);
        user.getUserDetails().setEmail(normalizedEmail);
        if (userDetailsRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DuplicateEmailException("Email is already in use");
        }
    }

    @Override
    public User updateUserActive(Long id, boolean active) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return null;
        }
        user.setActive(active ? 1 : 0);
        return userRepository.save(user);
    }

    @Override
    public User updateUserRole(Long id, String roleName) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return null;
        }
        UserRole role = userRoleRepository.findUserRoleByRoleName(roleName);
        if (role == null) {
            throw new IllegalArgumentException("Role not found: " + roleName);
        }
        user.setRole(role);
        return userRepository.save(user);
    }
}
