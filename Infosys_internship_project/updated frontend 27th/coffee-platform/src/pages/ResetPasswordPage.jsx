import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./ResetPasswordPage.css";

function ResetPasswordPage() {

  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState(location.state?.message || "");
  const otpRequestedRef = useRef(false);

  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const stateEmail = location.state?.email;
    const emailParam = params.get("email");
    const resolvedEmail = stateEmail || emailParam || "";

    if (resolvedEmail) {
      setFormData((prev) => ({
        ...prev,
        email: resolvedEmail
      }));
    }
  }, [location]);

  useEffect(() => {
    const email = formData.email.trim();

    if (!email || otpRequestedRef.current) {
      return;
    }

    otpRequestedRef.current = true;

    const requestOtp = async () => {
      try {
        const response = await fetch("http://localhost:8081/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });

        await response.text();

        if (!response.ok) {
          setSuccessMessage("");
          return;
        }

        setSuccessMessage("OTP has been sent to your email. Enter it below to reset your password.");
      } catch (error) {
        console.error(error);
      }
    };

    requestOtp();
  }, [formData.email]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("http://localhost:8081/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,   // ✅ FIXED (was tempPassword ❌)
          newPassword: formData.newPassword
        })
      });

      const data = await response.text();

      if (!response.ok) {
        alert(data);
        return;
      }

      alert("Password reset successful!");
      navigate("/login");

    } catch (error) {
      console.error(error);
      alert("Server error");
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-card">
        <h2>Reset Password</h2>

        {successMessage && <p>{successMessage}</p>}

        <form onSubmit={handleSubmit}>

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="otp"
            placeholder="Enter OTP"
            value={formData.otp}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="newPassword"
            placeholder="New Password"
            value={formData.newPassword}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <button type="submit">Reset Password</button>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordPage;

