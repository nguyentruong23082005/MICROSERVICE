package com.rainbowforest.paymentservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;

/**
 * MoMo Sandbox integration service.
 *
 * Responsibilities:
 *  1. Create payment request data (to send to MoMo or simulate)
 *  2. Verify HMAC-SHA256 signature on return/IPN callbacks
 *
 * Security notes:
 *  - SECRET KEY and ACCESS KEY read from env — NEVER hardcoded.
 *  - Signature verified before updating payment status.
 */
@Service
public class MoMoService {

    private static final Logger log = LoggerFactory.getLogger(MoMoService.class);

    private final RestClient restClient;
    private final Supplier<String> transactionRefSupplier;
    private final Supplier<String> requestIdSupplier;

    @Value("${momo.partnerCode:#{null}}")
    private String partnerCode;

    @Value("${momo.accessKey:#{null}}")
    private String accessKey;

    @Value("${momo.secretKey:#{null}}")
    private String secretKey;

    @Value("${momo.createUrl:https://test-payment.momo.vn/v2/gateway/api/create}")
    private String createUrl;

    @Value("${momo.returnUrl:http://localhost:3000/payment/result?method=momo}")
    private String returnUrl;

    @Value("${momo.notifyUrl:http://localhost:8900/api/payments/momo/ipn}")
    private String notifyUrl;

    @org.springframework.beans.factory.annotation.Autowired
    public MoMoService(RestClient.Builder restClientBuilder) {
        this(
                restClientBuilder,
                () -> UUID.randomUUID().toString(),
                () -> UUID.randomUUID().toString());
    }

    MoMoService(
            RestClient.Builder restClientBuilder,
            Supplier<String> transactionRefSupplier,
            Supplier<String> requestIdSupplier) {
        this.restClient = restClientBuilder.build();
        this.transactionRefSupplier = transactionRefSupplier;
        this.requestIdSupplier = requestIdSupplier;
    }

    /**
     * Creates a signed payment request through the real MoMo Sandbox API.
     */
    public PaymentRequestResult createPayment(Long orderId, BigDecimal amount, String orderInfo) {
        validateConfiguration();
        if (orderId == null || amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("[MoMo] A valid order and positive amount are required");
        }

        String transactionRef = orderId + "_" + transactionRefSupplier.get();
        String requestId = requestIdSupplier.get();
        long integralAmount;
        try {
            integralAmount = amount.longValueExact();
        } catch (ArithmeticException exception) {
            throw new IllegalArgumentException("[MoMo] Amount must be an integer VND value", exception);
        }

        String rawSignature = "accessKey=" + accessKey
                + "&amount=" + integralAmount
                + "&extraData="
                + "&ipnUrl=" + notifyUrl
                + "&orderId=" + transactionRef
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + partnerCode
                + "&redirectUrl=" + returnUrl
                + "&requestId=" + requestId
                + "&requestType=captureWallet";

        CreatePaymentRequest request = new CreatePaymentRequest(
                partnerCode,
                requestId,
                integralAmount,
                transactionRef,
                orderInfo,
                returnUrl,
                notifyUrl,
                "captureWallet",
                "",
                "vi",
                hmacSHA256(secretKey, rawSignature));

        CreatePaymentResponse response;
        try {
            response = restClient.post()
                    .uri(createUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(CreatePaymentResponse.class);
        } catch (RestClientException exception) {
            throw new IllegalStateException("[MoMo] Sandbox create-payment request failed", exception);
        }

        validateCreateResponse(response, transactionRef, requestId);
        log.info("[MoMo] Created Sandbox payment for orderId={} transactionRef={}", orderId, transactionRef);
        return new PaymentRequestResult(transactionRef, response.payUrl());
    }

    private void validateConfiguration() {
        if (partnerCode == null || partnerCode.isBlank()
                || accessKey == null || accessKey.isBlank()
                || secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("[MoMo] Gateway credentials are not configured");
        }
    }

    private void validateCreateResponse(CreatePaymentResponse response, String transactionRef, String requestId) {
        boolean valid = response != null
                && response.resultCode() == 0
                && partnerCode.equals(response.partnerCode())
                && transactionRef.equals(response.orderId())
                && requestId.equals(response.requestId())
                && response.payUrl() != null
                && !response.payUrl().isBlank();
        if (!valid) {
            throw new IllegalStateException("[MoMo] Invalid or unsuccessful create-payment response");
        }
    }

    public record PaymentRequestResult(String transactionRef, String payUrl) {}

    private record CreatePaymentRequest(
            String partnerCode,
            String requestId,
            long amount,
            String orderId,
            String orderInfo,
            String redirectUrl,
            String ipnUrl,
            String requestType,
            String extraData,
            String lang,
            String signature) {}

    private record CreatePaymentResponse(
            String partnerCode,
            String orderId,
            String requestId,
            int resultCode,
            String message,
            String payUrl) {}

    /**
     * Verify MoMo callback signature.
     *
     * @param params all params from MoMo callback
     * @return true if signature matches
     */
    public boolean verifySignature(Map<String, String> params) {
        String receivedSignature = params.get("signature");
        if (receivedSignature == null || receivedSignature.isBlank()) {
            log.warn("[MoMo] Missing signature in callback");
            return false;
        }

        // Build raw signature string according to MoMo specs
        String rawSignature = "accessKey=" + accessKey
                + "&amount=" + params.getOrDefault("amount", "")
                + "&extraData=" + params.getOrDefault("extraData", "")
                + "&message=" + params.getOrDefault("message", "")
                + "&orderId=" + params.getOrDefault("orderId", "")
                + "&orderInfo=" + params.getOrDefault("orderInfo", "")
                + "&orderType=" + params.getOrDefault("orderType", "")
                + "&partnerCode=" + params.getOrDefault("partnerCode", "")
                + "&payType=" + params.getOrDefault("payType", "")
                + "&requestId=" + params.getOrDefault("requestId", "")
                + "&responseTime=" + params.getOrDefault("responseTime", "")
                + "&resultCode=" + params.getOrDefault("resultCode", "")
                + "&transId=" + params.getOrDefault("transId", "");

        String expectedSignature = hmacSHA256(secretKey, rawSignature);
        boolean valid = expectedSignature.equalsIgnoreCase(receivedSignature);

        if (!valid) {
            log.warn("[MoMo] Signature mismatch — possible tampering! orderId={}", params.get("orderId"));
        }
        return valid;
    }

    private String hmacSHA256(String secret, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : bytes) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("[MoMo] Failed to compute HMAC-SHA256", e);
        }
    }
}
