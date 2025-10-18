# Doctor Consultation Platform

This is a telehealth platform built with Next.js that connects doctors and patients for remote consultations.

## Features

### For Doctors

- **Dashboard**: Overview of appointments, patients, and earnings
- **Appointment Management**: View and manage patient appointments
- **Patient List**: View all patients and their appointment history
- **Schedule Management**: Set and view availability
- **Prescription Creation**: Create and manage patient-centric prescriptions with PDF generation
- **Earnings Tracking**: Monitor income from consultations
- **Communication**: Receive patient messages and calls

### For Patients

- **Doctor Search**: Find doctors by specialty
- **Appointment Booking**: Schedule consultations
- **Video Consultations**: Real-time video calls with doctors
- **Prescription Access**: View and download prescriptions
- **Lab Test Ordering**: Order lab tests and packages
- **Medical Records**: Access medical history

### Technical Features

- Real-time video calling with Agora
- JWT-based authentication
- Responsive design for all devices
- PDF generation for prescriptions
- Database integration with Prisma

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Documentation

- [Doctor Patient List Feature](DOCTOR_PATIENT_LIST_FEATURE.md)
- [Doctor Schedule Feature](DOCTOR_SCHEDULE_FEATURE.md)
- [Doctor Prescription Feature](DOCTOR_PRESCRIPTION_FEATURE.md)
- [Modal Updates](MODAL_UPDATES.md)
- [Patient List Feature](PATIENT_LIST_FEATURE.md)
- [Prescription Feature](PRESCRIPTION_FEATURE.md)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
