package com.coffee.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String phone;
    private String email;

    private String bookingDate;
    private String bookingTime;
    private String createdAt;

    private int people;
    private Long customerId;
    private Long tableId;
    private String tableNumber;
    private String cafeName;
    private String occasion;
    private Boolean celebrationEvent;
    private String celebrationType;
    private String customCelebrationType;
    private String decorationTheme;
    private String cakeMessage;
    private Boolean surpriseSetup;
    private String seatingPreference;

    @Column(length = 2000)
    private String notes;

    private String status;
    private Double advancePaymentAmount;
    private String advancePaymentMethod;
    private String advancePaymentStatus;
    private Double refundAmount;
    private String refundStatus;
    private String cancellationReason;
    private String cancelledAt;

    private Long cafeId;

    
 // ============getters & setters =============
    
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getPhone() {
		return phone;
	}

	public void setPhone(String phone) {
		this.phone = phone;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getBookingDate() {
		return bookingDate;
	}

	public void setBookingDate(String bookingDate) {
		this.bookingDate = bookingDate;
	}

	public String getBookingTime() {
		return bookingTime;
	}

	public void setBookingTime(String bookingTime) {
		this.bookingTime = bookingTime;
	}

	public String getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(String createdAt) {
		this.createdAt = createdAt;
	}

	public int getPeople() {
		return people;
	}

	public void setPeople(int people) {
		this.people = people;
	}

	public Long getCustomerId() {
		return customerId;
	}

	public void setCustomerId(Long customerId) {
		this.customerId = customerId;
	}

	public Long getTableId() {
		return tableId;
	}

	public void setTableId(Long tableId) {
		this.tableId = tableId;
	}

	public String getTableNumber() {
		return tableNumber;
	}

	public void setTableNumber(String tableNumber) {
		this.tableNumber = tableNumber;
	}

	public String getCafeName() {
		return cafeName;
	}

	public void setCafeName(String cafeName) {
		this.cafeName = cafeName;
	}

	public String getOccasion() {
		return occasion;
	}

	public void setOccasion(String occasion) {
		this.occasion = occasion;
	}

	public Boolean getCelebrationEvent() {
		return celebrationEvent;
	}

	public void setCelebrationEvent(Boolean celebrationEvent) {
		this.celebrationEvent = celebrationEvent;
	}

	public String getCelebrationType() {
		return celebrationType;
	}

	public void setCelebrationType(String celebrationType) {
		this.celebrationType = celebrationType;
	}

	public String getCustomCelebrationType() {
		return customCelebrationType;
	}

	public void setCustomCelebrationType(String customCelebrationType) {
		this.customCelebrationType = customCelebrationType;
	}

	public String getDecorationTheme() {
		return decorationTheme;
	}

	public void setDecorationTheme(String decorationTheme) {
		this.decorationTheme = decorationTheme;
	}

	public String getCakeMessage() {
		return cakeMessage;
	}

	public void setCakeMessage(String cakeMessage) {
		this.cakeMessage = cakeMessage;
	}

	public Boolean getSurpriseSetup() {
		return surpriseSetup;
	}

	public void setSurpriseSetup(Boolean surpriseSetup) {
		this.surpriseSetup = surpriseSetup;
	}

	public String getSeatingPreference() {
		return seatingPreference;
	}

	public void setSeatingPreference(String seatingPreference) {
		this.seatingPreference = seatingPreference;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public Double getAdvancePaymentAmount() {
		return advancePaymentAmount;
	}

	public void setAdvancePaymentAmount(Double advancePaymentAmount) {
		this.advancePaymentAmount = advancePaymentAmount;
	}

	public String getAdvancePaymentMethod() {
		return advancePaymentMethod;
	}

	public void setAdvancePaymentMethod(String advancePaymentMethod) {
		this.advancePaymentMethod = advancePaymentMethod;
	}

	public String getAdvancePaymentStatus() {
		return advancePaymentStatus;
	}

	public void setAdvancePaymentStatus(String advancePaymentStatus) {
		this.advancePaymentStatus = advancePaymentStatus;
	}

	public Double getRefundAmount() {
		return refundAmount;
	}

	public void setRefundAmount(Double refundAmount) {
		this.refundAmount = refundAmount;
	}

	public String getRefundStatus() {
		return refundStatus;
	}

	public void setRefundStatus(String refundStatus) {
		this.refundStatus = refundStatus;
	}

	public String getCancellationReason() {
		return cancellationReason;
	}

	public void setCancellationReason(String cancellationReason) {
		this.cancellationReason = cancellationReason;
	}

	public String getCancelledAt() {
		return cancelledAt;
	}

	public void setCancelledAt(String cancelledAt) {
		this.cancelledAt = cancelledAt;
	}

	public Long getCafeId() {
		return cafeId;
	}

	public void setCafeId(Long cafeId) {
		this.cafeId = cafeId;
	}
    

}
