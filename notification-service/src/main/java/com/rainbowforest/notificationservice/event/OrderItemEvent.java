package com.rainbowforest.notificationservice.event;

import java.math.BigDecimal;

public class OrderItemEvent {
    private Long productId;
    private String productName;
    private int quantity;
    private BigDecimal subTotal;

    public OrderItemEvent() {
    }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public BigDecimal getSubTotal() { return subTotal; }
    public void setSubTotal(BigDecimal subTotal) { this.subTotal = subTotal; }
}
