package com.rainbowforest.userservice.service;

import com.rainbowforest.userservice.dto.LoginRequest;
import com.rainbowforest.userservice.dto.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest loginRequest);
    LoginResponse loginWithFirebase(String idToken);
    LoginResponse refresh(String refreshToken);
    void logout(String accessToken, String refreshToken);
    void requestPasswordReset(String email);
    void resetPassword(String token, String newPassword);
}
