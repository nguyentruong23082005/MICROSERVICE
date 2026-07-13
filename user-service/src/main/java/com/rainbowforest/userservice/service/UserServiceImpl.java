package com.rainbowforest.userservice.service;

import com.rainbowforest.userservice.entity.User;
import com.rainbowforest.userservice.entity.UserRole;
import com.rainbowforest.userservice.repository.UserRepository;
import com.rainbowforest.userservice.repository.UserRoleRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(
            UserRepository userRepository,
            UserRoleRepository userRoleRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public User getUserById(Long id) {
        if (id == null) {
            return null;
        }
        return userRepository.findById(id).orElse(null);
    }

    @Override
    public User getUserByName(String userName) {
        return userRepository.findByUserName(userName);
    }

    @Override
    public User saveUser(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User is required");
        }
        user.setActive(1);
        UserRole role = userRoleRepository.findUserRoleByRoleName("ROLE_USER");
        user.setRole(role);
        if (user.getUserPassword() != null) {
            user.setUserPassword(passwordEncoder.encode(user.getUserPassword()));
        }
        return userRepository.save(user);
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
