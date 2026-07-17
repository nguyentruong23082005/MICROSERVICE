package com.rainbowforest.apigateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties =
        "security.jwt.secret=unit-test-only-secret-value-32-bytes")
class ApiGatewayApplicationTests {

    @Test
    void contextLoads() {
    }

}
