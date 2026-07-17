package com.rainbowforest.orderservice.service;

import com.rainbowforest.orderservice.domain.ShippingAddress;
import com.rainbowforest.orderservice.domain.User;
import com.rainbowforest.orderservice.dto.AddressRequest;
import com.rainbowforest.orderservice.feignclient.UserClient;
import com.rainbowforest.orderservice.repository.ShippingAddressRepository;
import com.rainbowforest.orderservice.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AddressServiceImpl implements AddressService {

    private final ShippingAddressRepository addressRepository;
    private final UserRepository userRepository;
    private final UserClient userClient;

    public AddressServiceImpl(ShippingAddressRepository addressRepository,
                              UserRepository userRepository,
                              UserClient userClient) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
        this.userClient = userClient;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShippingAddress> getAddresses(Long userId) {
        return addressRepository.findAllByUser_IdOrderByDefaultAddressDescCreatedAtDesc(userId);
    }

    @Override
    @Transactional
    public ShippingAddress saveAddress(Long userId, AddressRequest request) {
        User user = userClient.getUserById(userId);
        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException("User is required");
        }
        User localUser = userRepository.findById(user.getId())
                .map(existing -> {
                    existing.setUserName(user.getUserName());
                    existing.setPhoneNumber(user.getPhoneNumber());
                    return userRepository.save(existing);
                })
                .orElseGet(() -> userRepository.save(user));

        ShippingAddress address = new ShippingAddress();
        address.setUser(localUser);
        address.setRecipientName(normalize(request == null ? null : request.getRecipientName()));
        address.setEmail(normalize(request == null ? null : request.getEmail()));
        address.setPhone(normalize(request == null ? null : request.getPhone()));
        address.setAddressLine(normalize(request == null ? null : request.getAddressLine()));
        address.setCity(normalize(request == null ? null : request.getCity()));
        address.setProvinceId(request == null ? null : request.getProvinceId());
        address.setProvinceName(normalize(request == null ? null : request.getProvinceName()));
        address.setDistrictId(request == null ? null : request.getDistrictId());
        address.setDistrictName(normalize(request == null ? null : request.getDistrictName()));
        address.setWardCode(normalize(request == null ? null : request.getWardCode()));
        address.setWardName(normalize(request == null ? null : request.getWardName()));
        address.setDefaultAddress(request != null && request.isDefaultAddress());
        ShippingAddress saved = addressRepository.save(address);
        if (saved.isDefaultAddress()) {
            markOnlyDefault(localUser.getId(), saved.getId());
        }
        return saved;
    }

    @Override
    @Transactional
    public ShippingAddress setDefaultAddress(Long userId, Long addressId) {
        ShippingAddress address = addressRepository.findById(addressId)
                .filter(candidate -> candidate.getUser() != null && candidate.getUser().getId().equals(userId))
                .orElse(null);
        if (address == null) {
            return null;
        }
        address.setDefaultAddress(true);
        ShippingAddress saved = addressRepository.save(address);
        markOnlyDefault(userId, addressId);
        return saved;
    }

    @Override
    @Transactional
    public boolean deleteAddress(Long userId, Long addressId) {
        return addressRepository.findById(addressId)
                .filter(address -> address.getUser() != null && address.getUser().getId().equals(userId))
                .map(address -> {
                    addressRepository.delete(address);
                    return true;
                })
                .orElse(false);
    }

    private void markOnlyDefault(Long userId, Long defaultAddressId) {
        getAddresses(userId).stream()
                .filter(address -> !address.getId().equals(defaultAddressId) && address.isDefaultAddress())
                .forEach(address -> {
                    address.setDefaultAddress(false);
                    addressRepository.save(address);
                });
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
