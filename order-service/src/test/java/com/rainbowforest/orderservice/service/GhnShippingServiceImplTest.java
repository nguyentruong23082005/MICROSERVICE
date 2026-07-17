package com.rainbowforest.orderservice.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.rainbowforest.orderservice.dto.ShippingFeeRequest;
import com.rainbowforest.orderservice.dto.ShippingFeeResponse;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

class GhnShippingServiceImplTest {

    @Test
    void calculateFee_shouldSendBulkyParcelDefaultsToGhn() {
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
        GhnShippingServiceImpl service = service(restTemplate, "token", new BigDecimal("120000"));
        ShippingFeeRequest request = new ShippingFeeRequest();
        request.setToDistrictId(1452);
        request.setToWardCode("21012");

        server.expect(requestTo("https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee"))
                .andExpect(header("Token", "token"))
                .andExpect(header("ShopId", "200939"))
                .andExpect(content().json("""
                        {
                          "service_type_id": 2,
                          "from_district_id": 1444,
                          "to_district_id": 1452,
                          "to_ward_code": "21012",
                          "weight": 15000,
                          "length": 120,
                          "width": 80,
                          "height": 80
                        }
                        """))
                .andRespond(withSuccess("""
                        { "data": { "total": 185000 } }
                        """, MediaType.APPLICATION_JSON));

        ShippingFeeResponse response = service.calculateFee(request);

        assertThat(response.getFee()).isEqualByComparingTo("185000");
        assertThat(response.getNearestStoreName()).isEqualTo("Kho noi that Furniq trung tam");
        assertThat(response.isEstimated()).isFalse();
        server.verify();
    }

    @Test
    void calculateFee_shouldReturnBulkyFallbackWhenTokenIsMissing() {
        GhnShippingServiceImpl service = service(new RestTemplate(), "", new BigDecimal("120000"));
        ShippingFeeRequest request = new ShippingFeeRequest();
        request.setToDistrictId(1452);
        request.setToWardCode("21012");

        ShippingFeeResponse response = service.calculateFee(request);

        assertThat(response.getFee()).isEqualByComparingTo("120000");
        assertThat(response.getNearestStoreName()).isEqualTo("Kho noi that Furniq trung tam");
        assertThat(response.isEstimated()).isTrue();
    }

    @Test
    void getProvinces_shouldReturnFallbackLocationsWhenTokenIsMissing() {
        GhnShippingServiceImpl service = service(new RestTemplate(), "", new BigDecimal("120000"));

        assertThat(service.getProvinces())
                .extracting("id", "name")
                .contains(
                        org.assertj.core.groups.Tuple.tuple(202, "Hồ Chí Minh"),
                        org.assertj.core.groups.Tuple.tuple(201, "Hà Nội"));
    }

    private GhnShippingServiceImpl service(RestTemplate restTemplate, String token, BigDecimal fallbackFee) {
        return new GhnShippingServiceImpl(
                restTemplate,
                "https://dev-online-gateway.ghn.vn/shiip/public-api",
                token,
                200939,
                2,
                15000,
                120,
                80,
                80,
                1444,
                "Kho noi that Furniq trung tam",
                fallbackFee);
    }
}
