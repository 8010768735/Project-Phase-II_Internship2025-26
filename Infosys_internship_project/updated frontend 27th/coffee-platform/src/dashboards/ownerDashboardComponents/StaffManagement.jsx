import React, { useEffect, useState } from "react";
import { FaEdit, FaIdCard, FaTrash } from "react-icons/fa";
import "./StaffManagement.css";

const createEmptyStaff = () => ({
  role: "",
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  gender: "",
  address: "",
  qualifications: "",
  aadharCardImage: "",
  aadharCardFileName: "",
});

const staffLettersOnlyPattern = /^[A-Za-z\s]+$/;
const staffQualificationPattern = /^[A-Za-z0-9\s]+$/;
const staffPhonePattern = /^\d{10}$/;

const StaffManagement = ({ cafeId, onSuccess, focusedRole = "" }) => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [showRolePopup, setShowRolePopup] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [newStaff, setNewStaff] = useState(createEmptyStaff());
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const hasValidCafeId = Boolean(cafeId);

  const fetchStaff = async () => {
    if (!hasValidCafeId) {
      setStaffMembers([]);
      return;
    }

    try {
      const res = await fetch(`http://localhost:8081/api/staff/cafe/${cafeId}`);
      const data = await res.json();
      setStaffMembers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!hasValidCafeId) {
      setShowRolePopup(false);
      setShowStaffForm(false);
      setEditingStaff(null);
      setFormError("Select a cafe before managing staff.");
      return;
    }

    setFormError("");
    fetchStaff();
  }, [cafeId, hasValidCafeId]);

  const resetStaffForm = () => {
    setNewStaff(createEmptyStaff());
    setEditingStaff(null);
    setFormError("");
    setShowStaffForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;

    if (name === "name") {
      nextValue = value.replace(/[^A-Za-z\s]/g, "");
    }

    if (name === "qualifications") {
      nextValue = value.replace(/[^A-Za-z0-9\s]/g, "");
    }

    if (name === "phone") {
      nextValue = value.replace(/\D/g, "").slice(0, 10);
    }

    setNewStaff((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
    if (formError) {
      setFormError("");
    }
  };

  const handleAadharChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please upload a valid Aadhar card image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNewStaff((prev) => ({
        ...prev,
        aadharCardImage: reader.result,
        aadharCardFileName: file.name,
      }));
      setFormError("");
    };
    reader.onerror = () => {
      setFormError("Unable to read the selected image. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const validateStaffForm = () => {
    if (!newStaff.name.trim()) return "Staff name is required.";
    if (!staffLettersOnlyPattern.test(newStaff.name.trim())) return "Full name should contain only letters.";
    if (!newStaff.email.trim()) return "Email is required.";
    if (!/\S+@\S+\.\S+/.test(newStaff.email.trim())) return "Enter a valid email address.";
    if (!newStaff.phone.trim()) return "Phone number is required.";
    if (!staffPhonePattern.test(newStaff.phone.trim())) return "Phone number must be exactly 10 digits.";
    if (!newStaff.gender.trim()) return "Please select gender.";
    if (!newStaff.address.trim()) return "Address is required.";
    if (!newStaff.qualifications.trim()) return "Qualification is required.";
    if (!staffQualificationPattern.test(newStaff.qualifications.trim())) return "Qualification should contain only letters and numbers.";
    if (!newStaff.aadharCardImage) return "Please upload the Aadhar card image.";

    if (!editingStaff && !newStaff.password) {
      return "Password is required while adding staff.";
    }

    if (newStaff.password || newStaff.confirmPassword) {
      if (newStaff.password.length < 4) {
        return "Password must be at least 4 characters.";
      }
      if (newStaff.password !== newStaff.confirmPassword) {
        return "Password and confirm password must match.";
      }
    }

    return "";
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();

    if (!hasValidCafeId && !editingStaff) {
      setFormError("Select a cafe before saving staff details.");
      return;
    }

    const validationMessage = validateStaffForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setIsSaving(true);

    try {
      const method = editingStaff ? "PUT" : "POST";
      const url = editingStaff
        ? `http://localhost:8081/api/staff/${editingStaff.id}`
        : `http://localhost:8081/api/staff/cafe/${cafeId}`;

      const staffToSend = {
        role: newStaff.role,
        name: newStaff.name.trim(),
        email: newStaff.email.trim().toLowerCase(),
        phone: newStaff.phone.trim(),
        password: newStaff.password || "",
        gender: newStaff.gender.trim(),
        address: newStaff.address.trim(),
        qualifications: newStaff.qualifications.trim(),
        aadharCardImage: newStaff.aadharCardImage,
        aadharCardFileName: newStaff.aadharCardFileName,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffToSend),
      });

      if (!response.ok) {
        let errorMessage = "Failed to save staff details.";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.message || errorData?.error || errorMessage;
        } catch {
          // Keep fallback message if the response body is not JSON.
        }
        throw new Error(errorMessage);
      }

      await fetchStaff();
      onSuccess?.(editingStaff ? "Staff details updated successfully." : "Staff member added successfully.");
      resetStaffForm();
    } catch (error) {
      console.error(error);
      setFormError(error.message || "Failed to save staff details. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this staff member?"
    );

    if (!confirmDelete) return;

    await fetch(`http://localhost:8081/api/staff/${id}`, {
      method: "DELETE",
    });

    fetchStaff();
    onSuccess?.("Staff member deleted successfully.");
  };

  const handleEditStaff = (staff) => {
    setEditingStaff(staff);
    setNewStaff({
      role: staff.role || "",
      name: staff.name || "",
      email: staff.email || "",
      phone: staff.phone || "",
      password: "",
      confirmPassword: "",
      gender: staff.gender || "",
      address: staff.address || "",
      qualifications: staff.qualifications || "",
      aadharCardImage: staff.aadharCardImage || "",
      aadharCardFileName: staff.aadharCardFileName || "",
    });
    setFormError("");
    setShowStaffForm(true);
  };

  const handleRoleSelect = (role) => {
    setNewStaff((prev) => ({
      ...createEmptyStaff(),
      role,
      email: prev.email,
    }));
    setFormError("");
    setShowRolePopup(false);
    setShowStaffForm(true);
  };

  const chefs = staffMembers.filter((s) => s.role === "Chef");
  const waiters = staffMembers.filter((s) => s.role === "Waiter");
  const eventStaff = staffMembers.filter((s) => s.role === "Event Staff");

  return (
    <div className="staff-management-section">
      <div className="staff-header">
        <div>
          <h3>Staff Management</h3>
          <p className="staff-subtitle">
            {focusedRole
              ? "Add event decoration staff with secure credentials and Aadhar verification."
              : "Add chefs, waiters, and event staff with secure credentials and Aadhar verification."}
          </p>
        </div>

        <button
          className="staff-add-btn"
          onClick={() => {
            if (!hasValidCafeId) {
              setFormError("Select a cafe before adding staff.");
              return;
            }
            if (focusedRole) {
              handleRoleSelect(focusedRole);
            } else {
              setShowRolePopup(true);
            }
            setFormError("");
          }}
          type="button"
          disabled={!hasValidCafeId}
        >
          {focusedRole ? `Add ${focusedRole}` : "Add Staff"}
        </button>
      </div>

      {!hasValidCafeId && (
        <div className="staff-empty-state">Select a cafe to view or add staff members.</div>
      )}

      <div className="staff-columns">
        {!focusedRole && (
        <div className="staff-column">
          <h4>Chefs</h4>

          {chefs.length === 0 && (
            <div className="staff-empty-state">No chefs added yet.</div>
          )}

          {chefs.map((staff) => (
            <div key={staff.id} className="staff-card">
              <div className="staff-info">
                <span className="staff-name">{staff.name}</span>
                <span className="staff-phone">Phone: {staff.phone}</span>
                <span className="staff-email">Email: {staff.email}</span>
                <span className="staff-cafe">Cafe: {staff.cafe?.cafeName}</span>
                <span className="staff-proof">
                  <FaIdCard />
                  {staff.aadharCardImage ? "Aadhar uploaded" : "Aadhar pending"}
                </span>
              </div>

              <div className="staff-right">
                <span className="staff-status staff-active">Active</span>

                <div className="staff-actions">
                  <button type="button" className="icon-btn" onClick={() => handleEditStaff(staff)}>
                    <FaEdit />
                  </button>
                  <button type="button" className="icon-btn danger" onClick={() => handleDeleteStaff(staff.id)}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {!focusedRole && (
        <div className="staff-column">
          <h4>Waiters</h4>

          {waiters.length === 0 && (
            <div className="staff-empty-state">No waiters added yet.</div>
          )}

          {waiters.map((staff) => (
            <div key={staff.id} className="staff-card">
              <div className="staff-info">
                <span className="staff-name">{staff.name}</span>
                <span className="staff-phone">Phone: {staff.phone}</span>
                <span className="staff-email">Email: {staff.email}</span>
                <span className="staff-cafe">Cafe: {staff.cafe?.cafeName}</span>
                <span className="staff-proof">
                  <FaIdCard />
                  {staff.aadharCardImage ? "Aadhar uploaded" : "Aadhar pending"}
                </span>
              </div>

              <div className="staff-right">
                <span className="staff-status staff-active">Active</span>

                <div className="staff-actions">
                  <button type="button" className="icon-btn" onClick={() => handleEditStaff(staff)}>
                    <FaEdit />
                  </button>
                  <button type="button" className="icon-btn danger" onClick={() => handleDeleteStaff(staff.id)}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        <div className="staff-column">
          <h4>Event Staff</h4>

          {eventStaff.length === 0 && (
            <div className="staff-empty-state">No event staff added yet.</div>
          )}

          {eventStaff.map((staff) => (
            <div key={staff.id} className="staff-card">
              <div className="staff-info">
                <span className="staff-name">{staff.name}</span>
                <span className="staff-phone">Phone: {staff.phone}</span>
                <span className="staff-email">Email: {staff.email}</span>
                <span className="staff-cafe">Cafe: {staff.cafe?.cafeName}</span>
                <span className="staff-proof">
                  <FaIdCard />
                  {staff.aadharCardImage ? "Aadhar uploaded" : "Aadhar pending"}
                </span>
              </div>

              <div className="staff-right">
                <span className="staff-status staff-active">Active</span>

                <div className="staff-actions">
                  <button type="button" className="icon-btn" onClick={() => handleEditStaff(staff)}>
                    <FaEdit />
                  </button>
                  <button type="button" className="icon-btn danger" onClick={() => handleDeleteStaff(staff.id)}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showRolePopup && (
        <div className="modal-overlay">
          <div className="modal role-modal">
            <h3 className="role-title">Select Staff Role</h3>
            <p className="role-subtitle">Choose the staff type before filling the registration form.</p>

            <div className="role-buttons">
              <button
                className="role-btn chef-btn"
                onClick={() => handleRoleSelect("Chef")}
                type="button"
              >
                Chef
              </button>

              <button
                className="role-btn waiter-btn"
                onClick={() => handleRoleSelect("Waiter")}
                type="button"
              >
                Waiter
              </button>

              <button
                className="role-btn event-staff-btn"
                onClick={() => handleRoleSelect("Event Staff")}
                type="button"
              >
                Event Staff
              </button>
            </div>

            <div className="role-cancel">
              <button
                className="secondary-btn"
                onClick={() => setShowRolePopup(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showStaffForm && (
        <div className="modal-overlay">
          <div className="modal staff-form-modal">
            <div className="modal-heading">
              <h3>{editingStaff ? "Edit Staff Details" : `Add ${newStaff.role}`}</h3>
              <p>
                Capture staff identity, secure login credentials, and Aadhar proof in one place.
              </p>
            </div>

            <form onSubmit={handleSaveStaff} className="staff-form-grid">
              {formError && <div className="staff-form-error">{formError}</div>}

              <div className="form-field">
                <label htmlFor="staff-role">Role</label>
                <input id="staff-role" value={newStaff.role} disabled />
              </div>

              <div className="form-field">
                <label htmlFor="staff-name">Full Name</label>
                <input
                  id="staff-name"
                  name="name"
                  placeholder="Enter full name"
                  value={newStaff.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="staff-email">Email</label>
                <input
                  id="staff-email"
                  name="email"
                  type="email"
                  placeholder="Enter email"
                  value={newStaff.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="staff-phone">Phone</label>
                <input
                  id="staff-phone"
                  name="phone"
                  placeholder="Enter phone number"
                  value={newStaff.phone}
                  onChange={handleInputChange}
                  inputMode="numeric"
                  maxLength="10"
                />
              </div>

              <div className="form-field">
                <label htmlFor="staff-gender">Gender</label>
                <select
                  id="staff-gender"
                  name="gender"
                  value={newStaff.gender}
                  onChange={handleInputChange}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="staff-qualification">Qualification</label>
                <input
                  id="staff-qualification"
                  name="qualifications"
                  placeholder="Enter qualification"
                  value={newStaff.qualifications}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-field full-width">
                <label htmlFor="staff-address">Address</label>
                <textarea
                  id="staff-address"
                  name="address"
                  placeholder="Enter full address"
                  value={newStaff.address}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="form-field">
                <label htmlFor="staff-password">
                  Password {editingStaff ? "(optional for update)" : ""}
                </label>
                <input
                  id="staff-password"
                  name="password"
                  type="password"
                  placeholder={editingStaff ? "Leave blank to keep current password" : "Set password"}
                  value={newStaff.password}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="staff-confirm-password">Confirm Password</label>
                <input
                  id="staff-confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={newStaff.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-field full-width">
                <label htmlFor="staff-aadhar">Aadhar Card Image</label>
                <input
                  id="staff-aadhar"
                  type="file"
                  accept="image/*"
                  onChange={handleAadharChange}
                />
                <div className="file-help-text">
                  {newStaff.aadharCardFileName
                    ? `Selected file: ${newStaff.aadharCardFileName}`
                    : "Upload an image from local storage. It will be stored in encoded format."}
                </div>
              </div>

              <div className="modal-actions full-width">
                <button type="button" className="secondary-btn" onClick={resetStaffForm}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={isSaving}>
                  {isSaving ? "Saving..." : editingStaff ? "Update Staff" : "Register Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;

