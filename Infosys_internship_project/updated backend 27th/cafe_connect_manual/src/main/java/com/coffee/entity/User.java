package com.coffee.entity;

import java.time.LocalDateTime;
import java.util.Date;
import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ================= BASIC DETAILS =================
    @Column(name = "firstname")
    private String firstName;

    @Column(name = "lastname")
    private String lastName;

    @Column(unique = true, nullable = false)
    private String email;

    private String password;

    private String phone;
    private String dateOfBirth;
    private String gender;
    private String highestQualification;
    private String institutionName;
    private Long yearOfPassing;
    private String additionalCertifications;
    private String specialization;

    @Column(name = "emplymnt_status")
    private String currentEmploymentStatus;

    private String skills;
    private String idProofType;
    private String idProofNumber;
    private String address;
    private String city;
    private String state;
    private Long pincode;
    private String country;

    // ================= SYSTEM FIELDS =================
    @Column(nullable = false)
    private String role;

    private String status;
    
    private String otp;

    @Column(name = "otp_expiry")
    private LocalDateTime otpExpiry;
    
    
//    @Column(nullable = false)
//    private boolean emailVerified;
//    
    @Column(name = "reset_token")
    private String resetToken;

//   

    @Column(name = "created_at", updatable = false, nullable = false)
    private Date createdAt = new Date();

//    @Column(name = "password_reset_required")
//    private boolean passwordResetRequired = true;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "password_reset")
    private boolean passwordReset = false;

    
    // ================= GETTERS & SETTERS =================
    
    
    public Long getId() { return id; }
    public String getDateOfBirth() {
		return dateOfBirth;
	}
	public void setDateOfBirth(String dateOfBirth) {
		this.dateOfBirth = dateOfBirth;
	}
	public String getHighestQualification() {
		return highestQualification;
	}
	public void setHighestQualification(String highestQualification) {
		this.highestQualification = highestQualification;
	}
	public String getInstitutionName() {
		return institutionName;
	}
	public void setInstitutionName(String institutionName) {
		this.institutionName = institutionName;
	}
	public Long getYearOfPassing() {
		return yearOfPassing;
	}
	public void setYearOfPassing(Long yearOfPassing) {
		this.yearOfPassing = yearOfPassing;
	}
	public String getAdditionalCertifications() {
		return additionalCertifications;
	}
	public void setAdditionalCertifications(String additionalCertifications) {
		this.additionalCertifications = additionalCertifications;
	}
	public String getCurrentEmploymentStatus() {
		return currentEmploymentStatus;
	}
	 
	public String getResetToken() {
		return resetToken;
	}
	public void setResetToken(String resetToken) {
		this.resetToken = resetToken;
	}
	public Date getCreatedAt() {
		return createdAt;
	}
	public void setCreatedAt(Date createdAt) {
		this.createdAt = createdAt;
	}
	public boolean isActive() {
		return isActive;
	}
	public void setActive(boolean isActive) {
		this.isActive = isActive;
	}
	public boolean isPasswordReset() {
		return passwordReset;
	}
	public void setPasswordReset(boolean passwordReset) {
		this.passwordReset = passwordReset;
	}
	public void setCurrentEmploymentStatus(String currentEmploymentStatus) {
		this.currentEmploymentStatus = currentEmploymentStatus;
	}
	public String getIdProofNumber() {
		return idProofNumber;
	}
	public void setIdProofNumber(String idProofNumber) {
		this.idProofNumber = idProofNumber;
	}
	public String getAddress() {
		return address;
	}
	public void setAddress(String address) {
		this.address = address;
	}
	public void setId(Long id) { this.id = id; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getDob() { return dateOfBirth; }
    public void setDob(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    

    
    public String getStatus() {
		return status;
	}
	public void setStatus(String status) {
		this.status = status;
	}
	public LocalDateTime getOtpExpiry() {
		return otpExpiry;
	}
	public void setOtpExpiry(LocalDateTime otpExpiry) {
		this.otpExpiry = otpExpiry;
	}
	public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }

    public String getIdProofType() { return idProofType; }
    public void setIdProofType(String idProofType) { this.idProofType = idProofType; }

    
    public String getFullAddress() { return address; }
    public void setFullAddress(String fullAddress) { this.address = fullAddress; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public Long getPincode() { return pincode; }
    public void setPincode(Long pincode) { this.pincode = pincode; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }

//    public boolean isEmailVerified() {
//        return emailVerified;
//    }
//
//    public void setEmailVerified(boolean emailVerified) {
//        this.emailVerified = emailVerified;
//    }

//
//    public String getResetToken() { return resetToken; }
//    public void setResetToken(String resetToken) { this.resetToken = resetToken; }
//
//    public LocalDateTime getResetTokenExpiry() { return resetTokenExpiry; }
//    public void setResetTokenExpiry(LocalDateTime resetTokenExpiry) { this.resetTokenExpiry = resetTokenExpiry; }
//
//    public Date getCreatedAt() { return createdAt; }
//    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
//
//    
//    public boolean isPasswordResetRequired() { return passwordResetRequired; }
//    public void setPasswordResetRequired(boolean passwordResetRequired) { this.passwordResetRequired = passwordResetRequired; }
//
//    public boolean isActive() { return isActive; }
//    public void setActive(boolean active) { isActive = active; }
//
//    public boolean isPasswordReset() { return passwordReset; }
//    public void setPasswordReset(boolean passwordReset) { this.passwordReset = passwordReset; }
}