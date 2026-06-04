export const createEmptyCustomerProfileForm = () => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  educationQualifications: [
    {
      highestQualification: '',
      institutionName: '',
      yearOfPassing: '',
      specialization: '',
      additionalCertifications: '',
    },
  ],
  workExperiences: [
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
  currentEmploymentStatus: '',
  skills: '',
  idProofType: '',
  idProofNumber: '',
  governmentIdProofName: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
});

export const mapUserProfileToEditForm = (userProfile = {}) => ({
  ...createEmptyCustomerProfileForm(),
  firstName: userProfile.firstName || '',
  lastName: userProfile.lastName || '',
  email: userProfile.email || '',
  phone: userProfile.phone || '',
  dateOfBirth: userProfile.dateOfBirth || '',
  gender: String(userProfile.gender || '').toLowerCase(),
  educationQualifications: [
    {
      highestQualification: userProfile.highestQualification || '',
      institutionName: userProfile.institutionName || '',
      yearOfPassing: userProfile.yearOfPassing != null ? String(userProfile.yearOfPassing) : '',
      specialization: userProfile.specialization || '',
      additionalCertifications: userProfile.additionalCertifications || '',
    },
  ],
  currentEmploymentStatus: userProfile.currentEmploymentStatus || '',
  skills: userProfile.skills || '',
  idProofType: userProfile.idProofType || '',
  idProofNumber: userProfile.idProofNumber || '',
  address: userProfile.address || '',
  city: userProfile.city || '',
  state: userProfile.state || '',
  pincode: userProfile.pincode != null ? String(userProfile.pincode) : '',
  country: userProfile.country || 'India',
});

export const mapUserProfileToAccountProfile = (userProfile = {}) => ({
  fullName: [userProfile.firstName, userProfile.lastName].filter(Boolean).join(' '),
  gender: userProfile.gender || '',
  dob: userProfile.dateOfBirth || '',
  phone: userProfile.phone || '',
  email: userProfile.email || '',
  address1: userProfile.address || '',
  address2: '',
  city: userProfile.city || '',
  state: userProfile.state || '',
  postalCode: userProfile.pincode != null ? String(userProfile.pincode) : '',
  country: userProfile.country || 'India',
  veg: true,
  newsletter: false,
});

export const mapEditFormToUserProfilePayload = (formData) => {
  const primaryEducation = formData.educationQualifications?.[0] || {};

  return {
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    email: formData.email.trim(),
    phone: formData.phone.trim(),
    dateOfBirth: formData.dateOfBirth || null,
    gender: formData.gender || null,
    highestQualification: primaryEducation.highestQualification || null,
    institutionName: primaryEducation.institutionName?.trim() || null,
    yearOfPassing: primaryEducation.yearOfPassing ? Number(primaryEducation.yearOfPassing) : null,
    specialization: primaryEducation.specialization?.trim() || null,
    additionalCertifications: primaryEducation.additionalCertifications?.trim() || null,
    currentEmploymentStatus: formData.currentEmploymentStatus || null,
    skills: formData.skills?.trim() || null,
    idProofType: formData.idProofType || null,
    idProofNumber: formData.idProofNumber?.trim() || null,
    address: formData.address?.trim() || null,
    city: formData.city?.trim() || null,
    state: formData.state?.trim() || null,
    pincode: formData.pincode ? Number(formData.pincode) : null,
    country: formData.country || 'India',
  };
};

export const syncCustomerProfileCache = (userProfile = {}) => {
  const accountProfile = mapUserProfileToAccountProfile(userProfile);

  localStorage.setItem('customerProfile', JSON.stringify(accountProfile));
  localStorage.setItem('customerPhone', accountProfile.phone || '');
  localStorage.setItem('customerEmail', accountProfile.email || '');
  localStorage.setItem('customerFullProfile', JSON.stringify(mapUserProfileToEditForm(userProfile)));
};
