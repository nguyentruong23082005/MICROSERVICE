package com.rainbowforest.paymentservice.controller;

import com.rainbowforest.paymentservice.service.MoMoService;
import com.rainbowforest.paymentservice.service.PaymentService;
import com.rainbowforest.paymentservice.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.net.URI;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.http.HttpStatus.FOUND;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentControllerTest {

    @Mock private PaymentService paymentService;
    @Mock private VNPayService vnPayService;
    @Mock private MoMoService moMoService;
    @Mock private HttpServletRequest httpRequest;

    private PaymentController controller;

    @BeforeEach
    void setUp() {
        controller = new PaymentController(
                paymentService, vnPayService, moMoService, "http://localhost:5173");
    }

    @Test
    void createVNPayPayment_usesPersistedAmountAndAssociatesTransaction() {
        PaymentService.GatewayPaymentIntent intent =
                new PaymentService.GatewayPaymentIntent(10L, new BigDecimal("275000"));
        VNPayService.PaymentRequestResult gatewayResult =
                new VNPayService.PaymentRequestResult("10_secure-ref", "https://sandbox.vnpay/pay");
        when(paymentService.getPendingGatewayIntent(10L)).thenReturn(intent);
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        when(vnPayService.createPayment(10L, intent.amount(), "Thanh toán đơn hàng 10", "127.0.0.1"))
                .thenReturn(gatewayResult);

        ResponseEntity<Map<String, String>> response = controller.createVNPayPayment(10L, httpRequest);

        assertEquals("https://sandbox.vnpay/pay", response.getBody().get("payUrl"));
        verify(paymentService).prepareGatewayPayment(10L, "VNPAY", "10_secure-ref");
    }

    @Test
    void createMoMoPayment_usesPersistedAmountAndAssociatesTransaction() {
        PaymentService.GatewayPaymentIntent intent =
                new PaymentService.GatewayPaymentIntent(20L, new BigDecimal("350000"));
        MoMoService.PaymentRequestResult gatewayResult =
                new MoMoService.PaymentRequestResult("20_secure-ref", "https://test-payment.momo.vn/pay");
        when(paymentService.getPendingGatewayIntent(20L)).thenReturn(intent);
        when(moMoService.createPayment(20L, intent.amount(), "Thanh toán đơn hàng 20"))
                .thenReturn(gatewayResult);

        ResponseEntity<Map<String, String>> response = controller.createMoMoPayment(20L);

        assertEquals("https://test-payment.momo.vn/pay", response.getBody().get("payUrl"));
        verify(paymentService).prepareGatewayPayment(20L, "MOMO", "20_secure-ref");
    }

    @Test
    void moMoIpn_correlatesUsingMoMoOrderIdInsteadOfRequestId() {
        Map<String, String> params = Map.ofEntries(
                Map.entry("partnerCode", "MOMO_PARTNER"),
                Map.entry("orderId", "20_secure-ref"),
                Map.entry("requestId", "unrelated-request-id"),
                Map.entry("amount", "350000"),
                Map.entry("orderInfo", "Thanh toán đơn hàng 20"),
                Map.entry("orderType", "momo_wallet"),
                Map.entry("transId", "123456"),
                Map.entry("resultCode", "0"),
                Map.entry("message", "Successful."),
                Map.entry("payType", "qr"),
                Map.entry("responseTime", "1700000000000"),
                Map.entry("extraData", ""),
                Map.entry("signature", "valid-signature"));
        when(moMoService.verifySignature(params)).thenReturn(true);

        controller.moMoIpn(params);

        verify(paymentService).processGatewayCallback(
                20L, new BigDecimal("350000"), "MOMO", "20_secure-ref", "COMPLETED");
    }

    @Test
    void vnPayReturn_redirectsToConfiguredFrontendResultPage() {
        Map<String, String> params = Map.of(
                "vnp_TxnRef", "10_secure-ref",
                "vnp_ResponseCode", "00");
        when(vnPayService.verifySignature(params)).thenReturn(true);

        ResponseEntity<Void> response = controller.vnPayReturn(params);

        assertEquals(FOUND, response.getStatusCode());
        assertEquals(URI.create("http://localhost:5173/payment/result?method=vnpay&orderId=10&status=success"),
                response.getHeaders().getLocation());
    }

    @Test
    void vnPayReturn_updatesPaymentWhenIpnCannotReachLocalhost() {
        Map<String, String> params = Map.of(
                "vnp_TxnRef", "10_secure-ref",
                "vnp_ResponseCode", "00",
                "vnp_Amount", "27500000");
        when(vnPayService.verifySignature(params)).thenReturn(true);

        ResponseEntity<Void> response = controller.vnPayReturn(params);

        assertEquals(FOUND, response.getStatusCode());
        assertEquals(URI.create("http://localhost:5173/payment/result?method=vnpay&orderId=10&status=success"),
                response.getHeaders().getLocation());
        verify(paymentService).processGatewayCallback(
                10L, new BigDecimal("275000"), "VNPAY", "10_secure-ref", "COMPLETED");
    }

    @Test
    void moMoReturn_redirectsToConfiguredFrontendResultPage() {
        Map<String, String> params = Map.of(
                "orderId", "20_secure-ref",
                "resultCode", "1006");
        when(moMoService.verifySignature(params)).thenReturn(true);

        ResponseEntity<Void> response = controller.moMoReturn(params);

        assertEquals(FOUND, response.getStatusCode());
        assertEquals(URI.create("http://localhost:5173/payment/result?method=momo&orderId=20&status=failed"),
                response.getHeaders().getLocation());
    }

    @Test
    void vnPayReturn_missingTransactionReference_redirectsToSafeFailurePage() {
        Map<String, String> params = Map.of("vnp_ResponseCode", "00");
        when(vnPayService.verifySignature(params)).thenReturn(false);

        ResponseEntity<Void> response = controller.vnPayReturn(params);

        assertEquals(FOUND, response.getStatusCode());
        assertEquals(URI.create("http://localhost:5173/payment/result?method=vnpay&status=failed"),
                response.getHeaders().getLocation());
    }

    @Test
    void moMoReturn_missingTransactionReference_redirectsToSafeFailurePage() {
        Map<String, String> params = Map.of("resultCode", "0");
        when(moMoService.verifySignature(params)).thenReturn(false);

        ResponseEntity<Void> response = controller.moMoReturn(params);

        assertEquals(FOUND, response.getStatusCode());
        assertEquals(URI.create("http://localhost:5173/payment/result?method=momo&status=failed"),
                response.getHeaders().getLocation());
    }
}