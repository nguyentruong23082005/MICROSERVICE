package com.rainbowforest.userservice;

import com.rainbowforest.userservice.entity.User;
import com.rainbowforest.userservice.entity.UserRole;
import com.rainbowforest.userservice.repository.UserRepository;
import com.rainbowforest.userservice.repository.UserRoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
@EnableJpaRepositories
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }

    @Bean
    public CommandLineRunner initRoles(
            UserRoleRepository roleRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            UserRole userRole = roleRepository.findUserRoleByRoleName("ROLE_USER");
            if (userRole == null) {
                userRole = new UserRole();
                userRole.setRoleName("ROLE_USER");
                userRole = roleRepository.save(userRole);
            }
            UserRole adminRole = roleRepository.findUserRoleByRoleName("ROLE_ADMIN");
            if (adminRole == null) {
                adminRole = new UserRole();
                adminRole.setRoleName("ROLE_ADMIN");
                adminRole = roleRepository.save(adminRole);
            }
            User admin = userRepository.findByUserName("admin");
            if (admin == null) {
                admin = new User();
                admin.setUserName("admin");
            }
            admin.setUserPassword(passwordEncoder.encode("admin"));
            admin.setActive(1);
            admin.setRole(adminRole);
            userRepository.save(admin);
        };
    }
}
