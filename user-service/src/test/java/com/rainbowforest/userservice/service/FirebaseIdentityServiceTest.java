package com.rainbowforest.userservice.service;

import com.google.firebase.auth.AuthErrorCode;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.rainbowforest.userservice.exception.FirebaseTokenVerificationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FirebaseIdentityServiceTest {

    @Mock
    private FirebaseTokenVerifier tokenVerifier;

    private FirebaseIdentityService identityService;

    @BeforeEach
    void setUp() {
        identityService = new FirebaseIdentityService(tokenVerifier);
    }

    @Test
    void verifyRejectsBlankTokenBeforeCallingFirebase() {
        assertThrows(IllegalArgumentException.class, () -> identityService.verify("  "));
    }

    @Test
    void verifyReturnsNormalizedIdentityForValidToken() throws Exception {
        FirebaseToken token = mock(FirebaseToken.class);
        when(tokenVerifier.verify("valid-token")).thenReturn(token);
        when(token.getUid()).thenReturn("firebase-user-42");
        when(token.getEmail()).thenReturn("  Customer@Example.com  ");
        when(token.getName()).thenReturn("Customer Name");
        when(token.isEmailVerified()).thenReturn(true);

        FirebaseIdentity identity = identityService.verify("valid-token");

        assertEquals("firebase-user-42", identity.uid());
        assertEquals("customer@example.com", identity.email());
        assertEquals("Customer Name", identity.displayName());
        assertEquals(true, identity.emailVerified());
    }

    @Test
    void verifyRejectsTokenWithoutEmail() throws Exception {
        FirebaseToken token = mock(FirebaseToken.class);
        when(tokenVerifier.verify("missing-email-token")).thenReturn(token);
        when(token.getEmail()).thenReturn(" ");

        FirebaseTokenVerificationException exception = assertThrows(
                FirebaseTokenVerificationException.class,
                () -> identityService.verify("missing-email-token"));

        assertEquals(FirebaseTokenVerificationException.Category.INVALID_TOKEN, exception.getCategory());
        assertFalse(exception.getMessage().contains("missing-email-token"));
    }

    @Test
    void verifyClassifiesRevokedTokenWithoutLeakingToken() throws Exception {
        FirebaseAuthException firebaseException = mock(FirebaseAuthException.class);
        when(firebaseException.getAuthErrorCode()).thenReturn(AuthErrorCode.REVOKED_ID_TOKEN);
        when(tokenVerifier.verify("sensitive-revoked-token")).thenThrow(firebaseException);

        FirebaseTokenVerificationException exception = assertThrows(
                FirebaseTokenVerificationException.class,
                () -> identityService.verify("sensitive-revoked-token"));

        assertEquals(FirebaseTokenVerificationException.Category.REVOKED_TOKEN, exception.getCategory());
        assertFalse(exception.getMessage().contains("sensitive-revoked-token"));
    }

    @Test
    void verifyClassifiesCertificateFailureAsUpstreamUnavailable() throws Exception {
        FirebaseAuthException firebaseException = mock(FirebaseAuthException.class);
        when(firebaseException.getAuthErrorCode()).thenReturn(AuthErrorCode.CERTIFICATE_FETCH_FAILED);
        when(tokenVerifier.verify("sensitive-token")).thenThrow(firebaseException);

        FirebaseTokenVerificationException exception = assertThrows(
                FirebaseTokenVerificationException.class,
                () -> identityService.verify("sensitive-token"));

        assertEquals(FirebaseTokenVerificationException.Category.UPSTREAM_UNAVAILABLE, exception.getCategory());
        assertFalse(exception.getMessage().contains("sensitive-token"));
    }
}
