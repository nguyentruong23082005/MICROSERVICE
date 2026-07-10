package com.rainbowforest.orderservice.controller;

import com.rainbowforest.orderservice.domain.Item;
import com.rainbowforest.orderservice.domain.Order;
import com.rainbowforest.orderservice.domain.User;
import com.rainbowforest.orderservice.dto.OrderResponse;
import com.rainbowforest.orderservice.dto.ShippingInfoRequest;
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
import jakarta.validation.Valid;

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
     * Lấy tất cả đơn hàng (Chỉ ADMIN mới có quyền truy cập).
     */
    @GetMapping(value = "/orders")
    public ResponseEntity<List<OrderResponse>> getAllOrders(HttpServletRequest request) {
        String currentUserIdStr = request.getHeader("X-User-Id");
        String currentUserRoles = request.getHeader("X-User-Roles");
        if (currentUserIdStr == null || currentUserIdStr.isBlank()) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        boolean isAdmin = currentUserRoles != null && currentUserRoles.contains("ROLE_ADMIN");
        if (!isAdmin) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        List<Order> orders = orderService.getAllOrders();
        List<OrderResponse> responses = orders.stream()
                .map(OrderResponse::from)
                .collect(java.util.stream.Collectors.toList());
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    /**
     * Lay danh sach don hang cua mot user. USER chi duoc xem don cua minh; ADMIN duoc xem user bat ky.
     */
    @GetMapping(value = "/orders/user/{userId}")
    public ResponseEntity<List<OrderResponse>> getOrdersByUserId(
            @PathVariable("userId") Long userId,
            HttpServletRequest request) {
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

        List<OrderResponse> responses = orderService.getOrdersByUserId(userId).stream()
                .map(OrderResponse::from)
                .collect(java.util.stream.Collectors.toList());
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    /**
     * Cập nhật trạng thái đơn hàng (Chỉ ADMIN mới có quyền truy cập).
     */
    @PutMapping(value = "/order/{orderId}/status")
    public ResponseEntity<Void> updateOrderStatus(
            @PathVariable("orderId") Long orderId,
            @RequestParam("status") String status,
            HttpServletRequest request) {
        String currentUserRoles = request.getHeader("X-User-Roles");
        boolean isAdmin = currentUserRoles != null && currentUserRoles.contains("ROLE_ADMIN");
        if (!isAdmin) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        Order order = orderService.getOrderById(orderId);
        if (order == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        orderService.updateOrderStatus(orderId, status);
        return ResponseEntity.ok().build();
    }

    /**
     * Huỷ đơn hàng. Chủ đơn hàng hoặc ADMIN mới có quyền huỷ.
     * Không thể huỷ khi đã DELIVERED hoặc đã CANCELLED.
     */
    @PutMapping(value = "/order/{orderId}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(
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

        boolean isOwner = order.getUser() != null && order.getUser().getId().equals(currentUserId);
        if (!isOwner && !isAdmin) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }

        String status = order.getStatus();
        if ("DELIVERED".equals(status) || "CANCELLED".equals(status)) {
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }

        try {
            Order cancelled = orderService.cancelOrder(orderId);
            return new ResponseEntity<>(OrderResponse.from(cancelled), HttpStatus.OK);
        } catch (IllegalStateException ex) {
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }
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
            @Valid @RequestBody(required = false) ShippingInfoRequest shippingInfo,
            HttpServletRequest request) {

        return processOrder(userId, cartId, forceFailure, shippingInfo, request);
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
            @Valid @RequestBody(required = false) ShippingInfoRequest shippingInfo,
            HttpServletRequest request) {

        return processOrder(userId, cartId, forceFailure, shippingInfo, request);
    }

    // ─── Private helper ─────────────────────────────────────────────────────

    private ResponseEntity<OrderResponse> processOrder(Long userId, String cartId,
                                                        boolean forceFailure,
                                                        ShippingInfoRequest shippingInfo,
                                                        HttpServletRequest request) {
        // Kiểm tra tính hợp lệ: Chỉ USER tự đặt cho mình hoặc ADMIN đặt cho USER
        String currentUserIdStr = request.getHeader("X-User-Id");
        String currentUserRoles = request.getHeader("X-User-Roles");
        System.out.println("[DEBUG-ORDER] currentUserIdStr: " + currentUserIdStr + ", path userId: " + userId + ", roles: " + currentUserRoles);
        if (currentUserIdStr == null || currentUserIdStr.isBlank()) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        Long currentUserId = Long.parseLong(currentUserIdStr);
        boolean isAdmin = currentUserRoles != null && currentUserRoles.contains("ROLE_ADMIN");

        if (!currentUserId.equals(userId) && !isAdmin) {
            System.out.println("[DEBUG-ORDER] Forbidden check failed! currentUserId: " + currentUserId + " != " + userId + " and isAdmin: " + isAdmin);
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
                Order order = createOrder(cart, localUser, shippingInfo, phoneSnapshot);
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

    private Order createOrder(List<Item> cart, User user, ShippingInfoRequest shippingInfo, String phoneNumber) {
        Order order = new Order();
        String shippingPhone = firstPresent(shippingInfo == null ? null : shippingInfo.getShippingPhone(), phoneNumber);
        order.setItems(cart);
        order.setUser(user);
        order.setTotal(OrderUtilities.countTotalPrice(cart));
        order.setOrderedDate(LocalDate.now());
        order.setStatus("PAYMENT_EXPECTED");
        order.setPhoneNumber(shippingPhone);
        order.setShippingName(firstPresent(shippingInfo == null ? null : shippingInfo.getShippingName(), user.getUserName()));
        order.setShippingEmail(normalize(shippingInfo == null ? null : shippingInfo.getShippingEmail()));
        order.setShippingPhone(shippingPhone);
        order.setShippingAddress(normalize(shippingInfo == null ? null : shippingInfo.getShippingAddress()));
        order.setShippingCity(normalize(shippingInfo == null ? null : shippingInfo.getShippingCity()));
        return order;
    }

    private String firstPresent(String preferred, String fallback) {
        String normalized = normalize(preferred);
        return normalized != null ? normalized : normalize(fallback);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
