package com.coffee.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.coffee.entity.PasswordResetOtp;

public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {

	Optional<PasswordResetOtp> findByUserIdAndOtp(Long userId, String otp);
    void deleteByUserId(Long userId);
    Optional<PasswordResetOtp> findByEmail(String email);

    void deleteByEmail(String email);
    Optional<PasswordResetOtp> findTopByUserIdOrderByExpiryTimeDesc(Long userId);

}
