package com.rainbowforest.orderservice.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.servlet.http.Cookie;

import org.mockito.ArgumentCaptor;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.rainbowforest.orderservice.domain.Item;
import com.rainbowforest.orderservice.domain.Order;
import com.rainbowforest.orderservice.domain.User;
import com.rainbowforest.orderservice.dto.ShippingInfoRequest;
import com.rainbowforest.orderservice.event.OrderEventPublisher;
import com.rainbowforest.orderservice.feignclient.UserClient;
import com.rainbowforest.orderservice.service.CartService;
import com.rainbowforest.orderservice.service.OrderService;

/**
 * Integration test cho OrderController dùng @SpringBootTest + @AutoConfigureMockMvc.
 *
 * @TestPropertySource đảm bảo Spring Session Redis và Eureka bị tắt
 * trong test context (cao hơn application.properties).
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.session.store-type=none",
        "eureka.client.enabled=false",
        "eureka.client.register-with-eureka=false",
        "eureka.client.fetch-registry=false",
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class OrderControllerTest {

    private static final String PRODUCT_NAME = "test";
    private static final Long PRODUCT_ID = 5L;
    private static final Long USER_ID = 1L;
    private static final String USER_NAME = "Test";
    private static final String CART_ID = "1";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserClient userClient;

    @MockBean
    private OrderService orderService;

    @MockBean
    private CartService cartService;

    @MockBean
    private OrderEventPublisher orderEventPublisher;

    @Test
    void save_order_controller_should_return201_when_valid_request() throws Exception {
        // given — setup User
        User user = new User();
        user.setId(USER_ID);
        user.setUserName(USER_NAME);

        // given — setup Item với denormalized fields
        Item item = new Item();
        item.setProductId(PRODUCT_ID);
        item.setProductName(PRODUCT_NAME);
        item.setProductPrice(new BigDecimal("100.00"));
        item.setProductCategory("test-category");
        item.setQuantity(2);
        item.setSubTotal(new BigDecimal("200.00"));

        List<Item> cart = new ArrayList<>();
        cart.add(item);

        // given — Order trả về sau khi save
        Order savedOrder = new Order();
        savedOrder.setId(99L);
        savedOrder.setItems(cart);
        savedOrder.setUser(user);
        savedOrder.setTotal(new BigDecimal("200.00"));
        savedOrder.setOrderedDate(LocalDate.now());
        savedOrder.setStatus("PAYMENT_EXPECTED");

        Cookie cookie = new Cookie("cartId", CART_ID);

        when(orderService.placeOrder(USER_ID, CART_ID, null, false)).thenReturn(savedOrder);

        // then — kiểm tra response trả về đầy đủ: user, products, quantity, total
        mockMvc.perform(post("/order/{userId}", USER_ID)
                        .cookie(cookie)
                        .header("X-User-Id", USER_ID.toString())
                        .header("X-User-Roles", "ROLE_USER"))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(99))
                .andExpect(jsonPath("$.status").value("PAYMENT_EXPECTED"))
                .andExpect(jsonPath("$.total").value(200.00))
                .andExpect(jsonPath("$.user.userName").value(USER_NAME))
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items[0].quantity").value(2))
                .andExpect(jsonPath("$.items[0].subTotal").value(200.00))
                .andExpect(jsonPath("$.items[0].product.productName").value(PRODUCT_NAME))
                .andExpect(jsonPath("$.items[0].product.id").value(PRODUCT_ID));

        verify(orderService, times(1)).placeOrder(USER_ID, CART_ID, null, false);
        verifyNoMoreInteractions(orderService);
    }

    @Test
    void save_order_controller_should_store_shipping_info_when_request_body_is_present() throws Exception {
        User user = new User();
        user.setId(USER_ID);
        user.setUserName(USER_NAME);
        user.setPhoneNumber("0999999999");

        Item item = new Item();
        item.setProductId(PRODUCT_ID);
        item.setProductName(PRODUCT_NAME);
        item.setProductPrice(new BigDecimal("100.00"));
        item.setQuantity(1);
        item.setSubTotal(new BigDecimal("100.00"));

        List<Item> cart = List.of(item);
        String body = """
                {
                  "shippingName": "Linh Nguyen",
                  "shippingEmail": "linh@example.com",
                  "shippingPhone": "0901123456",
                  "shippingAddress": "12 Nguyen Trai",
                  "shippingCity": "Ha Noi",
                  "shippingFee": 25000
                }
                """;

        when(orderService.placeOrder(eq(USER_ID), eq(CART_ID), any(ShippingInfoRequest.class), eq(false))).thenAnswer(invocation -> {
            ShippingInfoRequest request = invocation.getArgument(2);
            Order order = new Order();
            order.setId(100L);
            order.setUser(user);
            order.setItems(cart);
            order.setStatus("PAYMENT_EXPECTED");
            order.setTotal(new BigDecimal("100.00"));
            order.setOrderedDate(LocalDate.now());
            order.setShippingName(request.getShippingName());
            order.setShippingEmail(request.getShippingEmail());
            order.setShippingPhone(request.getShippingPhone());
            order.setShippingAddress(request.getShippingAddress());
            order.setShippingCity(request.getShippingCity());
            order.setShippingFee(request.getShippingFee());
            order.setPhoneNumber(request.getShippingPhone());
            return order;
        });

        mockMvc.perform(post("/order/{userId}/cart/{cartId}", USER_ID, CART_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .header("X-User-Id", USER_ID.toString())
                        .header("X-User-Roles", "ROLE_USER"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.shippingName").value("Linh Nguyen"))
                .andExpect(jsonPath("$.shippingEmail").value("linh@example.com"))
                .andExpect(jsonPath("$.shippingPhone").value("0901123456"))
                .andExpect(jsonPath("$.shippingAddress").value("12 Nguyen Trai"))
                .andExpect(jsonPath("$.shippingCity").value("Ha Noi"))
                .andExpect(jsonPath("$.shippingFee").value(25000))
                .andExpect(jsonPath("$.phoneNumber").value("0901123456"));

        ArgumentCaptor<ShippingInfoRequest> requestCaptor = ArgumentCaptor.forClass(ShippingInfoRequest.class);
        verify(orderService, times(1)).placeOrder(eq(USER_ID), eq(CART_ID), requestCaptor.capture(), eq(false));
        ShippingInfoRequest captured = requestCaptor.getValue();
        assertEquals("Linh Nguyen", captured.getShippingName());
        assertEquals("linh@example.com", captured.getShippingEmail());
        assertEquals("0901123456", captured.getShippingPhone());
        assertEquals("12 Nguyen Trai", captured.getShippingAddress());
        assertEquals("Ha Noi", captured.getShippingCity());
        assertEquals(new BigDecimal("25000"), captured.getShippingFee());
    }

    @Test
    void save_order_controller_should_apply_coupon_when_request_contains_coupon_code() throws Exception {
        User user = new User();
        user.setId(USER_ID);
        user.setUserName(USER_NAME);

        Item item = new Item();
        item.setProductId(PRODUCT_ID);
        item.setProductName(PRODUCT_NAME);
        item.setProductPrice(new BigDecimal("1000000"));
        item.setQuantity(1);
        item.setSubTotal(new BigDecimal("1000000"));

        String body = """
                {
                  "shippingName": "Linh Nguyen",
                  "shippingPhone": "0901123456",
                  "shippingAddress": "12 Nguyen Trai",
                  "shippingCity": "Ha Noi",
                  "couponCode": "SAVE10"
                }
                """;

        when(orderService.placeOrder(eq(USER_ID), eq(CART_ID), any(ShippingInfoRequest.class), eq(false))).thenAnswer(invocation -> {
            Order order = new Order();
            order.setId(105L);
            order.setUser(user);
            order.setItems(List.of(item));
            order.setStatus("PAYMENT_EXPECTED");
            order.setOrderedDate(LocalDate.now());
            order.setCouponCode("SAVE10");
            order.setSubtotal(new BigDecimal("1000000"));
            order.setDiscountTotal(new BigDecimal("100000"));
            order.setTotal(new BigDecimal("900000"));
            order.setTrackingNumber("ORD-TEST");
            return order;
        });

        mockMvc.perform(post("/order/{userId}/cart/{cartId}", USER_ID, CART_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .header("X-User-Id", USER_ID.toString())
                        .header("X-User-Roles", "ROLE_USER"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.couponCode").value("SAVE10"))
                .andExpect(jsonPath("$.subtotal").value(1000000))
                .andExpect(jsonPath("$.discountTotal").value(100000))
                .andExpect(jsonPath("$.total").value(900000))
                .andExpect(jsonPath("$.trackingNumber").exists())
                .andExpect(jsonPath("$.trackingSteps[0].status").value("PAYMENT_EXPECTED"));
    }

    @Test
    void address_controller_should_save_current_users_address() throws Exception {
        User user = new User();
        user.setId(USER_ID);
        user.setUserName(USER_NAME);
        user.setPhoneNumber("0901123456");

        String body = """
                {
                  "recipientName": "Linh Nguyen",
                  "email": "linh@example.com",
                  "phone": "0901123456",
                  "addressLine": "12 Nguyen Trai",
                  "city": "Ha Noi",
                  "defaultAddress": true
                }
                """;

        when(userClient.getUserById(USER_ID)).thenReturn(user);

        mockMvc.perform(post("/{userId}/addresses", USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .header("X-User-Id", USER_ID.toString())
                        .header("X-User-Roles", "ROLE_USER"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.recipientName").value("Linh Nguyen"))
                .andExpect(jsonPath("$.addressLine").value("12 Nguyen Trai"))
                .andExpect(jsonPath("$.defaultAddress").value(true));

        mockMvc.perform(get("/{userId}/addresses", USER_ID)
                        .header("X-User-Id", USER_ID.toString())
                        .header("X-User-Roles", "ROLE_USER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].recipientName").value("Linh Nguyen"));
    }

    @Test
    void get_orders_by_user_controller_should_return_current_users_orders() throws Exception {
        User user = new User();
        user.setId(USER_ID);
        user.setUserName(USER_NAME);

        Order order = new Order();
        order.setId(101L);
        order.setUser(user);
        order.setOrderedDate(LocalDate.now());
        order.setStatus("PAID");
        order.setTotal(new BigDecimal("300.00"));
        order.setShippingName("Linh Nguyen");
        order.setShippingCity("Ha Noi");

        when(orderService.getOrdersByUserId(USER_ID)).thenReturn(List.of(order));

        mockMvc.perform(get("/orders/user/{userId}", USER_ID)
                        .header("X-User-Id", USER_ID.toString())
                        .header("X-User-Roles", "ROLE_USER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(101))
                .andExpect(jsonPath("$[0].shippingName").value("Linh Nguyen"))
                .andExpect(jsonPath("$[0].shippingCity").value("Ha Noi"));

        verify(orderService, times(1)).getOrdersByUserId(USER_ID);
    }

    @Test
    void cancel_order_controller_should_cancel_current_users_order_when_status_is_open() throws Exception {
        User user = new User();
        user.setId(USER_ID);
        user.setUserName(USER_NAME);

        Order order = new Order();
        order.setId(102L);
        order.setUser(user);
        order.setOrderedDate(LocalDate.now());
        order.setStatus("PAYMENT_EXPECTED");
        order.setTotal(new BigDecimal("300.00"));

        Order cancelled = new Order();
        cancelled.setId(102L);
        cancelled.setUser(user);
        cancelled.setOrderedDate(order.getOrderedDate());
        cancelled.setStatus("CANCELLED");
        cancelled.setTotal(order.getTotal());

        when(orderService.getOrderById(102L)).thenReturn(order);
        when(orderService.cancelOrder(102L)).thenReturn(cancelled);

        mockMvc.perform(put("/order/{orderId}/cancel", 102L)
                        .header("X-User-Id", USER_ID.toString())
                        .header("X-User-Roles", "ROLE_USER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(102))
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        verify(orderService, times(1)).getOrderById(102L);
        verify(orderService, times(1)).cancelOrder(102L);
    }

    @Test
    void cancel_order_controller_should_forbid_non_owner_user() throws Exception {
        User owner = new User();
        owner.setId(USER_ID);
        owner.setUserName(USER_NAME);

        Order order = new Order();
        order.setId(103L);
        order.setUser(owner);
        order.setStatus("PAYMENT_EXPECTED");

        when(orderService.getOrderById(103L)).thenReturn(order);

        mockMvc.perform(put("/order/{orderId}/cancel", 103L)
                        .header("X-User-Id", "999")
                        .header("X-User-Roles", "ROLE_USER"))
                .andExpect(status().isForbidden());

        verify(orderService, times(1)).getOrderById(103L);
    }

    @Test
    void cancel_order_controller_should_reject_delivered_order() throws Exception {
        User user = new User();
        user.setId(USER_ID);
        user.setUserName(USER_NAME);

        Order order = new Order();
        order.setId(104L);
        order.setUser(user);
        order.setStatus("DELIVERED");

        when(orderService.getOrderById(104L)).thenReturn(order);

        mockMvc.perform(put("/order/{orderId}/cancel", 104L)
                        .header("X-User-Id", USER_ID.toString())
                        .header("X-User-Roles", "ROLE_USER"))
                .andExpect(status().isConflict());

        verify(orderService, times(1)).getOrderById(104L);
    }
}
