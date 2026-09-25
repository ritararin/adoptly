## Project Summary

**Adoptly** is a web-based pet adoption platform that uses machine learning to help adopters find pets that are compatible with their lifestyle and living circumstances.

The system uses a **Random Forest Regression** model to generate a continuous compatibility score between an adopter and a pet based on attributes such as housing type, activity level, available care time, previous pet ownership experience, household composition, and pet characteristics. The predicted score is accompanied by **SHAP-based explanations** to help users understand the factors that contributed to the compatibility result.

Adoptly also provides user authentication, pet listing and management, adoption applications, shelter/admin verification, and virtual interview scheduling using **Google Meet**. The platform is designed to support both adopters looking for suitable pets and shelters managing pets and adoption applications.

### Key Technologies

- **Frontend:** React, Vite, Tailwind CSS
- **Authentication & Database:** Firebase Authentication and Firestore
- **Machine Learning:** Python, Scikit-learn, Random Forest Regression
- **Explainable AI:** SHAP / TreeSHAP
- **API:** Python REST API
- **Interview Scheduling:** Google Meet API
- **Version Control:** Git and GitHub

### Main Workflow

1. An adopter creates an account and provides their lifestyle and household information.
2. Shelters add pets and provide their relevant characteristics and requirements.
3. The system combines adopter and pet attributes and passes them to the Random Forest regression model.
4. SHAP is used to explain the main factors contributing to the predicted score.
5. The adopter can submit an adoption application for a suitable pet.
6. Shelter staff review and verify the application.
7. Where required, an online interview can be scheduled through Google Meet.

The goal of Adoptly is to provide a more structured and explainable approach to pet-adopter matching while giving shelters tools to manage pets, applications, verification, and interviews.
