package com.rainbowforest.userservice.service;

public record FirebaseIdentity(
        String uid,
        String email,
        String displayName,
        boolean emailVerified) {
}
