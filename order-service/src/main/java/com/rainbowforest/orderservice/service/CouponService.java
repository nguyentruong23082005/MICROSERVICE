package com.rainbowforest.orderservice.service;

import com.rainbowforest.orderservice.domain.Coupon;
import com.rainbowforest.orderservice.dto.CouponPreviewResponse;

import java.math.BigDecimal;
import java.util.List;

public interface CouponService {
    List<Coupon> getAllCoupons();
    List<Coupon> getActiveCoupons();
    Coupon getCouponById(Long id);
    Coupon saveCoupon(Coupon coupon);
    Coupon updateCoupon(Long id, Coupon coupon);
    boolean deleteCoupon(Long id);
    Coupon getValidCoupon(String code, BigDecimal subtotal);
    BigDecimal calculateDiscount(Coupon coupon, BigDecimal subtotal);
    CouponPreviewResponse preview(String code, BigDecimal subtotal);
}
