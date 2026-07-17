package com.rainbowforest.userservice.controller;

import com.rainbowforest.userservice.dto.RegistrationRequest;
import com.rainbowforest.userservice.dto.UserResponse;
import com.rainbowforest.userservice.entity.User;
import com.rainbowforest.userservice.http.header.HeaderGenerator;
import com.rainbowforest.userservice.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        if (!users.isEmpty()) {
            return new ResponseEntity<>(
                    toResponses(users),
                    headerGenerator.getHeadersForSuccessGetMethod(),
                    HttpStatus.OK);
        }
        return new ResponseEntity<>(
                headerGenerator.getHeadersForError(),
                HttpStatus.NOT_FOUND);
    }

    @GetMapping(value = "/users", params = "name")
    public ResponseEntity<UserResponse> getUserByName(@RequestParam("name") String userName) {
        User user = userService.getUserByName(userName);
        return respondWithUser(user);
    }

    @GetMapping(value = "/users/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable("id") Long id) {
        User user = userService.getUserById(id);
        return respondWithUser(user);
    }

    @PostMapping(value = "/users")
    public ResponseEntity<UserResponse> addUser(
            @Valid @RequestBody RegistrationRequest registrationRequest,
            HttpServletRequest request) {
        return createUser(registrationRequest, request);
    }

    @GetMapping(value = "/admin/users")
    public ResponseEntity<?> getAllUsersForAdmin(
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size,
            @RequestParam(value = "search", required = false) String search) {
        
        if (page != null && size != null) {
            Pageable pageable = PageRequest.of(page, size, Sort.by("id").ascending());
            Page<UserResponse> userPage = userService.searchUsersAdmin(search, pageable).map(UserResponse::from);
            return new ResponseEntity<>(userPage, HttpStatus.OK);
        }

        return new ResponseEntity<>(
                toResponses(userService.getAllUsers()),
                headerGenerator.getHeadersForSuccessGetMethod(),
                HttpStatus.OK);
    }

    @GetMapping(value = "/admin/users/{id}")
    public ResponseEntity<UserResponse> getUserByIdForAdmin(@PathVariable("id") Long id) {
        return getUserById(id);
    }

    @PostMapping(value = "/admin/users")
    public ResponseEntity<UserResponse> addUserForAdmin(
            @Valid @RequestBody RegistrationRequest registrationRequest,
            HttpServletRequest request) {
        return createUser(registrationRequest, request);
    }

    @PutMapping(value = "/admin/users/{id}/status")
    public ResponseEntity<UserResponse> updateUserStatusForAdmin(
            @PathVariable("id") Long id,
            @RequestParam("active") boolean active) {
        User updated = userService.updateUserActive(id, active);
        if (updated == null) {
            return new ResponseEntity<>(
                    headerGenerator.getHeadersForError(),
                    HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(
                UserResponse.from(updated),
                headerGenerator.getHeadersForSuccessGetMethod(),
                HttpStatus.OK);
    }

    @PutMapping(value = "/admin/users/{id}/role")
    public ResponseEntity<UserResponse> updateUserRoleForAdmin(
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
                    UserResponse.from(updated),
                    headerGenerator.getHeadersForSuccessGetMethod(),
                    HttpStatus.OK);
        } catch (IllegalArgumentException exception) {
            return new ResponseEntity<>(
                    headerGenerator.getHeadersForError(),
                    HttpStatus.BAD_REQUEST);
        }
    }

    private ResponseEntity<UserResponse> createUser(
            RegistrationRequest registrationRequest,
            HttpServletRequest request) {
        try {
            User user = toEntity(registrationRequest);
            User saved = userService.saveUser(user);
            return new ResponseEntity<>(
                    UserResponse.from(saved),
                    headerGenerator.getHeadersForSuccessPostMethod(request, saved.getId()),
                    HttpStatus.CREATED);
        } catch (IllegalArgumentException exception) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        } catch (Exception exception) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private ResponseEntity<UserResponse> respondWithUser(User user) {
        if (user != null) {
            return new ResponseEntity<>(
                    UserResponse.from(user),
                    headerGenerator.getHeadersForSuccessGetMethod(),
                    HttpStatus.OK);
        }
        return new ResponseEntity<>(
                headerGenerator.getHeadersForError(),
                HttpStatus.NOT_FOUND);
    }

    private User toEntity(RegistrationRequest registrationRequest) {
        return registrationRequest.toEntity();
    }

    private List<UserResponse> toResponses(List<User> users) {
        return users.stream().map(UserResponse::from).toList();
    }
}
