package com.coffee.io;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class RegisterRequest {

    @NotBlank(message = "First name required")
    private String firstName;

    @NotBlank(message = "Last name required")
    private String lastName;

    @Email(message = "Invalid email")
    @NotBlank(message = "Email required")
    private String email;

//    @NotBlank(message = "Password required")
//    private String password;

    @NotBlank(message = "Role required")
    private String role;

    // Additional optional fields
    private String phone;
    private String dateOfBirth;
    private String gender;
    private String highestQualification;
    private String institutionName;
    private Long yearOfPassing;
    private String additionalCertifications;
    private String specialization;
    private String currentEmploymentStatus;
    private String skills;
    private String idProofType;
    private String idProofNumber;
    private String address;
    private String city;
    private String state;
    private Long pincode;
    private String country;

    // ============  Getters and setters ==================
    
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
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
	public String getSpecialization() {
		return specialization;
	}
	public void setSpecialization(String specialization) {
		this.specialization = specialization;
	}
	public String getCurrentEmploymentStatus() {
		return currentEmploymentStatus;
	}
	public void setCurrentEmploymentStatus(String currentEmploymentStatus) {
		this.currentEmploymentStatus = currentEmploymentStatus;
	}
	public String getSkills() {
		return skills;
	}
	public void setSkills(String skills) {
		this.skills = skills;
	}
	public String getIdProofType() {
		return idProofType;
	}
	public void setIdProofType(String idProofType) {
		this.idProofType = idProofType;
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
	public String getCity() {
		return city;
	}
	public void setCity(String city) {
		this.city = city;
	}
	public String getState() {
		return state;
	}
	public void setState(String state) {
		this.state = state;
	}
	public Long getPincode() {
		return pincode;
	}
	public void setPincode(Long pincode) {
		this.pincode = pincode;
	}
	public String getCountry() {
		return country;
	}
	public void setCountry(String country) {
		this.country = country;
	}
	public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
}
