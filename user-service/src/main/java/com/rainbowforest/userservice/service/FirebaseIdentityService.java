package com.rainbowforest.userservice.service;

import com.google.firebase.auth.AuthErrorCode;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.rainbowforest.userservice.exception.FirebaseTokenVerificationException;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Set;

@Service
public class FirebaseIdentityService {

    private static final Set<AuthErrorCode> UPSTREAM_ERROR_CODES = Set.of(
            AuthErrorCode.CERTIFICATE_FETCH_FAILED,
            AuthErrorCode.CONFIGURATION_NOT_FOUND);

    private final FirebaseTokenVerifier tokenVerifier;

    public FirebaseIdentityService(FirebaseTokenVerifier tokenVerifier) {
        this.tokenVerifier = tokenVerifier;
    }

    public FirebaseIdentity verify(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new IllegalArgumentException("Firebase ID token is required");
        }
        try {
            FirebaseToken token = tokenVerifier.verify(idToken);
            String email = token.getEmail();
            if (email == null || email.isBlank()) {
                throw new FirebaseTokenVerificationException(
                        FirebaseTokenVerificationException.Category.INVALID_TOKEN,
                        "Firebase account does not provide an email address");
            }
            return new FirebaseIdentity(
                    token.getUid(),
                    email.trim().toLowerCase(Locale.ROOT),
                    token.getName(),
                    token.isEmailVerified());
        } catch (FirebaseAuthException exception) {
            throw classify(exception);
        } catch (IllegalStateException exception) {
            throw new FirebaseTokenVerificationException(
                    FirebaseTokenVerificationException.Category.UPSTREAM_UNAVAILABLE,
                    "Firebase authentication is unavailable",
                    exception);
        }
    }

    private FirebaseTokenVerificationException classify(FirebaseAuthException exception) {
        AuthErrorCode errorCode = exception.getAuthErrorCode();
        FirebaseTokenVerificationException.Category category;
        if (errorCode == AuthErrorCode.REVOKED_ID_TOKEN) {
            category = FirebaseTokenVerificationException.Category.REVOKED_TOKEN;
        } else if (errorCode == AuthErrorCode.USER_DISABLED) {
            category = FirebaseTokenVerificationException.Category.DISABLED_USER;
        } else if (UPSTREAM_ERROR_CODES.contains(errorCode)) {
            category = FirebaseTokenVerificationException.Category.UPSTREAM_UNAVAILABLE;
        } else {
            category = FirebaseTokenVerificationException.Category.INVALID_TOKEN;
        }
        return new FirebaseTokenVerificationException(category, "Firebase token verification failed", exception);
    }
}
