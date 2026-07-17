package com.rainbowforest.orderservice.dto;

import java.math.BigDecimal;

public class ShippingFeeResponse {

    private BigDecimal fee;
    private Integer nearestStoreId;
    private String nearestStoreName;
    private boolean estimated;

    public ShippingFeeResponse() {
    }

    public ShippingFeeResponse(BigDecimal fee, Integer nearestStoreId, String nearestStoreName, boolean estimated) {
        this.fee = fee;
        this.nearestStoreId = nearestStoreId;
        this.nearestStoreName = nearestStoreName;
        this.estimated = estimated;
    }

    public BigDecimal getFee() {
        return fee;
    }

    public void setFee(BigDecimal fee) {
        this.fee = fee;
    }

    public Integer getNearestStoreId() {
        return nearestStoreId;
    }

    public void setNearestStoreId(Integer nearestStoreId) {
        this.nearestStoreId = nearestStoreId;
    }

    public String getNearestStoreName() {
        return nearestStoreName;
    }

    public void setNearestStoreName(String nearestStoreName) {
        this.nearestStoreName = nearestStoreName;
    }

    public boolean isEstimated() {
        return estimated;
    }

    public void setEstimated(boolean estimated) {
        this.estimated = estimated;
    }
}