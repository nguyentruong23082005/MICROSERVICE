package com.rainbowforest.userservice;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties =
        "security.jwt.secret=unit-test-only-secret-value-32-bytes")
public class UserServiceApplicationTests {

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    public void contextLoads() {
    }

    @Test
    void doesNotRegisterDataSeedRunners() {
        assertThat(applicationContext.getBeansOfType(CommandLineRunner.class)).isEmpty();
    }

}
