package com.rainbowforest.orderservice.controller;

import com.rainbowforest.orderservice.domain.Item;
import com.rainbowforest.orderservice.domain.Order;
import com.rainbowforest.orderservice.domain.User;
import com.rainbowforest.orderservice.dto.OrderResponse;
import com.rainbowforest.orderservice.event.OrderEventPublisher;
import com.rainbowforest.orderservice.feignclient.UserClient;
import com.rainbowforest.orderservice.http.header.HeaderGenerator;
import com.rainbowforest.orderservice.repository.UserRepository;
import com.rainbowforest.orderservice.service.CartService;
import com.rainbowforest.orderservice.service.OrderService;
import com.rainbowforest.orderservice.utilities.OrderUtilities;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import jakarta.servlet.http.HttpServletRequest;

@RestController
public class OrderController {

    @Autowired private UserClient userClient;
    @Autowired private OrderService orderService;
    @Autowired private CartService cartService;
    @Autowired private OrderEventPublisher orderEventPublisher;
    @Autowired private HeaderGenerator headerGenerator;
    @Autowired private UserRepository userRepository;

    /**
     * Lấy thông tin đơn hàng theo orderId (Chỉ ADMIN hoặc chủ đơn hàng mới có quyền xem).
     */
    @GetMapping(value = "/order/{orderId}")
    public ResponseEntity<OrderResponse> getOrderById(
            @PathVariable("orderId") Long orderId,
            HttpServletRequest request) {

        String currentUserIdStr = request.getHeader("X-User-Id");
        String currentUserRoles = request.getHeader("X-User-Roles");
        if (currentUserIdStr == null || currentUserIdStr.isBlank()) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        Long currentUserId = Long.parseLong(currentUserIdStr);
        boolean isAdmin = currentUserRoles != null && currentUserRoles.contains("ROLE_ADMIN");

        Order order = orderService.getOrderById(orderId);
        if (order == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        // Kiểm tra quyền sở hữu bằng ID trực tiếp
        boolean isOwner = order.getUser() != null && order.getUser().getId().equals(currentUserId);
        if (!isOwner && !isAdmin) {
            // Trả về 404 để ẩn giấu sự tồn tại của resource (Enumeration Attack mitigation)
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        return new ResponseEntity<>(OrderResponse.from(order), HttpStatus.OK);
    }

    /**
     * Đặt hàng với cookie cartId.
     * @param forceFailure true → giả lập thanh toán thất bại (demo Saga compensation)
     */
    @PostMapping(value = "/order/{userId}")
    public ResponseEntity<OrderResponse> saveOrder(
            @PathVariable("userId") Long userId,
            @CookieValue(value = "cartId", required = false) String cartId,
            @RequestParam(value = "forceFailure", required = false, defaultValue = "false") boolean forceFailure,
            HttpServletRequest request) {

        return processOrder(userId, cartId, forceFailure, request);
    }

    /**
     * Đặt hàng với cartId qua path variable (dễ test hơn với Postman).
     * @param forceFailure true → giả lập thanh toán thất bại
     */
    @PostMapping(value = "/order/{userId}/cart/{cartId}")
    public ResponseEntity<OrderResponse> saveOrderByPath(
            @PathVariable("userId") Long userId,
            @PathVariable("cartId") String cartId,
            @RequestParam(value = "forceFailure", required = false, defaultValue = "false") boolean forceFailure,
            HttpServletRequest request) {

        return processOrder(userId, cartId, forceFailure, request);
    }

    // ─── Private helper ─────────────────────────────────────────────────────

    private ResponseEntity<OrderResponse> processOrder(Long userId, String cartId,
                                                        boolean forceFailure,
                                                        HttpServletRequest request) {
        // Kiểm tra tính hợp lệ: Chỉ USER tự đặt cho mình hoặc ADMIN đặt cho USER
        String currentUserIdStr = request.getHeader("X-User-Id");
        String currentUserRoles = request.getHeader("X-User-Roles");
        if (currentUserIdStr == null || currentUserIdStr.isBlank()) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        Long currentUserId = Long.parseLong(currentUserIdStr);
        boolean isAdmin = currentUserRoles != null && currentUserRoles.contains("ROLE_ADMIN");

        if (!currentUserId.equals(userId) && !isAdmin) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }

        List<Item> cart = cartService.getAllItemsFromCart(cartId);
        User user = userClient.getUserById(userId);

        if (cart != null && !cart.isEmpty() && user != null) {
            try {
                // Tìm kiếm người dùng trong DB cục bộ trước
                User localUser = userRepository.findById(userId).orElse(null);
                if (localUser == null) {
                    // Lưu mới với ID gốc
                    localUser = userRepository.save(user);
                }

                String phoneSnapshot = user.getPhoneNumber();
                Order order = createOrder(cart, localUser, phoneSnapshot);
                Order savedOrder = orderService.saveOrder(order);
                orderEventPublisher.publishOrderCreated(savedOrder, forceFailure);
                cartService.deleteCart(cartId);

                OrderResponse response = OrderResponse.from(savedOrder);
                return new ResponseEntity<>(
                        response,
                        headerGenerator.getHeadersForSuccessPostMethod(request, savedOrder.getId()),
                        HttpStatus.CREATED);
            } catch (Exception ex) {
                ex.printStackTrace();
                return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.NOT_FOUND);
    }

    private Order createOrder(List<Item> cart, User user, String phoneNumber) {
        Order order = new Order();
        order.setItems(cart);
        order.setUser(user);
        order.setTotal(OrderUtilities.countTotalPrice(cart));
        order.setOrderedDate(LocalDate.now());
        order.setStatus("PAYMENT_EXPECTED");
        order.setPhoneNumber(phoneNumber);
        return order;
    }
}
