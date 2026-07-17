package com.rainbowforest.orderservice.dto;

import java.math.BigDecimal;

public class CouponPreviewResponse {

    private String code;
    private String description;
    private BigDecimal subtotal;
    private BigDecimal discountTotal;
    private BigDecimal total;

    public CouponPreviewResponse(String code, String description, BigDecimal subtotal,
                                 BigDecimal discountTotal, BigDecimal total) {
        this.code = code;
        this.description = description;
        this.subtotal = subtotal;
        this.discountTotal = discountTotal;
        this.total = total;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public BigDecimal getDiscountTotal() {
        return discountTotal;
    }

    public BigDecimal getTotal() {
        return total;
    }
}
