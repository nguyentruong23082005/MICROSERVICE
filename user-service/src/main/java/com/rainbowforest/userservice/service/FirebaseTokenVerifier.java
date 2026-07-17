package com.rainbowforest.userservice.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.stereotype.Component;

@Component
public class FirebaseTokenVerifier {

    public FirebaseToken verify(String idToken) throws FirebaseAuthException {
        if (FirebaseApp.getApps().isEmpty()) {
            throw new IllegalStateException("Firebase authentication is unavailable");
        }
        return FirebaseAuth.getInstance().verifyIdToken(idToken, true);
    }
}