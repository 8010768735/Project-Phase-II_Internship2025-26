import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./SignupPage.css";


const SignupPage = () => {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    role: "CUSTOMER",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    dob: "",
    gender: "",
    highestQual: "",
    institution: "",
    passingYear: "",
    specialization: "",
    emplymntStatus: "",
    skills: "",
    idProofType: "",
    idProofNum: "",
    fullAddress: "",
    city: "",
    state: "",
    pincode: "",
    country: ""
  });

  const [errors, setErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name required";
    if (!formData.email.trim()) newErrors.email = "Email required";
    if (!formData.phone.trim()) newErrors.phone = "Phone required";
    if (!formData.password) newErrors.password = "Password required";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMessage("");

    if (!validateForm()) {
      setSubmitMessage("Please fix the errors above.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        role: formData.role,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        dateOfBirth: formData.dob || null,
        gender: formData.gender || null,
        highestQualification: formData.highestQual?.trim() || null,
        institutionName: formData.institution?.trim() || null,
        yearOfPassing: formData.passingYear
          ? Number(formData.passingYear)
          : null,
        specialization: formData.specialization?.trim() || null,
        currentEmploymentStatus: formData.emplymntStatus?.trim() || null,
        skills: formData.skills?.trim() || null,
        idProofType: formData.idProofType?.trim() || null,
        idProofNumber: formData.idProofNum?.trim() || null,
        address: formData.fullAddress?.trim() || null,
        city: formData.city?.trim() || null,
        state: formData.state?.trim() || null,
        pincode: formData.pincode
          ? Number(formData.pincode)
          : null,
        country: formData.country?.trim() || null
      };

      const response = await fetch(
        "http://localhost:8081/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setSubmitMessage("❌ " + data.message);
        return;
      }

      setSubmitMessage("✅ Registration successful! Redirecting...");

    // 🔥 Redirect to create password page with email
      setTimeout(() => {
      navigate("/reset-password", {
      state: { email: formData.email }
      });
    }, 1000);


    } catch (error) {
      setSubmitMessage("❌ Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-page">
      <Header />

      <main className="signup-main">
        <div className="signup-container">
          <h1>Create Account</h1>

          <form onSubmit={handleSubmit}>

            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="CUSTOMER">Customer</option>
              <option value="CAFE_OWNER">Cafe Owner</option>
              <option value="CHEF">Chef</option>
              <option value="WAITER">Waiter</option>
            </select>

            <input type="text" name="firstName" placeholder="First Name"
              value={formData.firstName} onChange={handleChange} required />

            <input type="text" name="lastName" placeholder="Last Name"
              value={formData.lastName} onChange={handleChange} required />

            <input type="email" name="email" placeholder="Email"
              value={formData.email} onChange={handleChange} required />

            <input type="tel" name="phone" placeholder="Phone"
              value={formData.phone} onChange={handleChange} required />

            <input type="date" name="dob"
              value={formData.dob} onChange={handleChange} />

            <input name="gender" placeholder="Gender"
              value={formData.gender} onChange={handleChange} />

            <input name="highestQual" placeholder="Highest Qualification"
              value={formData.highestQual} onChange={handleChange} />

            <input name="institution" placeholder="Institution"
              value={formData.institution} onChange={handleChange} />

            <input type="number" name="passingYear"
              placeholder="Passing Year"
              value={formData.passingYear}
              onChange={handleChange} />

            <input name="specialization" placeholder="Specialization"
              value={formData.specialization} onChange={handleChange} />

            <input name="emplymntStatus" placeholder="Employment Status"
              value={formData.emplymntStatus} onChange={handleChange} />

            <input name="skills" placeholder="Skills"
              value={formData.skills} onChange={handleChange} />

            <input name="idProofType" placeholder="ID Proof Type"
              value={formData.idProofType} onChange={handleChange} />

            <input name="idProofNum" placeholder="ID Proof Number"
              value={formData.idProofNum} onChange={handleChange} />

            <input name="fullAddress" placeholder="Full Address"
              value={formData.fullAddress} onChange={handleChange} />

            <input name="city" placeholder="City"
              value={formData.city} onChange={handleChange} />

            <input name="state" placeholder="State"
              value={formData.state} onChange={handleChange} />

            <input type="number" name="pincode"
              placeholder="Pincode"
              value={formData.pincode}
              onChange={handleChange} />

            <input name="country" placeholder="Country"
              value={formData.country} onChange={handleChange} />

            <input type="password" name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange} required />

            <input type="password" name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange} required />

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Account"}
            </button>

            {submitMessage && (
              <p className="submit-message">{submitMessage}</p>
            )}

          </form>

          <p>
            Already have an account? <Link to="/login">Login</Link>
          </p>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SignupPage;

