import React from 'react';
import { useParams } from 'react-router-dom';

const PetDetails = () => {
  const { petId } = useParams();

  return (
    <div className="pet-details-container">
      <h1>Pet Details</h1>
      <p>Pet ID: {petId}</p>
      
      <div className="pet-info">
        <img src="/placeholder-pet.jpg" alt="Pet" className="pet-image" />
        <div className="details">
          <h2>Pet Name</h2>
          <p><strong>Species:</strong> Dog</p>
          <p><strong>Breed:</strong> Breed Name</p>
          <p><strong>Age:</strong> 3 years</p>
          <p><strong>Description:</strong> A wonderful pet looking for a new home.</p>
          <button className="adopt-btn">Adopt This Pet</button>
        </div>
      </div>
    </div>
  );
};

export default PetDetails;
