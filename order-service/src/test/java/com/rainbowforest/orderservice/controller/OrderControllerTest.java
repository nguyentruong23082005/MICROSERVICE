package com.rainbowforest.orderservice.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.servlet.http.Cookie;

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

        // when
        when(cartService.getAllItemsFromCart(CART_ID)).thenReturn(cart);
        when(userClient.getUserById(USER_ID)).thenReturn(user);
        when(orderService.saveOrder(any(Order.class))).thenReturn(savedOrder);

        // then — kiểm tra response trả về đầy đủ: user, products, quantity, total
        mockMvc.perform(post("/order/{userId}", USER_ID).cookie(cookie))
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

        verify(orderService, times(1)).saveOrder(any(Order.class));
        verifyNoMoreInteractions(orderService);
    }
}
