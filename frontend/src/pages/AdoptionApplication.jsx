import React, { useState } from 'react';

export default function AdoptionApplication() {
  const [formData, setFormData] = useState({
    petName: '',
    applicantName: '',
    email: '',
    phone: '',
    address: '',
    adoptionReason: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Application submitted:', formData);
    // TODO: Send application to backend
  };

  return (
    <div className="adoption-application">
      <h1>Pet Adoption Application</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="petName">Pet Name:</label>
          <input
            type="text"
            id="petName"
            name="petName"
            value={formData.petName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="applicantName">Your Name:</label>
          <input
            type="text"
            id="applicantName"
            name="applicantName"
            value={formData.applicantName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone:</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="address">Address:</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="adoptionReason">Why do you want to adopt?</label>
          <textarea
            id="adoptionReason"
            name="adoptionReason"
            value={formData.adoptionReason}
            onChange={handleChange}
            rows="4"
            required
          />
        </div>

        <button type="submit">Submit Application</button>
      </form>
    </div>
  );
}
