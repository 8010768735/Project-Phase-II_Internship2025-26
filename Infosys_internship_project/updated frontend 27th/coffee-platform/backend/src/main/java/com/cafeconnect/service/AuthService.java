package com.cafeconnect.service;

import com.cafeconnect.dto.AuthResponse;
import com.cafeconnect.dto.ForgotPasswordRequest;
import com.cafeconnect.dto.LoginRequest;
import com.cafeconnect.dto.RegisterRequest;
import com.cafeconnect.dto.ResetPasswordRequest;
import com.cafeconnect.entity.User;
import com.cafeconnect.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final Map<String, String> passwordResetOtps = new ConcurrentHashMap<>();
    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail().toLowerCase().trim());
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(User.Role.valueOf(request.getRole().toUpperCase().replace("-", "_")));
        user.setDateOfBirth(request.getDateOfBirth());
        user.setGender(request.getGender());
        user.setCafeId(request.getCafeId());
        user.setCafeName(request.getCafeName());
        user.setCafeAddress(request.getCafeAddress());
        user.setAddress(request.getAddress());
        user.setCity(request.getCity());
        user.setState(request.getState());
        user.setPincode(request.getPincode());
        if (request.getCountry() != null) {
            user.setCountry(request.getCountry());
        }

        user = userRepository.save(user);

        String token = jwtService.generateToken(user.getEmail());
        return new AuthResponse(token, user.getId(), user.getEmail(),
                user.getFirstName(), user.getLastName(), user.getRole().name());
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String rawPassword = request.getPassword();
        String storedPassword = user.getPassword();
        boolean passwordMatches = passwordEncoder.matches(rawPassword, storedPassword);

        // Support legacy plain-text rows and upgrade them on successful login.
        if (!passwordMatches && rawPassword.equals(storedPassword)) {
            user.setPassword(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
            passwordMatches = true;
        }

        if (!passwordMatches) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtService.generateToken(normalizedEmail);
        return new AuthResponse(token, user.getId(), user.getEmail(),
                user.getFirstName(), user.getLastName(), user.getRole().name());
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String otp = String.format("%06d", new Random().nextInt(1_000_000));
        passwordResetOtps.put(normalizedEmail, otp);

        System.out.println("Password reset OTP for " + user.getEmail() + ": " + otp);
    }

    public void resetPassword(ResetPasswordRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String expectedOtp = passwordResetOtps.get(normalizedEmail);
        if (expectedOtp == null || !expectedOtp.equals(request.getOtp())) {
            throw new RuntimeException("Invalid OTP or expired");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        passwordResetOtps.remove(normalizedEmail);
    }
}
