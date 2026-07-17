package com.rainbowforest.recommendationservice.dto;

public class ApiEnvelope<T> {
    private boolean success;
    private T data;
    private String message;

    public ApiEnvelope() {}

    public ApiEnvelope(boolean success, T data, String message) {
        this.success = success;
        this.data = data;
        this.message = message;
    }

    public static <T> ApiEnvelope<T> ok(T data) {
        return new ApiEnvelope<>(true, data, null);
    }

    public static <T> ApiEnvelope<T> error(String message) {
        return new ApiEnvelope<>(false, null, message);
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
