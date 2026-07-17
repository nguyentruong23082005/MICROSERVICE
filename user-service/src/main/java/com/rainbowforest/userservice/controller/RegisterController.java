package com.rainbowforest.userservice.controller;

import com.rainbowforest.userservice.dto.RegistrationRequest;
import com.rainbowforest.userservice.dto.UserResponse;
import com.rainbowforest.userservice.entity.User;
import com.rainbowforest.userservice.http.header.HeaderGenerator;
import com.rainbowforest.userservice.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class RegisterController {

    private final UserService userService;
    private final HeaderGenerator headerGenerator;

    public RegisterController(UserService userService, HeaderGenerator headerGenerator) {
        this.userService = userService;
        this.headerGenerator = headerGenerator;
    }

    @PostMapping(value = "/registration")
    public ResponseEntity<UserResponse> addUser(
            @Valid @RequestBody RegistrationRequest registrationRequest,
            HttpServletRequest request) {
        User user = registrationRequest.toEntity();
        User saved = userService.saveUser(user);
        return new ResponseEntity<>(
                UserResponse.from(saved),
                headerGenerator.getHeadersForSuccessPostMethod(request, saved.getId()),
                HttpStatus.CREATED);
    }
}
