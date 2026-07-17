package com.rainbowforest.orderservice.controller;

import com.rainbowforest.orderservice.domain.Coupon;
import com.rainbowforest.orderservice.event.OrderEventPublisher;
import com.rainbowforest.orderservice.feignclient.UserClient;
import com.rainbowforest.orderservice.service.CartService;
import com.rainbowforest.orderservice.service.CouponService;
import com.rainbowforest.orderservice.service.OrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.session.store-type=none",
        "eureka.client.enabled=false",
        "eureka.client.register-with-eureka=false",
        "eureka.client.fetch-registry=false",
        "spring.datasource.url=jdbc:h2:mem:coupon-controller-test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class CouponControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CouponService couponService;

    @MockBean
    private UserClient userClient;

    @MockBean
    private OrderService orderService;

    @MockBean
    private CartService cartService;

    @MockBean
    private OrderEventPublisher orderEventPublisher;

    @Test
    void admin_should_list_all_coupons() throws Exception {
        Coupon coupon = new Coupon();
        coupon.setId(1L);
        coupon.setCode("SAVE10");
        coupon.setDiscountType("PERCENT");
        coupon.setDiscountValue(new BigDecimal("10"));

        when(couponService.getAllCoupons()).thenReturn(List.of(coupon));

        mockMvc.perform(get("/admin/coupons")
                        .header("X-User-Id", "1")
                        .header("X-User-Roles", "ROLE_ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("SAVE10"));
    }

    @Test
    void non_admin_should_not_create_coupon() throws Exception {
        mockMvc.perform(post("/admin/coupons")
                        .header("X-User-Id", "2")
                        .header("X-User-Roles", "ROLE_USER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void admin_should_create_coupon() throws Exception {
        Coupon saved = new Coupon();
        saved.setId(3L);
        saved.setCode("SUMMER15");
        saved.setDiscountType("PERCENT");
        saved.setDiscountValue(new BigDecimal("15"));

        when(couponService.saveCoupon(any(Coupon.class))).thenReturn(saved);

        mockMvc.perform(post("/admin/coupons")
                        .header("X-User-Id", "1")
                        .header("X-User-Roles", "ROLE_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "code": "summer15",
                                  "discountType": "PERCENT",
                                  "discountValue": 15,
                                  "active": true
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.code").value("SUMMER15"));
    }

    @Test
    void admin_should_update_coupon() throws Exception {
        Coupon saved = new Coupon();
        saved.setId(3L);
        saved.setCode("SUMMER20");
        saved.setDiscountType("PERCENT");
        saved.setDiscountValue(new BigDecimal("20"));

        when(couponService.updateCoupon(eq(3L), any(Coupon.class))).thenReturn(saved);

        mockMvc.perform(put("/admin/coupons/{id}", 3L)
                        .header("X-User-Id", "1")
                        .header("X-User-Roles", "ROLE_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "code": "summer20",
                                  "discountType": "PERCENT",
                                  "discountValue": 20,
                                  "active": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUMMER20"));
    }

    @Test
    void admin_should_delete_coupon() throws Exception {
        when(couponService.deleteCoupon(3L)).thenReturn(true);

        mockMvc.perform(delete("/admin/coupons/{id}", 3L)
                        .header("X-User-Id", "1")
                        .header("X-User-Roles", "ROLE_ADMIN"))
                .andExpect(status().isOk());

        verify(couponService).deleteCoupon(3L);
    }
}
