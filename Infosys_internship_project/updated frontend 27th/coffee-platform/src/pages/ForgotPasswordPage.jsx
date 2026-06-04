import React, { useState } from "react";
import "./ForgotPassword.css";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
const [email, setEmail] = useState("");
const [message, setMessage] = useState("");
const [error, setError] = useState("");
const [step, setStep] = useState(1); // 1 = enter email, 2 = enter OTP + password
const [otp, setOtp] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:8081/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setMessage("Password reset link has been sent to your email.");
        setError("");
        setStep(2);
      } else {
        const data = await res.json();
        setError(data.error || data.message || "Email not found.");
        setMessage("");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again later.");
      setMessage("");
    }
  };

  const handleResetPassword = async (e) => {
  e.preventDefault();
  if (newPassword !== confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  try {
      const res = await fetch("http://localhost:8081/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

    if (res.ok) {
      setMessage("Password reset successfully. You can now login.");
      setError("");
      setStep(1); // optional: go back to email step

       // ✅ Redirect to login after 2 seconds
        setTimeout(() => {
            navigate("/login"); // <-- change this path if your login route is different
        }, 2000);
    } else {
      const data = await res.json();
      setError(data.error || data.message || "Invalid OTP or expired");
      setMessage("");
    }
  } catch (err) {
    console.error(err);
    setError("Something went wrong");
    setMessage("");
  }
};

  return (
    <div className="forgot-password-container">
      <h2>Forgot Password</h2>
      {step === 1 && (
      <form onSubmit={handleSubmit} className="forgot-password-form">
        <input
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Send Otp</button>
      </form>
      )}
      {step === 2 && (
  <form onSubmit={handleResetPassword}>
    <input
      type="text"
      placeholder="Enter OTP"
      value={otp}
      onChange={(e) => setOtp(e.target.value)}
      required
    />
    <input
      type="password"
      placeholder="New Password"
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
      required
    />
    <input
      type="password"
      placeholder="Confirm Password"
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      required
    />
    <button type="submit">Reset Password</button>
  </form>
)}

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default ForgotPassword;



// import { useState } from "react";
// import "./LoginPage.css";

// const ForgotPasswordPage = () => {
//   const [email, setEmail] = useState("");
//   const [message, setMessage] = useState("");

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       const response = await fetch("http://localhost:8081/api/auth/forgot-password", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({ email })
//       });

//       const data = await response.text();

//       if (response.ok) {
//         setMessage("✅ OTP sent to your email");
//       } else {
//         setMessage("❌ " + data);
//       }

//     } catch (error) {
//       setMessage("❌ Server error");
//     }
//   };

//   return (
//     <div className="login-page">
//       <div className="login-container">
//         <div className="login-card">
//           <h2>Forgot Password</h2>

//           <form onSubmit={handleSubmit}>
//             <div className="form-group">
//               <label>Email</label>
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//               />
//             </div>

//             {message && <p>{message}</p>}

//             <button type="submit" className="btn btn-login">
//               Send OTP
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ForgotPasswordPage;



