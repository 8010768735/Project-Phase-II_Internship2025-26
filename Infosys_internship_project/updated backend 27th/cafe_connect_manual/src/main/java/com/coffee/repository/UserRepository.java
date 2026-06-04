package com.coffee.repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.coffee.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByEmail(String email);
	
	 Optional<User> findByResetToken(String token);
	 
	 Optional<User> findByEmailAndOtp(String email, String otp);
	 

	 boolean existsByEmail(String email);
	 
	 List<User> findByStatus(String status);
	 
	long countByRole(String role);
	long countByActiveTrue();
	long countByActiveFalse();
	long countByPasswordResetFalse();

	long countByCreatedAtAfter(Date date);
}
