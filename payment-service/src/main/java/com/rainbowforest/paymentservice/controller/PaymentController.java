package com.rainbowforest.paymentservice.controller;

import com.rainbowforest.paymentservice.domain.Payment;
import com.rainbowforest.paymentservice.service.PaymentService;
import com.rainbowforest.paymentservice.service.VNPayService;
import com.rainbowforest.paymentservice.service.MoMoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final PaymentService paymentService;
    private final VNPayService vnPayService;
    private final MoMoService moMoService;
    private final String frontendBaseUrl;

    public PaymentController(
            PaymentService paymentService,
            VNPayService vnPayService,
            MoMoService moMoService,
            @Value("${app.frontend-base-url:http://localhost:5173}") String frontendBaseUrl) {
        this.paymentService = paymentService;
        this.vnPayService = vnPayService;
        this.moMoService = moMoService;
        this.frontendBaseUrl = frontendBaseUrl.replaceAll("/+$", "");
    }

    @GetMapping
    public ResponseEntity<List<Payment>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<Payment>> getPaymentsByOrderId(@PathVariable Long orderId) {
        return ResponseEntity.ok(paymentService.getPaymentsByOrderId(orderId));
    }

    @GetMapping("/revenue")
    public ResponseEntity<com.rainbowforest.paymentservice.dto.RevenueStatisticsResponse> getRevenue() {
        return ResponseEntity.ok(paymentService.getRevenueStatistics());
    }

    // ─── VNPAY ─────────────────────────────────────────────────────────────

    @PostMapping("/vnpay/create")
    public ResponseEntity<Map<String, String>> createVNPayPayment(
            @RequestParam Long orderId,
            HttpServletRequest request) {
        PaymentService.GatewayPaymentIntent intent = paymentService.getPendingGatewayIntent(orderId);
        VNPayService.PaymentRequestResult gatewayResult = vnPayService.createPayment(
                intent.orderId(),
                intent.amount(),
                "Thanh toán đơn hàng " + intent.orderId(),
                request.getRemoteAddr());
        paymentService.prepareGatewayPayment(orderId, "VNPAY", gatewayResult.transactionRef());
        return ResponseEntity.ok(Map.of("payUrl", gatewayResult.payUrl()));
    }

    @GetMapping("/vnpay/return")
    public ResponseEntity<Void> vnPayReturn(@RequestParam Map<String, String> params) {
        boolean valid = vnPayService.verifySignature(params);
        Optional<String> orderId = extractOrderIdSegment(params.get("vnp_TxnRef"));
        boolean succeeded = valid && orderId.isPresent() && "00".equals(params.get("vnp_ResponseCode"));

        if (valid && orderId.isPresent()) {
            processVNPayCallback(params, orderId.get());
        }

        return redirectToFrontendResult("vnpay", orderId, succeeded);
    }

    @GetMapping("/vnpay/ipn")
    public ResponseEntity<Map<String, String>> vnPayIpn(@RequestParam Map<String, String> params) {
        Map<String, String> response = new HashMap<>();
        boolean valid = vnPayService.verifySignature(params);
        if (!valid) {
            response.put("RspCode", "97");
            response.put("Message", "Invalid signature");
            return ResponseEntity.ok(response);
        }

        String txnRef = params.get("vnp_TxnRef");
        Optional<String> orderId = extractOrderIdSegment(txnRef);
        if (orderId.isEmpty()) {
            response.put("RspCode", "01");
            response.put("Message", "Order not found");
            return ResponseEntity.ok(response);
        }

        boolean processed = processVNPayCallback(params, orderId.get());
        response.put("RspCode", processed ? "00" : "99");
        response.put("Message", processed ? "Confirm Success" : "Callback rejected");
        return ResponseEntity.ok(response);
    }

    // ─── MOMO ──────────────────────────────────────────────────────────────

    @PostMapping("/momo/create")
    public ResponseEntity<Map<String, String>> createMoMoPayment(@RequestParam Long orderId) {
        PaymentService.GatewayPaymentIntent intent = paymentService.getPendingGatewayIntent(orderId);
        MoMoService.PaymentRequestResult gatewayResult = moMoService.createPayment(
                intent.orderId(),
                intent.amount(),
                "Thanh toán đơn hàng " + intent.orderId());
        paymentService.prepareGatewayPayment(orderId, "MOMO", gatewayResult.transactionRef());
        return ResponseEntity.ok(Map.of("payUrl", gatewayResult.payUrl()));
    }

    @GetMapping("/momo/return")
    public ResponseEntity<Void> moMoReturn(@RequestParam Map<String, String> params) {
        boolean valid = moMoService.verifySignature(params);
        Optional<String> orderId = extractOrderIdSegment(params.get("orderId"));
        boolean succeeded = valid && orderId.isPresent() && "0".equals(params.get("resultCode"));

        return redirectToFrontendResult("momo", orderId, succeeded);
    }

    @PostMapping("/momo/ipn")
    public ResponseEntity<Void> moMoIpn(@RequestBody Map<String, String> params) {
        boolean valid = moMoService.verifySignature(params);
        if (!valid) {
            return ResponseEntity.badRequest().build();
        }

        String transactionRef = params.get("orderId");
        Long orderId = Long.parseLong(transactionRef.split("_")[0]);
        String resultCode = params.get("resultCode");
        BigDecimal amount = new BigDecimal(params.get("amount"));
        String status = "0".equals(resultCode) ? "COMPLETED" : "FAILED";

        paymentService.processGatewayCallback(orderId, amount, "MOMO", transactionRef, status);

        return ResponseEntity.noContent().build();
    }

    private boolean processVNPayCallback(Map<String, String> params, String orderIdValue) {
        Optional<BigDecimal> amount = extractVnpAmount(params.get("vnp_Amount"));
        if (amount.isEmpty()) {
            log.warn("[VNPay] Callback rejected because amount is missing or invalid. txnRef={}", params.get("vnp_TxnRef"));
            return false;
        }

        Long orderId = Long.valueOf(orderIdValue);
        String transactionRef = params.get("vnp_TxnRef");
        String status = "00".equals(params.get("vnp_ResponseCode")) ? "COMPLETED" : "FAILED";
        try {
            paymentService.processGatewayCallback(orderId, amount.get(), "VNPAY", transactionRef, status);
            return true;
        } catch (IllegalArgumentException | IllegalStateException exception) {
            log.warn("[VNPay] Callback could not be applied. txnRef={} reason={}", transactionRef, exception.getMessage());
            return false;
        }
    }

    private Optional<BigDecimal> extractVnpAmount(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(new BigDecimal(value).divide(BigDecimal.valueOf(100)));
        } catch (NumberFormatException | ArithmeticException exception) {
            return Optional.empty();
        }
    }

    private ResponseEntity<Void> redirectToFrontendResult(
            String method, Optional<String> orderId, boolean succeeded) {
        String frontendUrl = frontendBaseUrl + "/payment/result?method=" + method
                + orderId.map(value -> "&orderId=" + value).orElse("")
                + "&status=" + (succeeded ? "success" : "failed");
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(frontendUrl)).build();
    }

    private Optional<String> extractOrderIdSegment(String transactionRef) {
        if (transactionRef == null || transactionRef.isBlank()) {
            return Optional.empty();
        }

        String orderId = transactionRef.split("_", 2)[0];
        if (!orderId.matches("[1-9]\\d*")) {
            return Optional.empty();
        }
        return Optional.of(orderId);
    }
}
