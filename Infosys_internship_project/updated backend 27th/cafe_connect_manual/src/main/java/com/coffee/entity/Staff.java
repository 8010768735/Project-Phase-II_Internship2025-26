package com.coffee.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;

@Entity 
public class Staff {

	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private Long id;
	private String name;
	private String role;
	private String email;
	@JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
	private String password;
	private String phone;
	private String address;
	private String gender;
	private String qualifications;
	@Lob
	@Column(columnDefinition = "LONGTEXT")
	private String aadharCardImage;
	private String aadharCardFileName;
	
//	private Long cafeId;
	
	
	@ManyToOne
	@JoinColumn(name = "cafe_id")
	@JsonIgnoreProperties({"menuItems"})
	private CafeDetails cafe;

//	 =========== constructor ============
	public Staff() {}
	
	
//	============getters and setters==================
	
	
	
	public Long getId() {
		return id;
	}
	public String getPassword() {
		return password;
	}


	public void setPassword(String password) {
		this.password = password;
	}


	public String getQualifications() {
		return qualifications;
	}



	public void setQualifications(String qualifications) {
		this.qualifications = qualifications;
	}

	public String getAadharCardImage() {
		return aadharCardImage;
	}

	public void setAadharCardImage(String aadharCardImage) {
		this.aadharCardImage = aadharCardImage;
	}

	public String getAadharCardFileName() {
		return aadharCardFileName;
	}

	public void setAadharCardFileName(String aadharCardFileName) {
		this.aadharCardFileName = aadharCardFileName;
	}


	public void setId(Long id) {
		this.id = id;
	}
	public CafeDetails getCafe() {
		return cafe;
	}


	public void setCafe(CafeDetails cafe) {
		this.cafe = cafe;
	}


	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getRole() {
		return role;
	}
	public void setRole(String role) {
		this.role = role;
	}
	public String getEmail() {
		return email;
	}
	public void setEmail(String email) {
		this.email = email;
	}
	public String getPhone() {
		return phone;
	}
	public void setPhone(String phone) {
		this.phone = phone;
	}
	public String getAddress() {
		return address;
	}
	public void setAddress(String address) {
		this.address = address;
	}
	public String getGender() {
		return gender;
	}
	public void setGender(String gender) {
		this.gender = gender;
	}
	public String getQualification() {
		return qualifications;
	}
	public void setQualification(String qualification) {
		this.qualifications = qualification;
	}
	
}
