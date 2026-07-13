package com.rainbowforest.userservice.service;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.rainbowforest.userservice.entity.User;

public interface UserService {
    Page<User> searchUsersAdmin(String search, Pageable pageable);
    List<User> getAllUsers();
    User getUserById(Long id);
    User getUserByName(String userName);
    User saveUser(User user);
    User updateUserActive(Long id, boolean active);
    User updateUserRole(Long id, String roleName);
}
