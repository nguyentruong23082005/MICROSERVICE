package com.rainbowforest.orderservice.service;

import com.rainbowforest.orderservice.domain.ShippingAddress;
import com.rainbowforest.orderservice.dto.AddressRequest;

import java.util.List;

public interface AddressService {
    List<ShippingAddress> getAddresses(Long userId);
    ShippingAddress saveAddress(Long userId, AddressRequest request);
    ShippingAddress setDefaultAddress(Long userId, Long addressId);
    boolean deleteAddress(Long userId, Long addressId);
}
