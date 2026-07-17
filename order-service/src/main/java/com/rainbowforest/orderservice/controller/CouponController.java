package com.rainbowforest.orderservice.controller;

import com.rainbowforest.orderservice.domain.Coupon;
import com.rainbowforest.orderservice.dto.CouponPreviewResponse;
import com.rainbowforest.orderservice.service.CouponService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping("/coupons")
    public ResponseEntity<List<Coupon>> getActiveCoupons() {
        return ResponseEntity.ok(couponService.getActiveCoupons());
    }

    @GetMapping("/admin/coupons")
    public ResponseEntity<List<Coupon>> getAllCoupons(HttpServletRequest request) {
        if (!isAdmin(request)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(couponService.getAllCoupons());
    }

    @PostMapping("/admin/coupons")
    public ResponseEntity<Coupon> createCoupon(
            @RequestBody Coupon coupon,
            HttpServletRequest request) {
        if (!isAdmin(request)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        try {
            return new ResponseEntity<>(couponService.saveCoupon(coupon), HttpStatus.CREATED);
        } catch (IllegalArgumentException exception) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/admin/coupons/{id}")
    public ResponseEntity<Coupon> updateCoupon(
            @PathVariable("id") Long id,
            @RequestBody Coupon coupon,
            HttpServletRequest request) {
        if (!isAdmin(request)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        try {
            Coupon saved = couponService.updateCoupon(id, coupon);
            if (saved == null) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException exception) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/admin/coupons/{id}")
    public ResponseEntity<Void> deleteCoupon(
            @PathVariable("id") Long id,
            HttpServletRequest request) {
        if (!isAdmin(request)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        if (!couponService.deleteCoupon(id)) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/coupons/{code}/preview")
    public ResponseEntity<CouponPreviewResponse> previewCoupon(
            @PathVariable("code") String code,
            @RequestParam("subtotal") BigDecimal subtotal) {
        try {
            return ResponseEntity.ok(couponService.preview(code, subtotal));
        } catch (IllegalArgumentException exception) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    private boolean isAdmin(HttpServletRequest request) {
        String roles = request.getHeader("X-User-Roles");
        return roles != null && roles.contains("ROLE_ADMIN");
    }
}
