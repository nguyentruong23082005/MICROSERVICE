package com.rainbowforest.recommendationservice.dto;

import com.rainbowforest.recommendationservice.model.Product;
import java.util.List;

public class ChatResponse {
    private String response;
    private boolean mockMode;
    private List<Product> suggestedProducts;

    public ChatResponse() {}

    public ChatResponse(String response, boolean mockMode, List<Product> suggestedProducts) {
        this.response = response;
        this.mockMode = mockMode;
        this.suggestedProducts = suggestedProducts;
    }

    public String getResponse() {
        return response;
    }

    public void setResponse(String response) {
        this.response = response;
    }

    public boolean isMockMode() {
        return mockMode;
    }

    public void setMockMode(boolean mockMode) {
        this.mockMode = mockMode;
    }

    public List<Product> getSuggestedProducts() {
        return suggestedProducts;
    }

    public void setSuggestedProducts(List<Product> suggestedProducts) {
        this.suggestedProducts = suggestedProducts;
    }
}
