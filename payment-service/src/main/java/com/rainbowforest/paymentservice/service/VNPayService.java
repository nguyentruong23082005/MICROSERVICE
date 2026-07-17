package com.rainbowforest.paymentservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.function.Supplier;

/**
 * VNPay Sandbox integration service.
 *
 * Responsibilities:
 *  1. Build redirect URL to VNPay payment page (createPaymentUrl)
 *  2. Verify HMAC-SHA512 signature on return/IPN callbacks (verifySignature)
 *
 * Security notes:
 *  - SECRET KEY read from env (VNPAY_HASH_SECRET) — NEVER hardcoded
 *  - Signature verified in service layer BEFORE updating payment status
 *  - Amount multiplied by 100 as per VNPay spec (no decimal)
 *
 * Sandbox credentials:
 *  - Set VNPAY_TMN_CODE and VNPAY_HASH_SECRET in .env or Docker secrets
 *  - Sandbox URL: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
 */
@Service
public class VNPayService {

    private static final Logger log = LoggerFactory.getLogger(VNPayService.class);

    private static final String VNPAY_VERSION  = "2.1.0";
    private static final String VNPAY_COMMAND  = "pay";
    private static final String VNPAY_CURRENCY = "VND";
    private static final String VNPAY_LOCALE   = "vn";
    private static final String VNPAY_ORDER_TYPE = "other";

    private final Supplier<String> transactionRefSupplier;

    public VNPayService() {
        this(() -> UUID.randomUUID().toString());
    }

    VNPayService(Supplier<String> transactionRefSupplier) {
        this.transactionRefSupplier = transactionRefSupplier;
    }

    @Value("${vnpay.tmnCode:#{null}}")
    private String tmnCode;

    @Value("${vnpay.hashSecret:#{null}}")
    private String hashSecret;

    @Value("${vnpay.payUrl:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String payUrl;

    @Value("${vnpay.returnUrl:http://localhost:3000/payment/vnpay-return}")
    private String returnUrl;

    /**
     * Build VNPay sandbox redirect URL for a payment.
     *
     * @param orderId   internal order ID used as txnRef
     * @param amount    order total in VND (whole number, NOT x100 — we multiply here)
     * @param orderInfo short description shown on VNPay page
     * @param clientIp  remote IP of the buyer (required by VNPay)
     * @return full redirect URL including vnp_SecureHash
     */
    public PaymentRequestResult createPayment(
            Long orderId,
            BigDecimal amount,
            String orderInfo,
            String clientIp) {
        if (tmnCode == null || tmnCode.isBlank() || hashSecret == null || hashSecret.isBlank()) {
            throw new IllegalStateException("[VNPay] Gateway credentials are not configured");
        }
        if (orderId == null || amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("[VNPay] A valid order and positive amount are required");
        }

        String txnRef = orderId + "_" + transactionRefSupplier.get();
        String createDate = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());
        long amountVnp;
        try {
            amountVnp = amount.multiply(BigDecimal.valueOf(100)).longValueExact();
        } catch (ArithmeticException exception) {
            throw new IllegalArgumentException("[VNPay] Amount has unsupported precision", exception);
        }

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", VNPAY_VERSION);
        params.put("vnp_Command", VNPAY_COMMAND);
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_Amount", String.valueOf(amountVnp));
        params.put("vnp_CurrCode", VNPAY_CURRENCY);
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", orderInfo);
        params.put("vnp_OrderType", VNPAY_ORDER_TYPE);
        params.put("vnp_Locale", VNPAY_LOCALE);
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_IpAddr", clientIp);
        params.put("vnp_CreateDate", createDate);

        String hashData = buildHashData(params);
        String secureHash = hmacSHA512(hashSecret, hashData);
        String url = payUrl + "?" + buildQueryString(params) + "&vnp_SecureHash=" + secureHash;

        log.info("[VNPay] Creating payment: hashData='{}' secureHash='{}' url='{}'", hashData, secureHash, url);
        log.info("[VNPay] Created payment URL for orderId={} txnRef={}", orderId, txnRef);
        return new PaymentRequestResult(txnRef, url);
    }

    /**
     * Compatibility wrapper for existing callers that only need the redirect URL.
     */
    public String createPaymentUrl(Long orderId, BigDecimal amount, String orderInfo, String clientIp) {
        return createPayment(orderId, amount, orderInfo, clientIp).payUrl();
    }

    public record PaymentRequestResult(String transactionRef, String payUrl) {}

    /**
     * Verify VNPay callback signature.
     *
     * IMPORTANT: Extract vnp_SecureHash BEFORE building the hash to compare.
     * The hash is computed over ALL params EXCEPT vnp_SecureHash itself.
     *
     * @param params all query params from the VNPay return/IPN request
     * @return true if signature is valid
     */
    public boolean verifySignature(Map<String, String> params) {
        String receivedHash = params.get("vnp_SecureHash");
        if (receivedHash == null || receivedHash.isBlank()) {
            log.warn("[VNPay] Missing vnp_SecureHash in callback");
            return false;
        }

        // Build hash from params excluding signature fields
        Map<String, String> filtered = new TreeMap<>(params);
        filtered.remove("vnp_SecureHash");
        filtered.remove("vnp_SecureHashType");

        String hashData = buildHashData(filtered);
        String expectedHash = hmacSHA512(hashSecret, hashData);
        boolean valid = expectedHash.equalsIgnoreCase(receivedHash);

        if (!valid) {
            log.warn("[VNPay] Signature mismatch — possible tampering! txnRef={}", params.get("vnp_TxnRef"));
        }
        return valid;
    }

    /**
     * Extract the internal order ID from the txnRef (format: orderId_timestamp).
     */
    public Long extractOrderId(String txnRef) {
        if (txnRef == null) return null;
        try {
            return Long.parseLong(txnRef.split("_")[0]);
        } catch (NumberFormatException e) {
            log.error("[VNPay] Cannot parse orderId from txnRef={}", txnRef);
            return null;
        }
    }

    // ─── Private helpers ─────────────────────────────────────────────────────


    private String buildHashData(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        params.forEach((k, v) -> {
            if (v != null && !v.isBlank()) {
                if (sb.length() > 0) sb.append('&');
                sb.append(URLEncoder.encode(k, StandardCharsets.UTF_8))
                  .append('=')
                  .append(URLEncoder.encode(v, StandardCharsets.UTF_8).replace("+", "%20"));
            }
        });
        return sb.toString();
    }

    private String buildQueryString(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        params.forEach((k, v) -> {
            if (v != null && !v.isBlank()) {
                if (sb.length() > 0) sb.append('&');
                sb.append(URLEncoder.encode(k, StandardCharsets.UTF_8))
                  .append('=')
                  .append(URLEncoder.encode(v, StandardCharsets.UTF_8).replace("+", "%20"));
            }
        });
        return sb.toString();
    }

    private String hmacSHA512(String secret, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : bytes) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("[VNPay] Failed to compute HMAC-SHA512", e);
        }
    }
}
