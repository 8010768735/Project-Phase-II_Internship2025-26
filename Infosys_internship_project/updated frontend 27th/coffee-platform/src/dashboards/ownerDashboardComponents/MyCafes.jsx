import React, { useEffect, useMemo, useState } from "react";
import "./MyCafes.css";
import { clearCurrentCafeId, getCurrentCafeId, getCurrentUser } from "../../utils/session";

const initialFormData = {
  cafeName: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  seatingCapacity: "",
  openingTime: "",
  closingTime: "",
  workingDays: "",
  gstNumber: "",
  fssaiLicense: "",
  image: null,
  imageUrl: "",
};

const lettersOnlyPattern = /^[A-Za-z\s]+$/;
const workingDaysPattern = /^[A-Za-z\s-]+$/;
const pincodePattern = /^\d{6}$/;

const MyCafes = ({ onSuccess }) => {
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterPopup, setShowRegisterPopup] = useState(false);
  const [editingCafe, setEditingCafe] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const user = useMemo(() => {
    return getCurrentUser();
  }, []);

  const ownerId = user?.id;

  const fetchCafes = async () => {
    if (!ownerId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:8081/api/cafe/owner/${ownerId}`);
      if (!response.ok) throw new Error("Failed to fetch cafes");

      const data = await response.json();
      setCafes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching cafes", error);
      setCafes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCafes();
  }, [ownerId]);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingCafe(null);
    setShowRegisterPopup(false);
  };

  const openCreateModal = () => {
    setEditingCafe(null);
    setFormData(initialFormData);
    setShowRegisterPopup(true);
  };

  const openEditModal = (cafe) => {
    setEditingCafe(cafe);
    setFormData({
      cafeName: cafe.cafeName || "",
      address: cafe.address || "",
      city: cafe.city || "",
      state: cafe.state || "",
      pincode: cafe.pincode || "",
      seatingCapacity: cafe.seatingCapacity || "",
      openingTime: cafe.openingTime || "",
      closingTime: cafe.closingTime || "",
      workingDays: cafe.workingDays || "",
      gstNumber: cafe.gstNumber || "",
      fssaiLicense: cafe.fssaiLicense || "",
      image: null,
      imageUrl: cafe.imageUrl || "",
    });
    setShowRegisterPopup(true);
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });

  const handleChange = async (e) => {
    const { name, value, files } = e.target;

    if (files) {
      const nextFile = files[0] || null;
      if (!nextFile) {
        setFormData((prev) => ({
          ...prev,
          [name]: null,
        }));
        return;
      }

      try {
        const imageUrl = await fileToDataUrl(nextFile);
        setFormData((prev) => ({
          ...prev,
          [name]: nextFile,
          imageUrl,
        }));
      } catch (error) {
        console.error("Error reading cafe image", error);
        alert("Unable to read the selected image.");
      }
      return;
    }

    let nextValue = value;

    if (name === "cafeName" || name === "city" || name === "state") {
      nextValue = value.replace(/[^A-Za-z\s]/g, "");
    }

    if (name === "workingDays") {
      nextValue = value.replace(/[^A-Za-z\s-]/g, "");
    }

    if (name === "pincode") {
      nextValue = value.replace(/\D/g, "").slice(0, 6);
    }

    if (name === "gstNumber") {
      nextValue = value.replace(/[^A-Za-z0-9]/g, "");
    }

    if (name === "fssaiLicense") {
      nextValue = value.replace(/\D/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const buildCafePayload = () => ({
    cafeName: formData.cafeName,
    address: formData.address,
    city: formData.city,
    state: formData.state,
    pincode: formData.pincode,
    seatingCapacity: Number(formData.seatingCapacity),
    openingTime: formData.openingTime,
    closingTime: formData.closingTime,
    workingDays: formData.workingDays,
    gstNumber: formData.gstNumber,
    fssaiLicense: formData.fssaiLicense,
    ownerId,
    imageUrl: formData.imageUrl || editingCafe?.imageUrl || "",
  });

  const getCafeImageSrc = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith("data:") || imageUrl.startsWith("http")) {
      return imageUrl;
    }
    return `http://localhost:8081${imageUrl}`;
  };

  const handleSubmitCafe = async (e) => {
    e.preventDefault();

    if (!ownerId) {
      alert("Owner information not found.");
      return;
    }

    if (!lettersOnlyPattern.test(formData.cafeName.trim())) {
      alert("Cafe name should contain only letters.");
      return;
    }

    if (!lettersOnlyPattern.test(formData.city.trim())) {
      alert("City should contain only letters.");
      return;
    }

    if (!lettersOnlyPattern.test(formData.state.trim())) {
      alert("State should contain only letters.");
      return;
    }

    if (!workingDaysPattern.test(formData.workingDays.trim())) {
      alert("Working days should contain only letters.");
      return;
    }

    if (!pincodePattern.test(formData.pincode.trim())) {
      alert("Pincode must be exactly 6 digits.");
      return;
    }

    if (!/^[A-Za-z0-9]+$/.test(formData.gstNumber.trim())) {
      alert("GST number should contain only letters and numbers.");
      return;
    }

    if (!/^\d+$/.test(formData.fssaiLicense.trim())) {
      alert("FSSAI licence should contain only numbers.");
      return;
    }

    const endpoint = editingCafe
      ? `http://localhost:8081/api/cafe/${editingCafe.id}`
      : "http://localhost:8081/api/cafe/register";

    const method = editingCafe ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildCafePayload()),
      });

      if (!response.ok) {
        let errorMessage = editingCafe ? "Failed to update cafe" : "Failed to register cafe";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.message || errorData?.error || errorMessage;
        } catch {
          // Keep the default message if the error body is not JSON.
        }
        throw new Error(errorMessage);
      }

      const savedCafe = await response.json();

      setCafes((prev) => {
        if (editingCafe) {
          return prev.map((cafe) => (cafe.id === savedCafe.id ? savedCafe : cafe));
        }
        return [savedCafe, ...prev];
      });

      window.dispatchEvent(new Event("cafeChanged"));
      onSuccess?.(editingCafe ? "Cafe updated successfully." : "Cafe registered successfully.");
      resetForm();
    } catch (error) {
      console.error("Error saving cafe", error);
      alert(error.message || (editingCafe ? "Error updating cafe" : "Error registering cafe"));
    }
  };

  const handleDeleteCafe = async (cafeId) => {
    if (!ownerId) return;
    const confirmed = window.confirm("Delete this cafe?");
    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:8081/api/cafe/${cafeId}?ownerId=${ownerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete cafe");
      }

      const selectedCafeId = getCurrentCafeId();
      if (selectedCafeId && Number(selectedCafeId) === cafeId) {
        clearCurrentCafeId();
      }

      setCafes((prev) => prev.filter((cafe) => cafe.id !== cafeId));
      window.dispatchEvent(new Event("cafeChanged"));
      onSuccess?.("Cafe deleted successfully.");
    } catch (error) {
      console.error("Error deleting cafe", error);
      alert("Error deleting cafe");
    }
  };

  return (
    <div className="mycafes-container">
      <div className="page-header">
        <div>
          <h2>My Cafes</h2>
          <p className="page-subtitle">Register, update, and manage only the cafes linked to your owner account.</p>
        </div>
        <button className="primary-btn" onClick={openCreateModal}>
          Register Cafe
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : cafes.length === 0 ? (
        <p>No cafes found for this owner.</p>
      ) : (
        <div className="cafes-grid">
          {cafes.map((cafe) => (
            <div className="cafe-card" key={cafe.id}>
              <div className="cafe-image-wrap">
                {cafe.imageUrl ? (
                  <img
                    className="cafe-image"
                    src={getCafeImageSrc(cafe.imageUrl)}
                    alt={cafe.cafeName}
                  />
                ) : (
                  <div className="cafe-image placeholder">No Image</div>
                )}
              </div>

              <div className="cafe-card-body">
                <h3>{cafe.cafeName || "No name provided"}</h3>
                <p>{cafe.address}</p>
                <p>{cafe.city}, {cafe.state} - {cafe.pincode}</p>

                <div className="cafe-meta">
                  <span>{cafe.seatingCapacity} seats</span>
                  <span>{cafe.openingTime} - {cafe.closingTime}</span>
                </div>

                <div className="cafe-extra">
                  <div><strong>Working Days:</strong> {cafe.workingDays || "Not set"}</div>
                  <div><strong>GST:</strong> {cafe.gstNumber || "Not set"}</div>
                  <div><strong>FSSAI:</strong> {cafe.fssaiLicense || "Not set"}</div>
                </div>

                <div className="card-actions">
                  <button className="secondary-btn" onClick={() => openEditModal(cafe)}>
                    Update
                  </button>
                  <button className="danger-btn" onClick={() => handleDeleteCafe(cafe.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showRegisterPopup && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingCafe ? "Update Cafe" : "Register Cafe"}</h3>
            <form onSubmit={handleSubmitCafe}>
              <input
                type="text"
                name="cafeName"
                placeholder="Cafe Name"
                value={formData.cafeName}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
                required
              />
              <div className="form-grid">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-grid">
                <input
                  type="text"
                  name="pincode"
                  placeholder="Pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  inputMode="numeric"
                  maxLength="6"
                  required
                />
                <input
                  type="number"
                  name="seatingCapacity"
                  placeholder="Seating Capacity"
                  value={formData.seatingCapacity}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-grid">
                <input
                  type="time"
                  name="openingTime"
                  value={formData.openingTime}
                  onChange={handleChange}
                  required
                />
                <input
                  type="time"
                  name="closingTime"
                  value={formData.closingTime}
                  onChange={handleChange}
                  required
                />
              </div>
              <input
                type="text"
                name="workingDays"
                placeholder="Working Days (e.g. Mon-Sat)"
                value={formData.workingDays}
                onChange={handleChange}
                required
              />
              <div className="form-grid">
                <input
                  type="text"
                  name="gstNumber"
                  placeholder="GST Number"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  required
                />
                <input
                  type="text"
                  name="fssaiLicense"
                  placeholder="FSSAI Licence"
                  value={formData.fssaiLicense}
                  onChange={handleChange}
                  inputMode="numeric"
                  required
                />
              </div>
              <div className="file-field">
                <label>Cafe Image</label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleChange}
                  required={!editingCafe}
                />
                {(formData.imageUrl || editingCafe?.imageUrl) && (
                  <span className="file-hint">{formData.image ? "New image selected" : "Keeping current image"}</span>
                )}
              </div>
              <div className="modal-actions">
                <button type="submit" className="primary-btn">
                  {editingCafe ? "Save Changes" : "Register"}
                </button>
                <button type="button" className="secondary-btn" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCafes;

