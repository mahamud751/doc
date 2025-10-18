# Patient List with Appointments Feature

This document describes the new Patient List with Appointments feature that displays patient data in a tabbed table format.

## Overview

The feature provides a comprehensive view of patients and their appointment history in a tabbed interface:

1. **Patient List Tab**: Shows all patients in a table format with key information
2. **Appointment List Tab**: Shows all appointments with detailed information

## Files Created

1. [src/components/patient/PatientListWithAppointments.tsx](file:///Users/pino/Documents/live/company/doc/src/components/patient/PatientListWithAppointments.tsx) - Main component with tabbed interface
2. [src/app/patient/list/page.tsx](file:///Users/pino/Documents/live/company/doc/src/app/patient/list/page.tsx) - Page to display the component
3. [PATIENT_LIST_FEATURE.md](file:///Users/pino/Documents/live/company/doc/PATIENT_LIST_FEATURE.md) - This documentation file

## Component Features

### PatientListWithAppointments Component

- **Tabbed Interface**: Toggle between patient list and appointment list views
- **Responsive Design**: Works on all device sizes
- **Animated Transitions**: Smooth animations when switching tabs and loading data
- **Mock Data**: Currently uses mock data for demonstration (can be connected to real API)
- **Status Indicators**: Visual indicators for appointment statuses
- **Action Buttons**: Interactive buttons for managing patients/appointments

### Data Structure

The component uses the following data structures:

#### Patient

- `id`: Unique identifier
- `name`: Patient's full name
- `email`: Contact email
- `phone`: Contact phone number
- `date_of_birth`: Date of birth
- `gender`: Gender
- `blood_group`: Blood group
- `address`: Full address

#### Appointment

- `id`: Unique identifier
- `patient_id`: Reference to patient
- `doctor`: Doctor information
- `scheduled_at`: Appointment date and time
- `meeting_type`: Type of consultation
- `status`: Current status (PENDING, CONFIRMED, COMPLETED, CANCELLED)
- `payment_amount`: Cost of appointment
- `symptoms`: Reported symptoms
- `diagnosis`: Doctor's diagnosis

## Implementation Details

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
- Status-specific color coding

## Integration with Existing System

To connect this component to your real data:

1. Replace the mock data in `fetchPatientsWithAppointments()` with actual API calls
2. Update the API endpoints to match your backend
3. Adjust the data structures to match your database schema

Example API integration:

```typescript
const response = await fetch("/api/patients?include=appointments", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
const data = await response.json();
setPatients(data);
```

## Usage

To access this feature:

1. Navigate to `/patient/list` in your application
2. Toggle between "Patient List" and "Appointment List" tabs
3. View detailed information in the table format

## Future Enhancements

Possible improvements for future development:

1. Add search and filtering capabilities
2. Implement pagination for large datasets
3. Add sorting options for table columns
4. Connect to real API endpoints
5. Add edit/delete functionality for patients and appointments
6. Implement appointment scheduling directly from this interface
