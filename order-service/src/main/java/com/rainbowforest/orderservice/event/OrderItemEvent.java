package com.rainbowforest.orderservice.event;

import java.math.BigDecimal;

public class OrderItemEvent {

    private Long productId;
    private String productName;
    private int quantity;
    private BigDecimal subTotal;

    public OrderItemEvent() {
    }

    public OrderItemEvent(Long productId, String productName, int quantity, BigDecimal subTotal) {
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.subTotal = subTotal;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getSubTotal() {
        return subTotal;
    }

    public void setSubTotal(BigDecimal subTotal) {
        this.subTotal = subTotal;
    }
}
