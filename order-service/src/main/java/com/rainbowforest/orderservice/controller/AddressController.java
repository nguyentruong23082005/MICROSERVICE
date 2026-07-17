package com.rainbowforest.orderservice.controller;

import com.rainbowforest.orderservice.domain.ShippingAddress;
import com.rainbowforest.orderservice.dto.AddressRequest;
import com.rainbowforest.orderservice.http.header.HeaderGenerator;
import com.rainbowforest.orderservice.service.AddressService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class AddressController {

    private final AddressService addressService;
    private final HeaderGenerator headerGenerator;

    public AddressController(AddressService addressService, HeaderGenerator headerGenerator) {
        this.addressService = addressService;
        this.headerGenerator = headerGenerator;
    }

    @GetMapping("/{userId}/addresses")
    public ResponseEntity<List<ShippingAddress>> getAddresses(
            @PathVariable("userId") Long userId,
            HttpServletRequest request) {
        if (!canAccessUser(userId, request)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(addressService.getAddresses(userId));
    }

    @PostMapping("/{userId}/addresses")
    public ResponseEntity<ShippingAddress> saveAddress(
            @PathVariable("userId") Long userId,
            @Valid @RequestBody AddressRequest addressRequest,
            HttpServletRequest request) {
        if (!canAccessUser(userId, request)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        try {
            ShippingAddress saved = addressService.saveAddress(userId, addressRequest);
            return new ResponseEntity<>(
                    saved,
                    headerGenerator.getHeadersForSuccessPostMethod(request, saved.getId()),
                    HttpStatus.CREATED);
        } catch (Exception exception) {
            return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{userId}/addresses/{addressId}/default")
    public ResponseEntity<ShippingAddress> setDefaultAddress(
            @PathVariable("userId") Long userId,
            @PathVariable("addressId") Long addressId,
            HttpServletRequest request) {
        if (!canAccessUser(userId, request)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        ShippingAddress saved = addressService.setDefaultAddress(userId, addressId);
        if (saved == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{userId}/addresses/{addressId}")
    public ResponseEntity<Void> deleteAddress(
            @PathVariable("userId") Long userId,
            @PathVariable("addressId") Long addressId,
            HttpServletRequest request) {
        if (!canAccessUser(userId, request)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        if (addressService.deleteAddress(userId, addressId)) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    private boolean canAccessUser(Long userId, HttpServletRequest request) {
        String currentUserIdStr = request.getHeader("X-User-Id");
        String currentUserRoles = request.getHeader("X-User-Roles");
        if (currentUserIdStr == null || currentUserIdStr.isBlank()) {
            return false;
        }
        boolean isAdmin = currentUserRoles != null && currentUserRoles.contains("ROLE_ADMIN");
        return isAdmin || Long.valueOf(currentUserIdStr).equals(userId);
    }
}
