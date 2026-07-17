package com.rainbowforest.recommendationservice.dto;

import com.rainbowforest.recommendationservice.model.Product;
import java.util.List;

public class ChatbotReplyPayload {
    private String reply;
    private List<Product> products;
    private List<Object> stores;

    public ChatbotReplyPayload() {}

    public ChatbotReplyPayload(String reply, List<Product> products, List<Object> stores) {
        this.reply = reply;
        this.products = products;
        this.stores = stores;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public List<Product> getProducts() {
        return products;
    }

    public void setProducts(List<Product> products) {
        this.products = products;
    }

    public List<Object> getStores() {
        return stores;
    }

    public void setStores(List<Object> stores) {
        this.stores = stores;
    }
}
