package com.rainbowforest.orderservice.service;

import com.rainbowforest.orderservice.domain.Coupon;
import com.rainbowforest.orderservice.dto.CouponPreviewResponse;
import com.rainbowforest.orderservice.repository.CouponRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CouponServiceTests {

    private Coupon coupon;

    @Mock
    private CouponRepository couponRepository;

    @InjectMocks
    private CouponServiceImpl couponService;

    @BeforeEach
    void setUp() {
        coupon = new Coupon();
        coupon.setCode("SAVE10");
        coupon.setDescription("Giảm 10%");
        coupon.setDiscountType("PERCENT");
        coupon.setDiscountValue(new BigDecimal("10"));
        coupon.setMinOrderTotal(BigDecimal.ZERO);
        coupon.setActive(true);
    }

    @Test
    void preview_should_calculate_percent_discount() {
        when(couponRepository.findByCodeIgnoreCase("SAVE10")).thenReturn(Optional.of(coupon));

        CouponPreviewResponse preview = couponService.preview("save10", new BigDecimal("1000000"));

        assertEquals("SAVE10", preview.getCode());
        assertEquals(new BigDecimal("100000"), preview.getDiscountTotal());
        assertEquals(new BigDecimal("900000"), preview.getTotal());
    }

    @Test
    void preview_should_reject_inactive_coupon() {
        coupon.setActive(false);
        when(couponRepository.findByCodeIgnoreCase("SAVE10")).thenReturn(Optional.of(coupon));

        assertThrows(IllegalArgumentException.class,
                () -> couponService.preview("SAVE10", new BigDecimal("1000000")));
    }

    @Test
    void getActiveCoupons_should_not_create_default_coupons_when_repository_is_empty() {
        when(couponRepository.findAll()).thenReturn(List.of());

        List<Coupon> activeCoupons = couponService.getActiveCoupons();

        assertTrue(activeCoupons.isEmpty());
        verify(couponRepository).findAll();
    }

    @Test
    void save_coupon_should_normalize_code_type_and_minimum() {
        Coupon draft = new Coupon();
        draft.setCode(" summer15 ");
        draft.setDescription("Summer sale");
        draft.setDiscountType("percent");
        draft.setDiscountValue(new BigDecimal("15"));

        when(couponRepository.save(any(Coupon.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Coupon saved = couponService.saveCoupon(draft);

        assertEquals("SUMMER15", saved.getCode());
        assertEquals("PERCENT", saved.getDiscountType());
        assertEquals(BigDecimal.ZERO, saved.getMinOrderTotal());
        verify(couponRepository).save(saved);
    }

    @Test
    void update_coupon_should_set_id_and_save() {
        coupon.setCode("SAVE20");
        coupon.setDiscountValue(new BigDecimal("20"));

        when(couponRepository.existsById(3L)).thenReturn(true);
        when(couponRepository.save(any(Coupon.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Coupon saved = couponService.updateCoupon(3L, coupon);

        assertEquals(3L, saved.getId());
        assertEquals("SAVE20", saved.getCode());
        verify(couponRepository).existsById(3L);
        verify(couponRepository).save(saved);
    }

    @Test
    void update_coupon_should_return_null_when_coupon_is_missing() {
        when(couponRepository.existsById(3L)).thenReturn(false);

        Coupon saved = couponService.updateCoupon(3L, coupon);

        assertNull(saved);
        verify(couponRepository).existsById(3L);
    }

    @Test
    void delete_coupon_should_delete_when_coupon_exists() {
        when(couponRepository.existsById(3L)).thenReturn(true);

        assertTrue(couponService.deleteCoupon(3L));

        verify(couponRepository).existsById(3L);
        verify(couponRepository).deleteById(3L);
    }

    @Test
    void delete_coupon_should_return_false_when_coupon_is_missing() {
        when(couponRepository.existsById(3L)).thenReturn(false);

        assertFalse(couponService.deleteCoupon(3L));

        verify(couponRepository).existsById(3L);
    }
}
