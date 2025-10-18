# Doctor Prescription Feature

This document describes the updated "Prescriptions" feature in the doctor dashboard, which allows doctors to create, manage, and generate PDF prescriptions for their patients in a patient-centric way.

## Overview

The prescription feature provides doctors with a patient-centric workflow for creating and managing prescriptions:

1. **Prescription List Tab**: Shows all prescriptions grouped by patient
2. **Patient List Integration**: Create prescriptions directly from the patient list
3. **Prescription Creation**: Form for creating new prescriptions with medications and lab tests
4. **PDF Generation**: Automatic generation and download of professional prescription PDFs

## Files Modified

1. [src/app/doctor/dashboard/page.tsx](file:///Users/pino/Documents/live/company/doc/src/app/doctor/dashboard/page.tsx) - Added prescriptions tab and PrescriptionsTab component
2. [src/components/doctor/PrescriptionCreator.tsx](file:///Users/pino/Documents/live/company/doc/src/components/doctor/PrescriptionCreator.tsx) - Existing component for creating prescriptions
3. [DOCTOR_PRESCRIPTION_FEATURE.md](file:///Users/pino/Documents/live/company/doc/DOCTOR_PRESCRIPTION_FEATURE.md) - This documentation file

## Component Features

### PrescriptionsTab Component

- **Tabbed Interface**: Integrated into the doctor dashboard navigation
- **Patient-Centric View**: Shows prescriptions grouped by patient
- **Create Prescription Button**: Opens the prescription creation form
- **PDF Download**: Download generated prescription PDFs
- **Responsive Design**: Works on all device sizes
- **Animated Transitions**: Smooth animations for UI interactions
- **Integration with Patient List**: Create prescriptions directly from patient list

### PrescriptionCreator Component

- **Patient Information**: Displays patient details
- **Diagnosis Field**: Required field for medical diagnosis
- **Medications Section**: Add multiple medications with dosage instructions
- **Lab Tests Section**: Add lab tests and packages
- **Instructions Fields**: General and follow-up instructions
- **PDF Generation**: Automatic PDF generation and download upon creation

### Data Structure

The feature uses the following data structures:

#### Prescription

- `id`: Unique identifier
- `appointment_id`: Reference to appointment
- `doctor_id`: Reference to doctor
- `patient_id`: Reference to patient
- `diagnosis`: Medical diagnosis
- `instructions`: General instructions
- `follow_up_instructions`: Follow-up instructions
- `drugs`: Array of prescribed medications
- `pdf_url`: URL to generated PDF
- `created_at`: Creation timestamp

#### Drug (Medication)

- `name`: Medicine name
- `dosage`: Dosage amount and unit
- `frequency`: How often to take
- `duration`: How long to take
- `instructions`: Additional instructions

#### Lab Test

- `name`: Test name
- `price`: Cost of test

## Implementation Details

### Data Fetching

- Uses the existing `/api/doctors/prescriptions` endpoint to fetch prescriptions
- Uses the existing `/api/doctors/prescriptions` endpoint to create new prescriptions
- Uses the existing `/api/prescriptions/[id]/generate-pdf` endpoint to generate PDFs
- Proper authentication with JWT tokens

### Responsive Design

- Uses the existing [ResponsiveComponents.tsx](file:///Users/pino/Documents/live/company/doc/src/components/ResponsiveComponents.tsx) for consistent UI
- Adapts to mobile and desktop views
- Touch-friendly interface

### Animations

- Uses Framer Motion for smooth transitions
- Hover effects on interactive elements
- Loading spinners for async operations

### Styling

- Consistent with existing application design
- Gradient backgrounds and rounded corners
- Professional medical interface

## API Integration

The feature integrates with the existing API endpoints:

1. Fetch prescriptions: `GET /api/doctors/prescriptions`
2. Create prescription: `POST /api/doctors/prescriptions`
3. Generate PDF: `GET /api/prescriptions/[id]/generate-pdf`

### Authentication

- Uses the existing JWT-based authentication system
- Validates doctor permissions for prescription operations
- Secure API calls with authorization headers

## Usage Workflow

To use the prescription feature:

### Method 1: From Patient List

1. Log in as a doctor
2. Navigate to the doctor dashboard (`/doctor/dashboard`)
3. Click on the "My Patients" tab in the sidebar
4. Find the patient you want to create a prescription for
5. Click "Create Prescription" next to the patient
6. The prescription form will open with the patient pre-selected
7. Fill in diagnosis and prescription details:
   - Add medications with dosage, frequency, and duration
   - Add lab tests if needed
   - Provide general instructions
   - Add follow-up instructions
8. Click "Create Prescription"
9. System generates a PDF and automatically downloads it
10. Switch to the "Prescriptions" tab to view the new prescription

### Method 2: From Prescriptions Tab

1. Log in as a doctor
2. Navigate to the doctor dashboard (`/doctor/dashboard`)
3. Click on the "Prescriptions" tab in the sidebar
4. View existing prescriptions grouped by patient
5. Click "Create Prescription" for a specific patient or the main button
6. Select a patient if not already selected
7. Fill in diagnosis and prescription details
8. Click "Create Prescription"
9. System generates a PDF and automatically downloads it
10. Prescription appears in the patient's prescription list

## Database Model

The feature uses the existing Prescription model in the Prisma schema:

```prisma
model Prescription {
  id                     String          @id @default(cuid())
  appointment_id         String          @unique
  doctor_id              String
  patient_id             String
  drugs                  Json[]          @default([])
  instructions           String?
  diagnosis              String?
  follow_up_instructions String?
  pdf_url                String?
  is_signed              Boolean         @default(false)
  digital_signature      String?
  created_at             DateTime        @default(now())
  updated_at             DateTime        @updatedAt
  pharmacy_orders        PharmacyOrder[]
  appointment            Appointment     @relation(fields: [appointment_id], references: [id], onDelete: Cascade)
  doctor_user            User            @relation("DoctorPrescriptions", fields: [doctor_id], references: [id], map: "prescription_doctor_user_fkey")
  patient_user           User            @relation("PatientPrescriptions", fields: [patient_id], references: [id], map: "prescription_patient_user_fkey")
  doctor_profile         DoctorProfile   @relation("DoctorProfilePrescriptions", fields: [doctor_id], references: [user_id], map: "prescription_doctor_profile_fkey")
}
```

## Future Enhancements

Possible improvements for future development:

1. Add search and filtering capabilities for prescriptions
2. Implement prescription templates for common conditions
3. Add medication interaction checking
4. Include prescription sharing via email or SMS
5. Add prescription history tracking
6. Implement prescription renewal functionality
7. Add integration with pharmacy systems
8. Include dosage calculators for pediatric patients
9. Add multilingual support for prescriptions
10. Implement prescription analytics and reporting

## Security Considerations

1. All API calls are authenticated with JWT tokens
2. Doctors can only access their own prescriptions
3. Patient data is protected and only accessible to authorized doctors
4. PDFs contain sensitive medical information and should be handled securely
5. All data transmission uses HTTPS encryption

## Error Handling

The feature includes proper error handling for:

1. Network errors during API calls
2. Authentication failures
3. Validation errors for required fields
4. PDF generation failures
5. Database errors
6. User-friendly error messages for all scenarios
