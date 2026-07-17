package com.rainbowforest.orderservice.service;

import com.rainbowforest.orderservice.dto.ShippingFeeRequest;
import com.rainbowforest.orderservice.dto.ShippingFeeResponse;
import com.rainbowforest.orderservice.dto.ShippingLocationResponse;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
public class GhnShippingServiceImpl implements GhnShippingService {

    private static final Logger log = LoggerFactory.getLogger(GhnShippingServiceImpl.class);
    private static final List<ShippingLocationResponse> FALLBACK_PROVINCES = List.of(
            new ShippingLocationResponse(202, null, "Hồ Chí Minh"),
            new ShippingLocationResponse(201, null, "Hà Nội"),
            new ShippingLocationResponse(203, null, "Đà Nẵng")
    );
    private static final Map<Integer, List<ShippingLocationResponse>> FALLBACK_DISTRICTS = Map.of(
            202, List.of(
                    new ShippingLocationResponse(1444, null, "Quận 1"),
                    new ShippingLocationResponse(1452, null, "Thành phố Thủ Đức")
            ),
            201, List.of(new ShippingLocationResponse(1482, null, "Quận Hoàn Kiếm")),
            203, List.of(new ShippingLocationResponse(1527, null, "Quận Hải Châu"))
    );
    private static final Map<Integer, List<ShippingLocationResponse>> FALLBACK_WARDS = Map.of(
            1444, List.of(new ShippingLocationResponse(null, "20308", "Phường Bến Nghé")),
            1452, List.of(new ShippingLocationResponse(null, "21012", "Phường Linh Trung")),
            1482, List.of(new ShippingLocationResponse(null, "11006", "Phường Hàng Trống")),
            1527, List.of(new ShippingLocationResponse(null, "40101", "Phường Hải Châu I"))
    );

    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final String token;
    private final int shopId;
    private final int serviceTypeId;
    private final int defaultWeight;
    private final int defaultLength;
    private final int defaultWidth;
    private final int defaultHeight;
    private final int defaultFromDistrictId;
    private final String originName;
    private final BigDecimal fallbackFee;

    public GhnShippingServiceImpl(RestTemplate restTemplate,
                                  @Value("${ghn.base-url:https://dev-online-gateway.ghn.vn/shiip/public-api}") String baseUrl,
                                  @Value("${ghn.token:}") String token,
                                  @Value("${ghn.shop-id:200939}") int shopId,
                                  @Value("${ghn.service-type-id:2}") int serviceTypeId,
                                  @Value("${ghn.default-weight:15000}") int defaultWeight,
                                  @Value("${ghn.default-length:120}") int defaultLength,
                                  @Value("${ghn.default-width:80}") int defaultWidth,
                                  @Value("${ghn.default-height:80}") int defaultHeight,
                                  @Value("${ghn.default-from-district-id:1444}") int defaultFromDistrictId,
                                  @Value("${shop.origin.name:Kho noi that Furniq trung tam}") String originName,
                                  @Value("${ghn.default-fallback-fee:120000}") BigDecimal fallbackFee) {
        this.restTemplate = restTemplate;
        this.baseUrl = trimTrailingSlash(baseUrl);
        this.token = token == null ? "" : token.trim();
        this.shopId = shopId;
        this.serviceTypeId = serviceTypeId;
        this.defaultWeight = positiveOrDefault(defaultWeight, 15000);
        this.defaultLength = positiveOrDefault(defaultLength, 120);
        this.defaultWidth = positiveOrDefault(defaultWidth, 80);
        this.defaultHeight = positiveOrDefault(defaultHeight, 80);
        this.defaultFromDistrictId = positiveOrDefault(defaultFromDistrictId, 1444);
        this.originName = originName == null || originName.isBlank() ? "Kho noi that Furniq trung tam" : originName.trim();
        this.fallbackFee = fallbackFee;
    }

    @Override
    public ShippingFeeResponse calculateFee(ShippingFeeRequest request) {
        if (token.isBlank()) {
            log.warn("GHN token is not configured. Returning fallback shipping fee.");
            return fallback();
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("service_type_id", serviceTypeId);
        payload.put("from_district_id", defaultFromDistrictId);
        payload.put("to_district_id", request.getToDistrictId());
        payload.put("to_ward_code", request.getToWardCode().trim());
        payload.put("weight", valueOrDefault(request.getTotalWeightGram(), defaultWeight));
        payload.put("length", valueOrDefault(request.getLengthCm(), defaultLength));
        payload.put("width", valueOrDefault(request.getWidthCm(), defaultWidth));
        payload.put("height", valueOrDefault(request.getHeightCm(), defaultHeight));

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                    baseUrl + "/v2/shipping-order/fee",
                    new HttpEntity<>(payload, ghnHeaders(true)),
                    Map.class);
            BigDecimal total = extractTotal(response);
            if (total.signum() >= 0) {
                return new ShippingFeeResponse(total, null, originName, false);
            }
        } catch (RestClientException ex) {
            log.warn("Unable to calculate GHN shipping fee. Returning fallback fee.", ex);
        } catch (IllegalArgumentException ex) {
            log.warn("GHN shipping fee response is invalid. Returning fallback fee.", ex);
        }

        return fallback();
    }

    @Override
    public List<ShippingLocationResponse> getProvinces() {
        return getLocationList("/master-data/province", "ProvinceID", "ProvinceName", null, FALLBACK_PROVINCES);
    }

    @Override
    public List<ShippingLocationResponse> getDistricts(int provinceId) {
        return getLocationList(
                "/master-data/district?province_id=" + provinceId,
                "DistrictID",
                "DistrictName",
                null,
                FALLBACK_DISTRICTS.getOrDefault(provinceId, List.of()));
    }

    @Override
    public List<ShippingLocationResponse> getWards(int districtId) {
        return getLocationList(
                "/master-data/ward?district_id=" + districtId,
                null,
                "WardName",
                "WardCode",
                FALLBACK_WARDS.getOrDefault(districtId, List.of()));
    }

    private List<ShippingLocationResponse> getLocationList(
            String path,
            String idKey,
            String nameKey,
            String codeKey,
            List<ShippingLocationResponse> fallbackLocations) {
        if (token.isBlank()) {
            log.warn("GHN token is not configured. Returning fallback location list for {}.", path);
            return fallbackLocations;
        }
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.exchange(
                    baseUrl + path,
                    org.springframework.http.HttpMethod.GET,
                    new HttpEntity<>(ghnHeaders(false)),
                    Map.class).getBody();
            return extractItems(response).stream()
                    .map(item -> new ShippingLocationResponse(
                            idKey == null ? null : toInteger(item.get(idKey)),
                            codeKey == null ? null : String.valueOf(item.get(codeKey)),
                            String.valueOf(item.get(nameKey))))
                    .filter(item -> item.getName() != null && !"null".equals(item.getName()))
                    .toList();
        } catch (RestClientException | IllegalArgumentException ex) {
            log.warn("Unable to load GHN location list: {}. Returning fallback location list.", path, ex);
            return fallbackLocations;
        }
    }

    private HttpHeaders ghnHeaders(boolean includeShopId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Token", token);
        if (includeShopId) {
            headers.set("ShopId", String.valueOf(shopId));
        }
        return headers;
    }

    private ShippingFeeResponse fallback() {
        return new ShippingFeeResponse(fallbackFee, null, originName, true);
    }

    private BigDecimal extractTotal(Map<String, Object> response) {
        if (response == null || !(response.get("data") instanceof Map<?, ?> data)) {
            throw new IllegalArgumentException("Missing GHN data payload");
        }
        Object total = data.get("total");
        if (total instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        if (total instanceof String text && !text.isBlank()) {
            return new BigDecimal(text);
        }
        throw new IllegalArgumentException("Missing GHN total fee");
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractItems(Map<String, Object> response) {
        if (response == null || !(response.get("data") instanceof List<?> data)) {
            throw new IllegalArgumentException("Missing GHN location payload");
        }
        return data.stream()
                .filter(Map.class::isInstance)
                .map(item -> (Map<String, Object>) item)
                .toList();
    }

    private Integer toInteger(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value instanceof String text && !text.isBlank()) {
            return Integer.parseInt(text);
        }
        return null;
    }

    private int valueOrDefault(Integer value, int fallback) {
        return value == null || value <= 0 ? fallback : value;
    }

    private int positiveOrDefault(int value, int fallback) {
        return value <= 0 ? fallback : value;
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "https://dev-online-gateway.ghn.vn/shiip/public-api";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}