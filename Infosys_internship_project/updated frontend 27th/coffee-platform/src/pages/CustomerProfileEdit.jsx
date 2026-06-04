import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { userApi } from '../services/api';
import {
  createEmptyCustomerProfileForm,
  mapEditFormToUserProfilePayload,
  mapUserProfileToEditForm,
  syncCustomerProfileCache,
} from '../utils/customerProfile';
import { getCurrentUser, setCurrentUser } from '../utils/session';
import './MultiStepSignupPage.css';

const CustomerProfileEdit = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(createEmptyCustomerProfileForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!currentUser?.id) {
      setLoadError('Please login to edit your profile.');
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const { data } = await userApi.getProfile(currentUser.id);
        const safeProfileData = data && typeof data === 'object' ? data : {};
        setFormData(mapUserProfileToEditForm(safeProfileData));
        syncCustomerProfileCache(safeProfileData);
      } catch (error) {
        setLoadError(error.response?.data?.message || 'Unable to load your profile details.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };
  const handleEducationChange = (index, e) => {
    const { name, value } = e.target;
    const next = formData.educationQualifications.map((q, i) => i === index ? { ...q, [name]: value } : q);
    setFormData(prev => ({ ...prev, educationQualifications: next }));
    const key = `educationQualifications[${index}].${name}`;
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };
  const handleWorkChange = (index, e) => {
    const { name, value } = e.target;
    const next = formData.workExperiences.map((w, i) => i === index ? { ...w, [name]: value } : w);
    setFormData(prev => ({ ...prev, workExperiences: next }));
    const key = `workExperiences[${index}].${name}`;
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };
  const handleAddEducation = () => {
    setFormData(prev => ({ ...prev, educationQualifications: [...prev.educationQualifications, { highestQualification: '', institutionName: '', yearOfPassing: '', specialization: '', additionalCertifications: '' }] }));
  };
  const handleAddWork = () => {
    setFormData(prev => ({ ...prev, workExperiences: [...prev.workExperiences, { companyName: '', designation: '', yearsOfExperience: '', startDate: '', endDate: '', description: '', reasonForLeaving: '' }] }));
  };
  const validateStep = (step) => {
    const e = {};
    if (step === 1) {
      if (!formData.firstName) e.firstName = 'First name required';
      if (!formData.lastName) e.lastName = 'Last name required';
      if (!formData.email) e.email = 'Email required';
      if (!formData.phone) e.phone = 'Phone required';
      if (!formData.dateOfBirth) e.dateOfBirth = 'DOB required';
      if (!formData.gender) e.gender = 'Gender required';
    }
    if (step === 2) {
      formData.educationQualifications.forEach((q, i) => {
        if (!q.highestQualification) e[`educationQualifications[${i}].highestQualification`] = 'Required';
        if (!q.institutionName) e[`educationQualifications[${i}].institutionName`] = 'Required';
        if (!q.yearOfPassing) e[`educationQualifications[${i}].yearOfPassing`] = 'Required';
      });
    }
    if (step === 3) {
      if (!formData.currentEmploymentStatus) e.currentEmploymentStatus = 'Required';
    }
    if (step === 4) {
      if (!formData.idProofType) e.idProofType = 'Required';
      if (!formData.idProofNumber) e.idProofNumber = 'Required';
      if (!formData.address) e.address = 'Required';
      if (!formData.city) e.city = 'Required';
      if (!formData.state) e.state = 'Required';
      if (!formData.pincode) e.pincode = 'Required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const next = () => { if (validateStep(currentStep)) setCurrentStep(s => s + 1); };
  const prev = () => setCurrentStep(s => s - 1);

  const useSample = () => {
    setFormData({
      firstName: 'Pranitha',
      lastName: 'Kothapalli',
      email: 'pranithakothapalli02@gmail.com',
      phone: '7386940205',
      dateOfBirth: '2001-03-02',
      gender: 'female',
      educationQualifications: [{
        highestQualification: 'bachelors',
        institutionName: 'CMR',
        yearOfPassing: '2027',
        specialization: 'Java',
        additionalCertifications: 'C, Java, Python',
      }],
      workExperiences: [{
        companyName: '',
        designation: '',
        yearsOfExperience: '',
        startDate: '',
        endDate: '',
        description: '',
        reasonForLeaving: '',
      }],
      currentEmploymentStatus: 'student',
      skills: 'Java',
      idProofType: 'aadhar',
      idProofNumber: '1234567890',
      governmentIdProofName: 'CC_User_Agreement.pdf',
      address: 'Gayathri Nagar',
      city: 'Karimnagar',
      state: 'Andhra Pradesh',
      pincode: '505001',
      country: 'India',
    });
  };

  const save = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;
    setSubmitting(true);
    try {
      const payload = mapEditFormToUserProfilePayload(formData);
      const { data } = await userApi.updateProfile(currentUser.id, payload);

      syncCustomerProfileCache(data);
      setCurrentUser({
        ...currentUser,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });

      alert('Profile updated successfully');
      navigate('/customer-account');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="multistep-signup-page">
      <Header titleOnly />
      <main className="signup-content">
        <div className="signup-container">
          <div className="signup-header">
            <h1>Edit Profile</h1>
            <p>Update your details across all sections</p>
          </div>

          {loading && <div className="signup-form">Loading your profile...</div>}
          {!loading && loadError && <div className="error-banner">{loadError}</div>}

          {!loading && !loadError && <div className="progress-bar">
            <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Personal</div>
            </div>
            <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Education</div>
            </div>
            <div className={`progress-step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Work</div>
            </div>
            <div className={`progress-step ${currentStep >= 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`}>
              <div className="step-number">4</div>
              <div className="step-label">ID & Address</div>
            </div>
          </div>}

          {!loading && !loadError && <form className="signup-form" onSubmit={save}>
            {currentStep === 1 && (
              <div className="form-step">
                <h2 className="step-title">Personal Details</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input name="firstName" value={formData.firstName} onChange={handleChange} className={errors.firstName ? 'error' : ''} />
                    {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input name="lastName" value={formData.lastName} onChange={handleChange} className={errors.lastName ? 'error' : ''} />
                    {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email *</label>
                    <input name="email" type="email" value={formData.email} onChange={handleChange} className={errors.email ? 'error' : ''} />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} className={errors.phone ? 'error' : ''} />
                    {errors.phone && <span className="error-message">{errors.phone}</span>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth *</label>
                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className={errors.dateOfBirth ? 'error' : ''} />
                    {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
                  </div>
                  <div className="form-group">
                    <label>Gender *</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className={errors.gender ? 'error' : ''}>
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.gender && <span className="error-message">{errors.gender}</span>}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="form-step">
                <h2 className="step-title">Educational Qualifications</h2>
                {formData.educationQualifications.map((q, i) => (
                  <div key={i} className="qualification-entry">
                    <h3>Qualification #{i + 1}</h3>
                    <div className="form-group">
                      <label>Highest Qualification *</label>
                      <select name="highestQualification" value={q.highestQualification} onChange={(e) => handleEducationChange(i, e)} className={errors[`educationQualifications[${i}].highestQualification`] ? 'error' : ''}>
                        <option value="">Select Qualification</option>
                        <option value="high_school">High School</option>
                        <option value="diploma">Diploma</option>
                        <option value="bachelors">Bachelor's Degree</option>
                        <option value="masters">Master's Degree</option>
                        <option value="phd">PhD</option>
                      </select>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Institution Name *</label>
                        <input name="institutionName" value={q.institutionName} onChange={(e) => handleEducationChange(i, e)} className={errors[`educationQualifications[${i}].institutionName`] ? 'error' : ''} />
                      </div>
                      <div className="form-group">
                        <label>Year of Passing *</label>
                        <input type="number" name="yearOfPassing" value={q.yearOfPassing} onChange={(e) => handleEducationChange(i, e)} className={errors[`educationQualifications[${i}].yearOfPassing`] ? 'error' : ''} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Specialization / Field of Study</label>
                      <input name="specialization" value={q.specialization} onChange={(e) => handleEducationChange(i, e)} />
                    </div>
                    <div className="form-group">
                      <label>Additional Certifications</label>
                      <textarea name="additionalCertifications" value={q.additionalCertifications} onChange={(e) => handleEducationChange(i, e)} rows="3" />
                    </div>
                    <hr className="form-section-divider" />
                  </div>
                ))}
                <button type="button" onClick={handleAddEducation} className="btn-add">Add Another Qualification</button>
              </div>
            )}

            {currentStep === 3 && (
              <div className="form-step">
                <h2 className="step-title">Working Details</h2>
                <div className="form-group">
                  <label>Current Employment Status *</label>
                  <select name="currentEmploymentStatus" value={formData.currentEmploymentStatus} onChange={handleChange} className={errors.currentEmploymentStatus ? 'error' : ''}>
                    <option value="">Select Status</option>
                    <option value="employed">Employed</option>
                    <option value="self_employed">Self Employed</option>
                    <option value="unemployed">Unemployed</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                {formData.workExperiences.map((w, i) => (
                  <div key={i} className="work-experience-entry">
                    <h3>Work Experience #{i + 1}</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Company Name</label>
                        <input name="companyName" value={w.companyName} onChange={(e) => handleWorkChange(i, e)} />
                      </div>
                      <div className="form-group">
                        <label>Designation</label>
                        <input name="designation" value={w.designation} onChange={(e) => handleWorkChange(i, e)} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Years of Experience</label>
                        <input type="number" name="yearsOfExperience" value={w.yearsOfExperience} onChange={(e) => handleWorkChange(i, e)} />
                      </div>
                      <div className="form-group">
                        <label>Start Date</label>
                        <input type="date" name="startDate" value={w.startDate} onChange={(e) => handleWorkChange(i, e)} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <input type="date" name="endDate" value={w.endDate} onChange={(e) => handleWorkChange(i, e)} />
                    </div>
                    <div className="form-group">
                      <label>Description / Responsibilities</label>
                      <textarea name="description" value={w.description} onChange={(e) => handleWorkChange(i, e)} rows="3" />
                    </div>
                    <div className="form-group">
                      <label>Reason for Leaving</label>
                      <textarea name="reasonForLeaving" value={w.reasonForLeaving} onChange={(e) => handleWorkChange(i, e)} rows="3" />
                    </div>
                    <hr className="form-section-divider" />
                  </div>
                ))}
                <button type="button" onClick={handleAddWork} className="btn-add">Add Another Work Experience</button>
                <div className="form-group">
                  <label>Skills / Expertise</label>
                  <textarea name="skills" value={formData.skills} onChange={handleChange} rows="3" placeholder="List your relevant skills" />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="form-step">
                <h2 className="step-title">Government Proof & Address</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label>ID Proof Type *</label>
                    <select name="idProofType" value={formData.idProofType} onChange={handleChange} className={errors.idProofType ? 'error' : ''}>
                      <option value="">Select ID Type</option>
                      <option value="aadhar">Aadhar Card</option>
                      <option value="pan">PAN Card</option>
                      <option value="passport">Passport</option>
                      <option value="driving_license">Driving License</option>
                      <option value="voter_id">Voter ID</option>
                    </select>
                    {errors.idProofType && <span className="error-message">{errors.idProofType}</span>}
                  </div>
                  <div className="form-group">
                    <label>ID Proof Number *</label>
                    <input name="idProofNumber" value={formData.idProofNumber} onChange={handleChange} className={errors.idProofNumber ? 'error' : ''} />
                    {errors.idProofNumber && <span className="error-message">{errors.idProofNumber}</span>}
                  </div>
                </div>
                <div className="form-group">
                  <label>Full Address *</label>
                  <textarea name="address" value={formData.address} onChange={handleChange} className={errors.address ? 'error' : ''} rows="3" />
                  {errors.address && <span className="error-message">{errors.address}</span>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City *</label>
                    <input name="city" value={formData.city} onChange={handleChange} className={errors.city ? 'error' : ''} />
                    {errors.city && <span className="error-message">{errors.city}</span>}
                  </div>
                  <div className="form-group">
                    <label>State *</label>
                    <input name="state" value={formData.state} onChange={handleChange} className={errors.state ? 'error' : ''} />
                    {errors.state && <span className="error-message">{errors.state}</span>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Pincode *</label>
                    <input name="pincode" value={formData.pincode} onChange={handleChange} className={errors.pincode ? 'error' : ''} maxLength="6" />
                    {errors.pincode && <span className="error-message">{errors.pincode}</span>}
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <input name="country" value={formData.country} onChange={handleChange} disabled />
                  </div>
                </div>
              </div>
            )}

            <div className="form-navigation">
              {currentStep > 1 && <button type="button" onClick={prev} className="btn btn-secondary">Previous</button>}
              {currentStep < 4 ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={useSample} className="btn btn-secondary">Use Sample</button>
                  <button type="button" onClick={next} className="btn btn-primary">Next</button>
                </div>
              ) : (
                <button type="submit" className="btn btn-submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save Changes'}</button>
              )}
            </div>
          </form>}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CustomerProfileEdit;




// import React, { useEffect, useState } from "react";
// import axios from "axios";

// const CustomerEditProfile = () => {

//   const [customer,setCustomer] = useState({
//     name:"",
//     email:"",
//     phone:""
//   });

//   useEffect(() => {

//     const user = JSON.parse(localStorage.getItem("customer"));

//     if(user){
//         setCustomer(user);
//     }

//   },[]);


//   const handleChange = (e) => {

//     setCustomer({
//       ...customer,
//       [e.target.name]: e.target.value
//     });

//   };

//   const handleUpdate = () => {

//     axios.put(`http://localhost:8081/api/users/${customer.id}`,customer)
//       .then(res => {

//         localStorage.setItem("customer", JSON.stringify(res.data));

//         alert("Profile Updated");

//       });

//   };

//   return (

//     <div className="edit-profile">

//       <h2>Edit Profile</h2>

//       <input
//         name="name"
//         value={customer.name}
//         onChange={handleChange}
//         placeholder="Name"
//       />

//       <input
//         name="email"
//         value={customer.email}
//         onChange={handleChange}
//         placeholder="Email"
//       />

//       <input
//         name="phone"
//         value={customer.phone}
//         onChange={handleChange}
//         placeholder="Phone"
//       />

//       <button onClick={handleUpdate}>
//         Update Profile
//       </button>

//     </div>

//   );

// };

// export default CustomerEditProfile;


