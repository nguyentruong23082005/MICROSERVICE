package com.rainbowforest.userservice.controller;

import com.rainbowforest.userservice.entity.User;
import com.rainbowforest.userservice.http.header.HeaderGenerator;
import com.rainbowforest.userservice.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class UserController {

    private final UserService userService;
    private final HeaderGenerator headerGenerator;

    public UserController(UserService userService, HeaderGenerator headerGenerator) {
        this.userService = userService;
        this.headerGenerator = headerGenerator;
    }

    @GetMapping(value = "/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        if (!users.isEmpty()) {
            return new ResponseEntity<>(
                    users,
                    headerGenerator.getHeadersForSuccessGetMethod(),
                    HttpStatus.OK);
        }
        return new ResponseEntity<>(
                headerGenerator.getHeadersForError(),
                HttpStatus.NOT_FOUND);
    }

    @GetMapping(value = "/users", params = "name")
    public ResponseEntity<User> getUserByName(@RequestParam("name") String userName) {
        User user = userService.getUserByName(userName);
        return respondWithUser(user);
    }

    @GetMapping(value = "/users/{id}")
    public ResponseEntity<User> getUserById(@PathVariable("id") Long id) {
        User user = userService.getUserById(id);
        return respondWithUser(user);
    }

    @PostMapping(value = "/users")
    public ResponseEntity<User> addUser(@RequestBody User user, HttpServletRequest request) {
        return createUser(user, request);
    }

    @GetMapping(value = "/admin/users")
    public ResponseEntity<List<User>> getAllUsersForAdmin() {
        return new ResponseEntity<>(
                userService.getAllUsers(),
                headerGenerator.getHeadersForSuccessGetMethod(),
                HttpStatus.OK);
    }

    @GetMapping(value = "/admin/users/{id}")
    public ResponseEntity<User> getUserByIdForAdmin(@PathVariable("id") Long id) {
        return getUserById(id);
    }

    @PostMapping(value = "/admin/users")
    public ResponseEntity<User> addUserForAdmin(@RequestBody User user, HttpServletRequest request) {
        return createUser(user, request);
    }

    @PutMapping(value = "/admin/users/{id}/status")
    public ResponseEntity<User> updateUserStatusForAdmin(
            @PathVariable("id") Long id,
            @RequestParam("active") boolean active) {
        User updated = userService.updateUserActive(id, active);
        if (updated == null) {
            return new ResponseEntity<>(
                    headerGenerator.getHeadersForError(),
                    HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(
                updated,
                headerGenerator.getHeadersForSuccessGetMethod(),
                HttpStatus.OK);
    }

    @PutMapping(value = "/admin/users/{id}/role")
    public ResponseEntity<User> updateUserRoleForAdmin(
            @PathVariable("id") Long id,
            @RequestParam("roleName") String roleName) {
        try {
            User updated = userService.updateUserRole(id, roleName);
            if (updated == null) {
                return new ResponseEntity<>(
                        headerGenerator.getHeadersForError(),
                        HttpStatus.NOT_FOUND);
            }
            return new ResponseEntity<>(
                    updated,
                    headerGenerator.getHeadersForSuccessGetMethod(),
                    HttpStatus.OK);
        } catch (IllegalArgumentException exception) {
            return new ResponseEntity<>(
                    headerGenerator.getHeadersForError(),
                    HttpStatus.BAD_REQUEST);
        }
    }

    private ResponseEntity<User> createUser(User user, HttpServletRequest request) {
        try {
            User saved = userService.saveUser(user);
            return new ResponseEntity<>(
                    saved,
                    headerGenerator.getHeadersForSuccessPostMethod(request, saved.getId()),
                    HttpStatus.CREATED);
        } catch (IllegalArgumentException exception) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        } catch (Exception exception) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private ResponseEntity<User> respondWithUser(User user) {
        if (user != null) {
            return new ResponseEntity<>(
                    user,
                    headerGenerator.getHeadersForSuccessGetMethod(),
                    HttpStatus.OK);
        }
        return new ResponseEntity<>(
                headerGenerator.getHeadersForError(),
                HttpStatus.NOT_FOUND);
    }
}
