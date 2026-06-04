import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { authApi } from '../services/api';
import './MultiStepSignupPage.css';

const MultiStepSignupPage = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal Details
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',

    // Step 2: Qualifications
    educationQualifications: [{
      highestQualification: '',
      institutionName: '',
      yearOfPassing: '',
      specialization: '',
      additionalCertifications: '',
    }],
    
    // Step 3: Working Details
    workExperiences: [{
      companyName: '',
      designation: '',
      yearsOfExperience: '',
      startDate: '',
      endDate: '',
      description: '',
      reasonForLeaving: '',
    }],
    currentEmploymentStatus: '',

    skills: '',
    cafeId: '', // For chef/waiter
    cafeName: '', // For cafe owner
    cafeAddress: '', // For cafe owner

    // Step 4: Government Proof
    idProofType: '',
    idProofNumber: '',
    governmentIdProof: null, // To store the uploaded file
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isCafeOwner = role === 'cafe-owner' || role === 'cafe_owner';
  const currentYear = new Date().getFullYear();
  const today = new Date().toISOString().split('T')[0];

  const validateName = (value) => /^[A-Za-z\s]+$/.test(value.trim());
  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const validatePhone = (value) => /^[6-9]\d{9}$/.test(value.replace(/\D/g, ''));
  const validateLettersOnly = (value) => /^[A-Za-z\s]+$/.test(value.trim());
  const validateCityName = (value) => /^[A-Za-z][A-Za-z\s.-]{1,49}$/.test(value.trim());
  const validatePincode = (value) => /^\d{6}$/.test(value.trim());
  const validateIdProofImageFile = (file) => {
    if (!file) {
      return 'Government ID proof document is required';
    }

    const allowedTypes = ['image/png', 'image/jpeg'];
    return allowedTypes.includes(file.type) ? '' : 'Government ID proof must be a PNG or JPG image';
  };
  const sanitizeIdProofNumberInput = (proofType, rawValue) => {
    switch (proofType) {
      case 'aadhar':
        return rawValue.replace(/\D/g, '').slice(0, 12);
      case 'pan':
        return rawValue.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10);
      case 'passport':
        return rawValue.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
      case 'driving_license':
        return rawValue.replace(/[^A-Za-z0-9-]/g, '').toUpperCase().slice(0, 20);
      case 'voter_id':
        return rawValue.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10);
      default:
        return rawValue.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
    }
  };

  const validateIdProofNumber = (type, value) => {
    const trimmedValue = value.trim().toUpperCase();

    if (!trimmedValue) {
      return 'ID proof number is required';
    }

    switch (type) {
      case 'aadhar':
        return /^\d{12}$/.test(trimmedValue) ? '' : 'Aadhar number must be 12 digits';
      case 'pan':
        return /^[A-Z]{5}\d{4}[A-Z]$/.test(trimmedValue) ? '' : 'PAN number must be in valid format';
      case 'passport':
        return /^[A-Z][0-9]{7}$/.test(trimmedValue) ? '' : 'Passport number must be in valid format';
      case 'driving_license':
        return /^[A-Z0-9-]{8,20}$/.test(trimmedValue) ? '' : 'Driving license number must be 8 to 20 characters';
      case 'voter_id':
        return /^[A-Z]{3}[0-9]{7}$/.test(trimmedValue) ? '' : 'Voter ID must be in valid format';
      default:
        return '';
    }
  };

  useEffect(() => {
    if (!role) {
      navigate('/role-selection');
    }
  }, [role, navigate]);

  const getRoleTitle = () => {
    const roles = {
      customer: 'Customer',
      'cafe-owner': 'Cafe Owner',
      cafe_owner: 'Cafe Owner',
      chef: 'Chef',
      waiter: 'Waiter'
    };
    return roles[role] || 'User';
  };

  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;

    if (name === 'firstName' || name === 'lastName' || name === 'skills') {
      value = value.replace(/[^A-Za-z\s]/g, '');
    }

    if (name === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }

    if (name === 'idProofNumber') {
      value = sanitizeIdProofNumberInput(formData.idProofType, value);
    }

    setFormData(prev => {
      if (name === 'idProofType') {
        return {
          ...prev,
          idProofType: value,
          idProofNumber: sanitizeIdProofNumberInput(value, prev.idProofNumber)
        };
      }

      return {
        ...prev,
        [name]: value
      };
    });
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleEducationChange = (index, e) => {
    const { name } = e.target;
    let { value } = e.target;

    if (name === 'institutionName' || name === 'specialization' || name === 'additionalCertifications') {
      value = value.replace(/[^A-Za-z\s]/g, '');
    }

    const updatedQualifications = formData.educationQualifications.map((qualification, i) =>
      i === index ? { ...qualification, [name]: value } : qualification
    );
    setFormData(prev => ({
      ...prev,
      educationQualifications: updatedQualifications
    }));
    // Clear error for this field if it exists
    if (errors[`educationQualifications[${index}].${name}`]) {
      setErrors(prev => ({
        ...prev,
        [`educationQualifications[${index}].${name}`]: ''
      }));
    }
  };

  const handleWorkExperienceChange = (index, e) => {
    const { name, value } = e.target;
    const updatedWorkExperiences = formData.workExperiences.map((experience, i) =>
      i === index ? { ...experience, [name]: value } : experience
    );
    setFormData(prev => ({
      ...prev,
      workExperiences: updatedWorkExperiences
    }));
    if (errors[`workExperiences[${index}].${name}`]) {
      setErrors(prev => ({
        ...prev,
        [`workExperiences[${index}].${name}`]: ''
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      } else if (!validateName(formData.firstName)) {
        newErrors.firstName = 'First name should contain only letters';
      }

      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      } else if (!validateName(formData.lastName)) {
        newErrors.lastName = 'Last name should contain only letters';
      }

      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Enter a valid email address';
      }

      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!validatePhone(formData.phone)) {
        newErrors.phone = 'Phone number must be 10 digits and start with 6 to 9';
      }

      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = 'Date of birth is required';
      } else if (new Date(formData.dateOfBirth) > new Date()) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }

      if (!formData.gender) newErrors.gender = 'Gender is required';
    }

    if (step === 2) {
      formData.educationQualifications.forEach((qualification, index) => {
        if (!qualification.highestQualification) newErrors[`educationQualifications[${index}].highestQualification`] = 'Qualification is required';
        if (!qualification.institutionName.trim()) {
          newErrors[`educationQualifications[${index}].institutionName`] = 'Institution name is required';
        } else if (!validateLettersOnly(qualification.institutionName)) {
          newErrors[`educationQualifications[${index}].institutionName`] = 'Institution name should contain only letters';
        }

        if (!qualification.yearOfPassing) {
          newErrors[`educationQualifications[${index}].yearOfPassing`] = 'Year of passing is required';
        } else if (!/^\d{4}$/.test(String(qualification.yearOfPassing)) || Number(qualification.yearOfPassing) < 1950 || Number(qualification.yearOfPassing) > currentYear + 10) {
          newErrors[`educationQualifications[${index}].yearOfPassing`] = 'Enter a valid passing year';
        }
        if (qualification.specialization.trim() && !validateLettersOnly(qualification.specialization)) {
          newErrors[`educationQualifications[${index}].specialization`] = 'Specialization should contain only letters';
        }
        if (qualification.additionalCertifications.trim() && !validateLettersOnly(qualification.additionalCertifications)) {
          newErrors[`educationQualifications[${index}].additionalCertifications`] = 'Additional certifications should contain only letters';
        }
      });
    }

    if (step === 3) {
      if (!formData.currentEmploymentStatus) newErrors.currentEmploymentStatus = 'Employment status is required';

      formData.workExperiences.forEach((experience, index) => {
        if (formData.currentEmploymentStatus === 'employed' && !experience.companyName.trim()) newErrors[`workExperiences[${index}].companyName`] = 'Company name is required';
        if (formData.currentEmploymentStatus === 'employed' && !experience.designation.trim()) newErrors[`workExperiences[${index}].designation`] = 'Designation is required';
        if (formData.currentEmploymentStatus === 'employed' && !experience.yearsOfExperience) {
          newErrors[`workExperiences[${index}].yearsOfExperience`] = 'Years of experience is required';
        } else if (
          formData.currentEmploymentStatus === 'employed' &&
          (!/^\d+(\.\d+)?$/.test(String(experience.yearsOfExperience)) || Number(experience.yearsOfExperience) < 0 || Number(experience.yearsOfExperience) > 50)
        ) {
          newErrors[`workExperiences[${index}].yearsOfExperience`] = 'Enter valid years of experience';
        }
        if (formData.currentEmploymentStatus === 'employed' && !experience.startDate) {
          newErrors[`workExperiences[${index}].startDate`] = 'Start Date is required';
        } else if (
          formData.currentEmploymentStatus === 'employed' &&
          experience.startDate &&
          new Date(experience.startDate) > new Date()
        ) {
          newErrors[`workExperiences[${index}].startDate`] = 'Start date cannot be in the future';
        }
        if (
          formData.currentEmploymentStatus === 'employed' &&
          experience.startDate &&
          experience.endDate &&
          new Date(experience.endDate) < new Date(experience.startDate)
        ) {
          newErrors[`workExperiences[${index}].endDate`] = 'End date cannot be before start date';
        }
      });
      
      if (isCafeOwner) {
        if (!formData.cafeName.trim()) {
          newErrors.cafeName = 'Cafe name is required';
        } else if (formData.cafeName.trim().length < 3) {
          newErrors.cafeName = 'Cafe name must be at least 3 characters';
        }
        if (!formData.cafeAddress.trim()) {
          newErrors.cafeAddress = 'Cafe address is required';
        } else if (formData.cafeAddress.trim().length < 10) {
          newErrors.cafeAddress = 'Cafe address must be at least 10 characters';
        }
      }
      
      if (role === 'chef' || role === 'waiter') {
        if (!formData.cafeId) newErrors.cafeId = 'Please select a cafe';
      }

      if (formData.skills.trim() && !validateLettersOnly(formData.skills)) {
        newErrors.skills = 'Skills should contain only letters';
      }
    }

    if (step === 4) {
      if (!formData.idProofType) newErrors.idProofType = 'ID proof type is required';
      const idProofNumberError = validateIdProofNumber(formData.idProofType, formData.idProofNumber);
      if (idProofNumberError) newErrors.idProofNumber = idProofNumberError;
      if (!formData.governmentIdProof) newErrors.governmentIdProof = 'Government ID proof document is required';
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required';
      } else if (formData.address.trim().length < 10) {
        newErrors.address = 'Address must be at least 10 characters';
      }
      if (!formData.city.trim()) {
        newErrors.city = 'City is required';
      } else if (!validateCityName(formData.city)) {
        newErrors.city = 'Enter a valid city name';
      }
      if (!formData.state) newErrors.state = 'State is required';
      if (!formData.pincode.trim()) {
        newErrors.pincode = 'Pincode is required';
      } else if (!validatePincode(formData.pincode)) {
        newErrors.pincode = 'Pincode must be 6 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddWorkExperience = () => {
    setFormData(prev => ({
      ...prev,
      workExperiences: [
        ...prev.workExperiences,
        {
          companyName: '',
          designation: '',
          yearsOfExperience: '',
          startDate: '',
          endDate: '',
          description: '',
          reasonForLeaving: '',
        },
      ],
    }));
  };

  const handleRemoveWorkExperience = (index) => {
    setFormData(prev => ({
      ...prev,
      workExperiences: prev.workExperiences.filter((_, i) => i !== index),
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const fileError = validateIdProofImageFile(file);

    if (fileError) {
      setFormData(prev => ({
        ...prev,
        governmentIdProof: null
      }));
      setErrors(prev => ({
        ...prev,
        governmentIdProof: fileError
      }));
      e.target.value = '';
      return;
    }

    setFormData(prev => ({
      ...prev,
      governmentIdProof: file
    }));
    setErrors(prev => ({
      ...prev,
      governmentIdProof: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(4)) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const roleValue = role === 'cafe-owner' ? 'cafe_owner' : role;
      const primaryQualification = formData.educationQualifications[0] || {};
      const registerData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email.trim(),
        phone: formData.phone.replace(/[^0-9]/g, '').slice(-10),
        role: roleValue.toUpperCase().replace('-', '_'),
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        highestQualification: primaryQualification.highestQualification || null,
        institutionName: primaryQualification.institutionName?.trim() || null,
        yearOfPassing: primaryQualification.yearOfPassing ? Number(primaryQualification.yearOfPassing) : null,
        specialization: primaryQualification.specialization?.trim() || null,
        additionalCertifications: primaryQualification.additionalCertifications?.trim() || null,
        currentEmploymentStatus: formData.currentEmploymentStatus || null,
        skills: formData.skills?.trim() || null,
        idProofType: formData.idProofType || null,
        idProofNumber: formData.idProofNumber?.trim() || null,
        cafeId: formData.cafeId || null,
        cafeName: formData.cafeName || null,
        cafeAddress: formData.cafeAddress || null,
        address: formData.address?.trim() || null,
        city: formData.city?.trim() || null,
        state: formData.state || null,
        pincode: formData.pincode ? Number(formData.pincode) : null,
        country: formData.country || 'India',
      };

      await authApi.register(registerData);

      navigate('/reset-password', {
        state: {
          email: formData.email.trim(),
          message: 'Registration submitted successfully. Your request is now pending admin approval. Once approved, check your email for the OTP and complete password setup here.'
        }
      });

    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Registration failed. Please try again.';
      setErrors({ submit: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="multistep-signup-page">
      <Header />

      <main className="signup-content">
        <div className="signup-container">
          <div className="signup-header">
            <h1>Sign Up as {getRoleTitle()}</h1>
            <p>Complete all steps to create your account</p>
          </div>

          {/* Progress Bar */}
          <div className="progress-bar">
            <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Personal Details</div>
            </div>
            <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Qualifications</div>
            </div>
            <div className={`progress-step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Working Details</div>
            </div>
            <div className={`progress-step ${currentStep >= 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`}>
              <div className="step-number">4</div>
              <div className="step-label">Government Proof</div>
            </div>
          </div>

          <form className="signup-form" onSubmit={handleSubmit}>
            {errors.submit && (
              <div className="error-banner">{errors.submit}</div>
            )}

            {/* Step 1: Personal Details */}
            {currentStep === 1 && (
              <div className="form-step">
                <h2 className="step-title">Personal Details</h2>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name *</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={errors.firstName ? 'error' : ''}
                    />
                    {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName">Last Name *</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={errors.lastName ? 'error' : ''}
                    />
                    {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={errors.phone ? 'error' : ''}
                      placeholder="+91 1234567890"
                    />
                    {errors.phone && <span className="error-message">{errors.phone}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="dateOfBirth">Date of Birth *</label>
                      <input
                        type="date"
                        id="dateOfBirth"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className={errors.dateOfBirth ? 'error' : ''}
                        max={today}
                      />
                    {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="gender">Gender *</label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={errors.gender ? 'error' : ''}
                    >
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

            {/* Step 2: Qualifications */}
            {currentStep === 2 && (
              <div className="form-step">
                <h2 className="step-title">Educational Qualifications</h2>

                <div className="qualifications-list-container">
                  <div className="qualification-entry">
                    <div className="form-group">
                      <label htmlFor="highestQualification-0">Highest Qualification *</label>
                      <select
                        id="highestQualification-0"
                        name="highestQualification"
                        value={formData.educationQualifications[0].highestQualification}
                        onChange={(e) => handleEducationChange(0, e)}
                        className={errors['educationQualifications[0].highestQualification'] ? 'error' : ''}
                      >
                        <option value="">Select Qualification</option>
                        <option value="high_school">High School</option>
                        <option value="diploma">Diploma</option>
                        <option value="bachelors">Bachelor's Degree</option>
                        <option value="masters">Master's Degree</option>
                        <option value="phd">PhD</option>
                      </select>
                      {errors['educationQualifications[0].highestQualification'] && <span className="error-message">{errors['educationQualifications[0].highestQualification']}</span>}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="institutionName-0">Institution Name *</label>
                        <input
                          type="text"
                          id="institutionName-0"
                          name="institutionName"
                          value={formData.educationQualifications[0].institutionName}
                          onChange={(e) => handleEducationChange(0, e)}
                          className={errors['educationQualifications[0].institutionName'] ? 'error' : ''}
                        />
                        {errors['educationQualifications[0].institutionName'] && <span className="error-message">{errors['educationQualifications[0].institutionName']}</span>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="yearOfPassing-0">Year of Passing *</label>
                        <input
                          type="number"
                          id="yearOfPassing-0"
                          name="yearOfPassing"
                          value={formData.educationQualifications[0].yearOfPassing}
                          onChange={(e) => handleEducationChange(0, e)}
                          className={errors['educationQualifications[0].yearOfPassing'] ? 'error' : ''}
                          min="1950"
                          max="2030"
                        />
                        {errors['educationQualifications[0].yearOfPassing'] && <span className="error-message">{errors['educationQualifications[0].yearOfPassing']}</span>}
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="specialization-0">Specialization / Field of Study</label>
                      <input
                        type="text"
                        id="specialization-0"
                        name="specialization"
                        value={formData.educationQualifications[0].specialization}
                        onChange={(e) => handleEducationChange(0, e)}
                      />
                      {errors['educationQualifications[0].specialization'] && <span className="error-message">{errors['educationQualifications[0].specialization']}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="additionalCertifications-0">Additional Certifications</label>
                      <textarea
                        id="additionalCertifications-0"
                        name="additionalCertifications"
                        value={formData.educationQualifications[0].additionalCertifications}
                        onChange={(e) => handleEducationChange(0, e)}
                        rows="3"
                        placeholder="List any additional certifications or courses"
                      />
                      {errors['educationQualifications[0].additionalCertifications'] && <span className="error-message">{errors['educationQualifications[0].additionalCertifications']}</span>}
                    </div>
                    <hr className="form-section-divider" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Working Details */}
            {currentStep === 3 && (
              <div className="form-step">
                <h2 className="step-title">Working Details</h2>

                <div className="form-group">
                  <label htmlFor="currentEmploymentStatus">Current Employment Status *</label>
                  <select
                    id="currentEmploymentStatus"
                    name="currentEmploymentStatus"
                    value={formData.currentEmploymentStatus}
                    onChange={handleChange}
                    className={errors.currentEmploymentStatus ? 'error' : ''}
                  >
                    <option value="">Select Status</option>
                    <option value="employed">Employed</option>
                    <option value="self_employed">Self Employed</option>
                    <option value="unemployed">Unemployed</option>
                    <option value="student">Student</option>
                  </select>
                  {errors.currentEmploymentStatus && <span className="error-message">{errors.currentEmploymentStatus}</span>}
                </div>

                {formData.currentEmploymentStatus === 'employed' && (
                  <div className="work-experiences-list-container">
                    {formData.workExperiences.map((experience, index) => (
                      <div key={index} className="work-experience-entry">
                        <h3>Work Experience #{index + 1}</h3>
                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor={`companyName-${index}`}>Company Name *</label>
                            <input
                              type="text"
                              id={`companyName-${index}`}
                              name="companyName"
                              value={experience.companyName}
                              onChange={(e) => handleWorkExperienceChange(index, e)}
                              className={errors[`workExperiences[${index}].companyName`] ? 'error' : ''}
                            />
                            {errors[`workExperiences[${index}].companyName`] && <span className="error-message">{errors[`workExperiences[${index}].companyName`]}</span>}
                          </div>

                          <div className="form-group">
                            <label htmlFor={`designation-${index}`}>Designation *</label>
                            <input
                              type="text"
                              id={`designation-${index}`}
                              name="designation"
                              value={experience.designation}
                              onChange={(e) => handleWorkExperienceChange(index, e)}
                              className={errors[`workExperiences[${index}].designation`] ? 'error' : ''}
                            />
                            {errors[`workExperiences[${index}].designation`] && <span className="error-message">{errors[`workExperiences[${index}].designation`]}</span>}
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor={`yearsOfExperience-${index}`}>Years of Experience *</label>
                            <input
                              type="number"
                              id={`yearsOfExperience-${index}`}
                              name="yearsOfExperience"
                              value={experience.yearsOfExperience}
                              onChange={(e) => handleWorkExperienceChange(index, e)}
                              className={errors[`workExperiences[${index}].yearsOfExperience`] ? 'error' : ''}
                              min="0"
                              max="50"
                            />
                            {errors[`workExperiences[${index}].yearsOfExperience`] && <span className="error-message">{errors[`workExperiences[${index}].yearsOfExperience`]}</span>}
                          </div>
                          <div className="form-group">
                            <label htmlFor={`startDate-${index}`}>Start Date *</label>
                            <input
                              type="date"
                              id={`startDate-${index}`}
                              name="startDate"
                              value={experience.startDate}
                              onChange={(e) => handleWorkExperienceChange(index, e)}
                              className={errors[`workExperiences[${index}].startDate`] ? 'error' : ''}
                            />
                            {errors[`workExperiences[${index}].startDate`] && <span className="error-message">{errors[`workExperiences[${index}].startDate`]}</span>}
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor={`endDate-${index}`}>End Date</label>
                          <input
                            type="date"
                            id={`endDate-${index}`}
                            name="endDate"
                            value={experience.endDate}
                            onChange={(e) => handleWorkExperienceChange(index, e)}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor={`description-${index}`}>Description / Responsibilities</label>
                          <textarea
                            id={`description-${index}`}
                            name="description"
                            value={experience.description}
                            onChange={(e) => handleWorkExperienceChange(index, e)}
                            rows="3"
                            placeholder="Briefly describe your role and responsibilities"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`reasonForLeaving-${index}`}>Reason for Leaving</label>
                          <textarea
                            id={`reasonForLeaving-${index}`}
                            name="reasonForLeaving"
                            value={experience.reasonForLeaving}
                            onChange={(e) => handleWorkExperienceChange(index, e)}
                            rows="3"
                            placeholder="Reason for leaving this employment"
                          />
                        </div>
                        {formData.workExperiences.length > 1 && (
                          <button type="button" onClick={() => handleRemoveWorkExperience(index)} className="btn-remove">
                            Remove Work Experience
                          </button>
                        )}
                        <hr className="form-section-divider" />
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" onClick={handleAddWorkExperience} className="btn-add">
                  Add Another Work Experience
                </button>

                <div className="form-group">
                  <label htmlFor="skills">Skills / Expertise</label>
                  <textarea
                    id="skills"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    rows="3"
                    placeholder="List your relevant skills"
                  />
                  {errors.skills && <span className="error-message">{errors.skills}</span>}
                </div>

                {/* Cafe Owner Specific Fields */}
                {isCafeOwner && (
                  <>
                    <div className="form-group">
                      <label htmlFor="cafeName">Cafe Name *</label>
                      <input
                        type="text"
                        id="cafeName"
                        name="cafeName"
                        value={formData.cafeName}
                        onChange={handleChange}
                        className={errors.cafeName ? 'error' : ''}
                      />
                      {errors.cafeName && <span className="error-message">{errors.cafeName}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="cafeAddress">Cafe Address *</label>
                      <textarea
                        id="cafeAddress"
                        name="cafeAddress"
                        value={formData.cafeAddress}
                        onChange={handleChange}
                        className={errors.cafeAddress ? 'error' : ''}
                        rows="3"
                      />
                      {errors.cafeAddress && <span className="error-message">{errors.cafeAddress}</span>}
                    </div>
                  </>
                )}

                {/* Chef/Waiter Specific Fields */}
                {(role === 'chef' || role === 'waiter') && (
                  <div className="form-group">
                    <label htmlFor="cafeId">Select Cafe to Work For *</label>
                    <select
                      id="cafeId"
                      name="cafeId"
                      value={formData.cafeId}
                      onChange={handleChange}
                      className={errors.cafeId ? 'error' : ''}
                    >
                      <option value="">-- Choose a cafe --</option>
                      <option value="cafe1">Coffee House Downtown</option>
                      <option value="cafe2">Brew & Beans</option>
                      <option value="cafe3">The Daily Grind</option>
                      <option value="cafe4">Espresso Express</option>
                      <option value="cafe5">Cafe Mocha</option>
                    </select>
                    {errors.cafeId && <span className="error-message">{errors.cafeId}</span>}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Government Proof */}
            {currentStep === 4 && (
              <div className="form-step">
                <h2 className="step-title">Government Proof & Address</h2>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="idProofType">ID Proof Type *</label>
                    <select
                      id="idProofType"
                      name="idProofType"
                      value={formData.idProofType}
                      onChange={handleChange}
                      className={errors.idProofType ? 'error' : ''}
                    >
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
                    <label htmlFor="idProofNumber">ID Proof Number *</label>
                    <input
                      type="text"
                      id="idProofNumber"
                      name="idProofNumber"
                      value={formData.idProofNumber}
                      onChange={handleChange}
                      className={errors.idProofNumber ? 'error' : ''}
                      inputMode={formData.idProofType === 'aadhar' ? 'numeric' : 'text'}
                      maxLength={
                        formData.idProofType === 'aadhar' ? 12 :
                        formData.idProofType === 'pan' ? 10 :
                        formData.idProofType === 'passport' ? 8 :
                        formData.idProofType === 'voter_id' ? 10 :
                        formData.idProofType === 'driving_license' ? 20 : undefined
                      }
                      minLength={
                        formData.idProofType === 'aadhar' ? 12 :
                        formData.idProofType === 'pan' ? 10 :
                        formData.idProofType === 'passport' ? 8 :
                        formData.idProofType === 'voter_id' ? 10 :
                        formData.idProofType === 'driving_license' ? 8 : undefined
                      }
                    />
                    {errors.idProofNumber && <span className="error-message">{errors.idProofNumber}</span>}
                  </div>
                </div>



                <div className="form-group">
                  <label htmlFor="governmentIdProof">Upload Government ID Proof *</label>
                  <input
                    type="file"
                    id="governmentIdProof"
                    name="governmentIdProof"
                    onChange={handleFileChange}
                    className={errors.governmentIdProof ? 'error' : ''}
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  />
                  {formData.governmentIdProof && <p className="uploaded-file-name">File selected: {formData.governmentIdProof.name}</p>}
                  {errors.governmentIdProof && <span className="error-message">{errors.governmentIdProof}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="address">Full Address *</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={errors.address ? 'error' : ''}
                    rows="3"
                    placeholder="Enter your complete address"
                  />
                  {errors.address && <span className="error-message">{errors.address}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={errors.city ? 'error' : ''}
                    />
                    {errors.city && <span className="error-message">{errors.city}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="state">State *</label>
                    <select
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className={errors.state ? 'error' : ''}
                    >
                      <option value="">Select State</option>
                      <option value="AP">Andhra Pradesh</option>
                      <option value="KA">Karnataka</option>
                      <option value="TN">Tamil Nadu</option>
                      <option value="MH">Maharashtra</option>
                      <option value="DL">Delhi</option>
                      {/* Add more states as needed */}
                    </select>
                    {errors.state && <span className="error-message">{errors.state}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="pincode">Pincode *</label>
                    <input
                      type="text"
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      className={errors.pincode ? 'error' : ''}
                      maxLength="6"
                    />
                    {errors.pincode && <span className="error-message">{errors.pincode}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="country">Country</label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      disabled
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="form-navigation">
              {currentStep > 1 && (
                <button type="button" onClick={handlePrevious} className="btn btn-secondary">
                  Previous
                </button>
              )}

              {currentStep < 4 ? (
                <button type="button" onClick={handleNext} className="btn btn-primary">
                  Next
                </button>
              ) : (
                <button type="submit" className="btn btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Complete Registration'}
                </button>
              )}
            </div>
          </form>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MultiStepSignupPage;
