package com.rainbowforest.orderservice.service;

import com.rainbowforest.orderservice.domain.Coupon;
import com.rainbowforest.orderservice.dto.CouponPreviewResponse;
import com.rainbowforest.orderservice.repository.CouponRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class CouponServiceImpl implements CouponService {

    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");

    private final CouponRepository couponRepository;

    public CouponServiceImpl(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Coupon> getActiveCoupons() {
        LocalDate today = LocalDate.now();
        return couponRepository.findAll().stream()
                .filter(coupon -> isInActiveWindow(coupon, today))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Coupon getCouponById(Long id) {
        if (id == null) {
            return null;
        }
        return couponRepository.findById(id).orElse(null);
    }

    @Override
    @Transactional
    public Coupon saveCoupon(Coupon coupon) {
        if (coupon == null) {
            throw new IllegalArgumentException("Coupon is required");
        }
        String code = normalizeCode(coupon.getCode());
        String discountType = normalizeDiscountType(coupon.getDiscountType());
        BigDecimal discountValue = safeAmount(coupon.getDiscountValue());

        if (code == null) {
            throw new IllegalArgumentException("Coupon code is required");
        }
        if (!"PERCENT".equals(discountType) && !"FIXED".equals(discountType)) {
            throw new IllegalArgumentException("Unsupported coupon type");
        }
        if (discountValue.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Discount value must be greater than zero");
        }

        coupon.setCode(code);
        coupon.setDiscountType(discountType);
        coupon.setDiscountValue(discountValue);
        coupon.setMinOrderTotal(safeAmount(coupon.getMinOrderTotal()));
        return couponRepository.save(coupon);
    }

    @Override
    @Transactional
    public Coupon updateCoupon(Long id, Coupon coupon) {
        if (id == null || coupon == null) {
            throw new IllegalArgumentException("Coupon id and payload are required");
        }
        if (!couponRepository.existsById(id)) {
            return null;
        }
        coupon.setId(id);
        return saveCoupon(coupon);
    }

    @Override
    @Transactional
    public boolean deleteCoupon(Long id) {
        if (id == null || !couponRepository.existsById(id)) {
            return false;
        }
        couponRepository.deleteById(id);
        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public Coupon getValidCoupon(String code, BigDecimal subtotal) {
        String normalized = normalizeCode(code);
        if (normalized == null) {
            return null;
        }
        Coupon coupon = couponRepository.findByCodeIgnoreCase(normalized)
                .orElseThrow(() -> new IllegalArgumentException("Coupon not found"));
        validateCoupon(coupon, subtotal);
        return coupon;
    }

    @Override
    public BigDecimal calculateDiscount(Coupon coupon, BigDecimal subtotal) {
        if (coupon == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal safeSubtotal = safeAmount(subtotal);
        BigDecimal discount;
        if ("PERCENT".equalsIgnoreCase(coupon.getDiscountType())) {
            discount = safeSubtotal.multiply(coupon.getDiscountValue())
                    .divide(ONE_HUNDRED, 0, RoundingMode.HALF_UP);
        } else if ("FIXED".equalsIgnoreCase(coupon.getDiscountType())) {
            discount = coupon.getDiscountValue();
        } else {
            throw new IllegalArgumentException("Unsupported coupon type");
        }
        return discount.min(safeSubtotal).max(BigDecimal.ZERO);
    }

    @Override
    @Transactional(readOnly = true)
    public CouponPreviewResponse preview(String code, BigDecimal subtotal) {
        BigDecimal safeSubtotal = safeAmount(subtotal);
        Coupon coupon = getValidCoupon(code, safeSubtotal);
        BigDecimal discount = calculateDiscount(coupon, safeSubtotal);
        return new CouponPreviewResponse(
                coupon.getCode(),
                coupon.getDescription(),
                safeSubtotal,
                discount,
                safeSubtotal.subtract(discount));
    }

    private void validateCoupon(Coupon coupon, BigDecimal subtotal) {
        BigDecimal safeSubtotal = safeAmount(subtotal);
        if (!isInActiveWindow(coupon, LocalDate.now())) {
            throw new IllegalArgumentException("Coupon is inactive");
        }
        BigDecimal minimum = safeAmount(coupon.getMinOrderTotal());
        if (safeSubtotal.compareTo(minimum) < 0) {
            throw new IllegalArgumentException("Order total is below coupon minimum");
        }
    }

    private boolean isInActiveWindow(Coupon coupon, LocalDate today) {
        if (coupon == null || !coupon.isActive()) {
            return false;
        }
        if (coupon.getStartsAt() != null && today.isBefore(coupon.getStartsAt())) {
            return false;
        }
        return coupon.getExpiresAt() == null || !today.isAfter(coupon.getExpiresAt());
    }

    private BigDecimal safeAmount(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.max(BigDecimal.ZERO);
    }

    private String normalizeCode(String code) {
        if (code == null) {
            return null;
        }
        String trimmed = code.trim();
        return trimmed.isEmpty() ? null : trimmed.toUpperCase();
    }

    private String normalizeDiscountType(String discountType) {
        if (discountType == null) {
            return null;
        }
        String trimmed = discountType.trim();
        return trimmed.isEmpty() ? null : trimmed.toUpperCase();
    }
}
