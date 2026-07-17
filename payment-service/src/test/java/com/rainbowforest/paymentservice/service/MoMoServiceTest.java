package com.rainbowforest.paymentservice.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class MoMoServiceTest {

    private MoMoService moMoService;
    private MockRestServiceServer mockServer;

    @BeforeEach
    void setUp() {
        RestClient.Builder restClientBuilder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(restClientBuilder).build();
        moMoService = new MoMoService(restClientBuilder, () -> "ref", () -> "request-ref");
        ReflectionTestUtils.setField(moMoService, "partnerCode", "MOMO_PARTNER");
        ReflectionTestUtils.setField(moMoService, "accessKey", "MOMO_ACCESS_KEY");
        ReflectionTestUtils.setField(moMoService, "secretKey", "MOMO_SECRET_KEY");
        ReflectionTestUtils.setField(moMoService, "returnUrl", "http://localhost/return");
        ReflectionTestUtils.setField(moMoService, "notifyUrl", "http://localhost/notify");
        ReflectionTestUtils.setField(moMoService, "createUrl", "https://test-payment.momo.vn/v2/gateway/api/create");
    }

    @Test
    void createPayment_postsSignedRequestToSandboxAndReturnsPayUrl() {
        mockServer.expect(requestTo("https://test-payment.momo.vn/v2/gateway/api/create"))
                .andExpect(method(org.springframework.http.HttpMethod.POST))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("\"partnerCode\":\"MOMO_PARTNER\"")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("\"amount\":50000")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("\"signature\":")))
                .andRespond(withSuccess(
                        "{\"partnerCode\":\"MOMO_PARTNER\",\"orderId\":\"2001_ref\",\"requestId\":\"request-ref\",\"resultCode\":0,\"message\":\"Successful.\",\"payUrl\":\"https://test-payment.momo.vn/pay\"}",
                        MediaType.APPLICATION_JSON));

        MoMoService.PaymentRequestResult result =
                moMoService.createPayment(2001L, new BigDecimal("50000"), "Order 2001");

        assertEquals("https://test-payment.momo.vn/pay", result.payUrl());
        assertTrue(result.transactionRef().startsWith("2001_"));
        mockServer.verify();
    }

    @Test
    void verifySignature_validSignature_returnsTrue() {
        // MoMo's signature for IPN requires a specific set of fields in alphabetical order:
        // accessKey, amount, extraData, message, orderId, orderInfo, orderType, partnerCode, payType, requestId, responseTime, resultCode, transId
        Map<String, String> ipnParams = new HashMap<>();
        ipnParams.put("amount", "50000");
        ipnParams.put("extraData", "");
        ipnParams.put("message", "Success");
        ipnParams.put("orderId", "2001");
        ipnParams.put("orderInfo", "Test Order");
        ipnParams.put("orderType", "momo_wallet");
        ipnParams.put("partnerCode", "MOMO_PARTNER");
        ipnParams.put("payType", "qr");
        ipnParams.put("requestId", "2001_123");
        ipnParams.put("responseTime", "1620000000");
        ipnParams.put("resultCode", "0");
        ipnParams.put("transId", "99999");
        
        // Calculate what the signature should be for the above fields based on the secretKey
        String rawSignature = "accessKey=MOMO_ACCESS_KEY"
                + "&amount=50000"
                + "&extraData="
                + "&message=Success"
                + "&orderId=2001"
                + "&orderInfo=Test Order"
                + "&orderType=momo_wallet"
                + "&partnerCode=MOMO_PARTNER"
                + "&payType=qr"
                + "&requestId=2001_123"
                + "&responseTime=1620000000"
                + "&resultCode=0"
                + "&transId=99999";
                
        String validSignature = ReflectionTestUtils.invokeMethod(moMoService, "hmacSHA256", "MOMO_SECRET_KEY", rawSignature);
        ipnParams.put("signature", validSignature);

        assertTrue(moMoService.verifySignature(ipnParams), "Signature should be valid");
    }

    @Test
    void verifySignature_tamperedAmount_returnsFalse() {
        Map<String, String> ipnParams = new HashMap<>();
        ipnParams.put("amount", "50000");
        ipnParams.put("orderId", "2001");
        
        String rawSignature = "accessKey=MOMO_ACCESS_KEY&amount=50000&extraData=&message=&orderId=2001&orderInfo=&orderType=&partnerCode=&payType=&requestId=&responseTime=&resultCode=&transId=";
        String validSignature = ReflectionTestUtils.invokeMethod(moMoService, "hmacSHA256", "MOMO_SECRET_KEY", rawSignature);
        ipnParams.put("signature", validSignature);

        // Tamper with the amount after signature is generated
        ipnParams.put("amount", "100");

        assertFalse(moMoService.verifySignature(ipnParams), "Tampered amount should fail verification");
    }
}
