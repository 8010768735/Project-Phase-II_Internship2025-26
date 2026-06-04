import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import DashboardOverview from "./DashboardOverview";
import TotalIncome from "./TotalIncome";
import CafeDetails from "./CafeDetails";
import MenuManagement from "./MenuManagement";
import OrdersManagement from "./OrdersManagement";
import ReservationManagement from "./ReservationManagement";
import TablesManagement from "./TablesManagement";
import PaymentsManagement from "./PaymentsManagement";
import CustomerProfile from "./CustomerProfileInOwnerDb";
import StaffManagement from "./StaffManagement";
import MyCafes from "./MyCafes";
import EventManagement from "./EventManagement";
import FeedbackManagement from "./FeedbackManagement";
import {
  getCurrentCafeId,
  getCurrentUser,
  setCurrentCafeId,
  clearCurrentCafeId,
} from "../../utils/session";

import "./CafeownerDashboard.css";

const CafeOwnerDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [cafes, setCafes] = useState([]);
  const [selectedCafe, setSelectedCafe] = useState(null);
  const [successPopup, setSuccessPopup] = useState("");

  const user = getCurrentUser();

  const loadCafes = () => {
    const ownerId = user?.id;

    if (!ownerId) {
      console.log("Owner ID not found");
      setCafes([]);
      setSelectedCafe(null);
      clearCurrentCafeId();
      return;
    }

    fetch(`http://localhost:8081/api/cafe/owner/${ownerId}`)
      .then((res) => res.json())
      .then((data) => {
        const nextCafes = Array.isArray(data) ? data : [];
        setCafes(nextCafes);

        if (nextCafes.length === 0) {
          setSelectedCafe(null);
          clearCurrentCafeId();
          return;
        }

        const storedCafe = getCurrentCafeId();
        const foundCafe = storedCafe
          ? nextCafes.find((cafe) => cafe.id === Number(storedCafe))
          : null;
        const nextSelectedCafe = foundCafe || nextCafes[0] || null;

        setSelectedCafe(nextSelectedCafe);

        if (nextSelectedCafe?.id) {
          setCurrentCafeId(nextSelectedCafe.id);
        } else {
          clearCurrentCafeId();
        }
      })
      .catch((err) => console.error("Error fetching cafes:", err));
  };

  useEffect(() => {
    console.log("User:", user);
    loadCafes();
  }, []);

  useEffect(() => {
    const handleCafeChanged = () => loadCafes();
    window.addEventListener("cafeChanged", handleCafeChanged);
    return () => window.removeEventListener("cafeChanged", handleCafeChanged);
  }, [user?.id]);

  useEffect(() => {
    if (!successPopup) return undefined;

    const timeoutId = window.setTimeout(() => {
      setSuccessPopup("");
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [successPopup]);

  const showSuccessPopup = (message) => {
    setSuccessPopup(message);
  };

  const handleCafeChange = (e) => {
    const nextValue = e.target.value;

    if (!nextValue) {
      setSelectedCafe(null);
      clearCurrentCafeId();
      return;
    }

    const nextCafeId = Number(nextValue);
    const nextCafe = cafes.find((cafe) => cafe.id === nextCafeId) || null;

    setSelectedCafe(nextCafe);

    if (nextCafe?.id) {
      setCurrentCafeId(nextCafe.id);
    } else {
      clearCurrentCafeId();
    }
  };

  const cafeId = selectedCafe?.id;

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview cafeId={cafeId} />;

      case "total_income":
        return <TotalIncome cafeId={cafeId} />;

      case "overview":
        return <CafeDetails cafeId={cafeId} />;

      case "menu":
        return <MenuManagement cafeId={cafeId} onSuccess={showSuccessPopup} />;

      case "orders":
        return <OrdersManagement cafeId={cafeId} />;

      case "reservations":
        return <ReservationManagement cafeId={cafeId} onSuccess={showSuccessPopup} />;

      case "booking":
        return <TablesManagement cafeId={cafeId} onSuccess={showSuccessPopup} />;

      case "events":
        return (
          <EventManagement
            cafeId={cafeId}
            cafeName={selectedCafe?.cafeName}
            user={user}
            onSuccess={showSuccessPopup}
          />
        );

      case "event_requests":
        return (
          <EventManagement
            cafeId={cafeId}
            cafeName={selectedCafe?.cafeName}
            user={user}
            onSuccess={showSuccessPopup}
            mode="requests"
          />
        );

      case "payments":
        return <PaymentsManagement cafeId={cafeId} />;

      case "feedback":
        return <FeedbackManagement cafeId={cafeId} />;

      case "customer_profile":
        return <CustomerProfile cafeId={cafeId} />;

      case "staff":
        return <StaffManagement cafeId={cafeId} onSuccess={showSuccessPopup} />;

      case "mycafes":
        return <MyCafes onSuccess={showSuccessPopup} />;

      default:
        return <DashboardOverview cafeId={cafeId} />;
    }
  };

  return (
    <div className="owner-layout">
      <Sidebar
        className="sidebar"
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
      />

      <div className="owner-content">
        {successPopup && (
          <div className="owner-success-popup" role="status" aria-live="polite">
            {successPopup}
          </div>
        )}

        <div className="dashboard-header">
          <h2>
            Owner Dashboard
            {selectedCafe && ` - ${selectedCafe.cafeName}`}
          </h2>

          <div className="cafe-switcher">
            <label>Select Cafe:</label>

            <select value={selectedCafe?.id || ""} onChange={handleCafeChange}>
              <option value="">Select Cafe</option>

              {cafes.map((cafe) => (
                <option key={cafe.id} value={cafe.id}>
                  {cafe.cafeName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default CafeOwnerDashboard;

