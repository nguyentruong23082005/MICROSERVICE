package com.rainbowforest.userservice.controller;

import com.rainbowforest.userservice.dto.LoginRequest;
import com.rainbowforest.userservice.dto.LoginResponse;
import com.rainbowforest.userservice.dto.RefreshRequest;
import com.rainbowforest.userservice.entity.User;
import com.rainbowforest.userservice.service.JwtTokenService;
import com.rainbowforest.userservice.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtTokenService jwtTokenService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        if (loginRequest == null || loginRequest.getUserName() == null || loginRequest.getPassword() == null) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        User user = userService.getUserByName(loginRequest.getUserName());
        if (user == null || user.getActive() != 1 || !passwordEncoder.matches(loginRequest.getPassword(), user.getUserPassword())) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        String roleName = user.getRole() == null ? "ROLE_USER" : user.getRole().getRoleName();
        String token = jwtTokenService.generateToken(user);
        String refreshToken = jwtTokenService.generateRefreshToken(user.getId());

        LoginResponse response = new LoginResponse(token, refreshToken, user.getId(), user.getUserName(), roleName);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@RequestBody RefreshRequest refreshRequest) {
        if (refreshRequest == null || refreshRequest.getUserId() == null || refreshRequest.getRefreshToken() == null) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        Long userId = refreshRequest.getUserId();
        String refreshToken = refreshRequest.getRefreshToken();

        boolean isValid = jwtTokenService.validateRefreshToken(userId, refreshToken);
        if (!isValid) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        User user = userService.getUserById(userId);
        if (user == null || user.getActive() != 1) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        String roleName = user.getRole() == null ? "ROLE_USER" : user.getRole().getRoleName();
        String newToken = jwtTokenService.generateToken(user);
        String newRefreshToken = jwtTokenService.generateRefreshToken(userId); // Rotate refresh token

        LoginResponse response = new LoginResponse(newToken, newRefreshToken, user.getId(), user.getUserName(), roleName);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam("userId") Long userId) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            jwtTokenService.blacklistAccessToken(token);
        }
        if (userId != null) {
            jwtTokenService.deleteRefreshToken(userId);
        }
        return ResponseEntity.ok().build();
    }
}
