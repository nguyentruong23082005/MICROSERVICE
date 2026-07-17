package com.rainbowforest.userservice.exception;

public final class FirebaseTokenVerificationException extends RuntimeException {

    public enum Category {
        INVALID_TOKEN,
        REVOKED_TOKEN,
        DISABLED_USER,
        UPSTREAM_UNAVAILABLE
    }

    private final Category category;

    public FirebaseTokenVerificationException(Category category, String message) {
        super(message);
        this.category = category;
    }

    public FirebaseTokenVerificationException(Category category, String message, Throwable cause) {
        super(message, cause);
        this.category = category;
    }

    public Category getCategory() {
        return category;
    }

    public boolean isUpstreamUnavailable() {
        return category == Category.UPSTREAM_UNAVAILABLE;
    }
}