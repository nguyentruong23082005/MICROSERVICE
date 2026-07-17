package com.rainbowforest.orderservice.service;

import com.rainbowforest.orderservice.dto.ShippingFeeRequest;
import com.rainbowforest.orderservice.dto.ShippingFeeResponse;
import com.rainbowforest.orderservice.dto.ShippingLocationResponse;
import java.util.List;

public interface GhnShippingService {
    ShippingFeeResponse calculateFee(ShippingFeeRequest request);

    List<ShippingLocationResponse> getProvinces();

    List<ShippingLocationResponse> getDistricts(int provinceId);

    List<ShippingLocationResponse> getWards(int districtId);
}