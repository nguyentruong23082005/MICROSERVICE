package com.rainbowforest.orderservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ShippingFeeRequest {

    @NotNull
    @Min(1)
    private Integer toDistrictId;

    @NotBlank
    private String toWardCode;

    @Min(1)
    private Integer totalWeightGram;

    @Min(1)
    private Integer fromDistrictId;

    @Min(1)
    private Integer lengthCm;

    @Min(1)
    private Integer widthCm;

    @Min(1)
    private Integer heightCm;

    public Integer getToDistrictId() {
        return toDistrictId;
    }

    public void setToDistrictId(Integer toDistrictId) {
        this.toDistrictId = toDistrictId;
    }

    public String getToWardCode() {
        return toWardCode;
    }

    public void setToWardCode(String toWardCode) {
        this.toWardCode = toWardCode;
    }

    public Integer getTotalWeightGram() {
        return totalWeightGram;
    }

    public void setTotalWeightGram(Integer totalWeightGram) {
        this.totalWeightGram = totalWeightGram;
    }

    public Integer getFromDistrictId() {
        return fromDistrictId;
    }

    public void setFromDistrictId(Integer fromDistrictId) {
        this.fromDistrictId = fromDistrictId;
    }

    public Integer getLengthCm() {
        return lengthCm;
    }

    public void setLengthCm(Integer lengthCm) {
        this.lengthCm = lengthCm;
    }

    public Integer getWidthCm() {
        return widthCm;
    }

    public void setWidthCm(Integer widthCm) {
        this.widthCm = widthCm;
    }

    public Integer getHeightCm() {
        return heightCm;
    }

    public void setHeightCm(Integer heightCm) {
        this.heightCm = heightCm;
    }
}