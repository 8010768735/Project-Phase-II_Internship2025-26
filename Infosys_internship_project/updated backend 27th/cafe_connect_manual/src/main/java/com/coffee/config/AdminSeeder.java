package com.coffee.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.coffee.entity.User;
import com.coffee.repository.UserRepository;

import java.util.Optional;

@Configuration
public class AdminSeeder {

    @Bean
    CommandLineRunner createAdmin(UserRepository userRepository) {
        return args -> {

            Optional<User> existingAdmin = userRepository.findByEmail("cafeconnectadmin@gmail.com");

            if (existingAdmin.isEmpty()) {

                BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

                User admin = new User();

                admin.setFirstName("Admin");
                admin.setLastName("User");
                admin.setEmail("cafeconnectadmin@gmail.com");

                // REAL PASSWORD
                admin.setPassword(encoder.encode("admin123"));

                admin.setRole("ADMIN");
                admin.setStatus("APPROVED");
                admin.setActive(true);
                admin.setPasswordReset(true);

                userRepository.save(admin);

                System.out.println("ADMIN CREATED SUCCESSFULLY");
                System.out.println("Admin Email: cafeconnectadmin@gmail.com");
                System.out.println("Admin Password: admin123");

            } else {
                System.out.println("ADMIN ALREADY EXISTS");
            }
        };
    }
}
