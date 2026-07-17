package com.rainbowforest.orderservice.controller;

import com.rainbowforest.orderservice.dto.ShippingFeeRequest;
import com.rainbowforest.orderservice.dto.ShippingFeeResponse;
import com.rainbowforest.orderservice.dto.ShippingLocationResponse;
import com.rainbowforest.orderservice.service.GhnShippingService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/shipping")
public class ShippingController {

    private final GhnShippingService ghnShippingService;

    public ShippingController(GhnShippingService ghnShippingService) {
        this.ghnShippingService = ghnShippingService;
    }

    @GetMapping("/provinces")
    public ResponseEntity<List<ShippingLocationResponse>> getProvinces() {
        return ResponseEntity.ok(ghnShippingService.getProvinces());
    }

    @GetMapping("/districts")
    public ResponseEntity<List<ShippingLocationResponse>> getDistricts(@RequestParam int provinceId) {
        if (provinceId <= 0) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(ghnShippingService.getDistricts(provinceId));
    }

    @GetMapping("/wards")
    public ResponseEntity<List<ShippingLocationResponse>> getWards(@RequestParam int districtId) {
        if (districtId <= 0) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(ghnShippingService.getWards(districtId));
    }

    @PostMapping("/fee")
    public ResponseEntity<ShippingFeeResponse> calculateFee(@Valid @RequestBody ShippingFeeRequest request) {
        return ResponseEntity.ok(ghnShippingService.calculateFee(request));
    }
}