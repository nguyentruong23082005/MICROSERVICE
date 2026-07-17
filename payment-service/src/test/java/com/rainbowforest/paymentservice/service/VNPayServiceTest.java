package com.rainbowforest.paymentservice.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class VNPayServiceTest {

    private VNPayService vnPayService;

    @BeforeEach
    void setUp() {
        vnPayService = new VNPayService(() -> "secure-ref");
        ReflectionTestUtils.setField(vnPayService, "tmnCode", "TEST_TMN_CODE");
        ReflectionTestUtils.setField(vnPayService, "hashSecret", "THIS_IS_A_SECRET_KEY_FOR_TESTING_PURPOSES");
        ReflectionTestUtils.setField(vnPayService, "payUrl", "http://sandbox.vnpay/test");
        ReflectionTestUtils.setField(vnPayService, "returnUrl", "http://localhost/return");
    }

    @Test
    void createPayment_returnsTransactionReferenceAndSignedUrl() {
        VNPayService.PaymentRequestResult result = vnPayService.createPayment(
                1001L, new BigDecimal("50000"), "Order 1001", "127.0.0.1");

        assertEquals("1001_secure-ref", result.transactionRef());
        assertTrue(result.payUrl().startsWith("http://sandbox.vnpay/test?"));
        assertTrue(result.payUrl().contains("vnp_SecureHash="));
        assertTrue(result.payUrl().contains("vnp_Amount=5000000"));
        assertTrue(result.payUrl().contains("vnp_TxnRef=1001_secure-ref"));
    }

    @Test
    void verifySignature_validSignature_returnsTrue() {
        // Assume we generate a valid signature logic exactly like the service does
        Map<String, String> params = new HashMap<>();
        params.put("vnp_Amount", "5000000");
        params.put("vnp_BankCode", "NCB");
        params.put("vnp_TxnRef", "1001_12345");
        
        // We know the private method buildHashData and hmacSHA512.
        // We can just use the service to generate the URL, parse it, and feed it back to verify
        String generatedUrl = vnPayService.createPaymentUrl(1001L, new BigDecimal("50000"), "Test", "127.0.0.1");
        
        Map<String, String> callbackParams = parseQueryString(generatedUrl);
        
        // Ensure signature is there
        assertTrue(callbackParams.containsKey("vnp_SecureHash"));
        
        // Verify should pass
        assertTrue(vnPayService.verifySignature(callbackParams), "Signature should be valid");
    }

    @Test
    void verifySignature_tamperedAmount_returnsFalse() {
        String generatedUrl = vnPayService.createPaymentUrl(1001L, new BigDecimal("50000"), "Test", "127.0.0.1");
        Map<String, String> callbackParams = parseQueryString(generatedUrl);
        
        // Tamper with amount (e.g. attacker changing amount before hitting returnUrl)
        callbackParams.put("vnp_Amount", "100");
        
        assertFalse(vnPayService.verifySignature(callbackParams), "Tampered payload should fail signature verification");
    }

    @Test
    void verifySignature_missingSignature_returnsFalse() {
        String generatedUrl = vnPayService.createPaymentUrl(1001L, new BigDecimal("50000"), "Test", "127.0.0.1");
        Map<String, String> callbackParams = parseQueryString(generatedUrl);
        
        callbackParams.remove("vnp_SecureHash");
        
        assertFalse(vnPayService.verifySignature(callbackParams), "Missing signature should fail verification");
    }

    private Map<String, String> parseQueryString(String url) {
        String query = url.substring(url.indexOf('?') + 1);
        String[] pairs = query.split("&");
        Map<String, String> params = new HashMap<>();
        try {
            for (String pair : pairs) {
                String[] kv = pair.split("=");
                if (kv.length == 2) {
                    params.put(java.net.URLDecoder.decode(kv[0], "UTF-8"), java.net.URLDecoder.decode(kv[1], "UTF-8"));
                } else {
                    params.put(java.net.URLDecoder.decode(kv[0], "UTF-8"), "");
                }
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return params;
    }
}
