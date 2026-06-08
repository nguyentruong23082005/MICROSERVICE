package com.rainbowforest.userservice.dto;

public class LoginResponse {

    private final String token;
    private final Long userId;
    private final String userName;
    private final String role;

    public LoginResponse(String token, Long userId, String userName, String role) {
        this.token = token;
        this.userId = userId;
        this.userName = userName;
        this.role = role;
    }

    public String getToken() {
        return token;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUserName() {
        return userName;
    }

    public String getRole() {
        return role;
    }
}
