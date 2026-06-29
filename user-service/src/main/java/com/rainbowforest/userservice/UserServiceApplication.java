package com.rainbowforest.userservice;

import com.rainbowforest.userservice.entity.UserRole;
import com.rainbowforest.userservice.repository.UserRoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaRepositories
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }

    @Bean
    public CommandLineRunner initRoles(UserRoleRepository roleRepository) {
        return args -> {
            if (roleRepository.findUserRoleByRoleName("ROLE_USER") == null) {
                UserRole userRole = new UserRole();
                userRole.setRoleName("ROLE_USER");
                roleRepository.save(userRole);
            }
            if (roleRepository.findUserRoleByRoleName("ROLE_ADMIN") == null) {
                UserRole adminRole = new UserRole();
                adminRole.setRoleName("ROLE_ADMIN");
                roleRepository.save(adminRole);
            }
        };
    }
}
