# Testing the Doctor-Patient Calling System

This document explains how to test the video calling system between doctors and patients.

## Prerequisites

1. Make sure the development server is running (`npm run dev`)
2. Open your browser to the application

## Testing Steps

### 1. Access the Test Page

Navigate to `/test-calling-system` in your browser.

### 2. Choose User Role

You'll be presented with two options:

- Sign in as Doctor
- Sign in as Patient

Click on one of these buttons to proceed.

### 3. Initiate a Call

After selecting a role:

1. You'll see your user information (ID and Name)
2. You'll see the target user information (the other party)
3. Click the "Call [Patient/Doctor]" button to initiate a call

### 4. Receive a Call (Simulated)

In the mock implementation:

- When you initiate a call, the system automatically simulates the other party receiving the call
- An incoming call modal will appear on the same page

### 5. Accept or Reject the Call

When the incoming call modal appears:

- Click the green phone button to accept the call
- Click the red phone button to reject the call

### 6. End the Call

During an active call:

- Click the red "End Call" button to end the call

## How It Works

### Global Calling System

The calling system works globally across all pages because:

1. The `GlobalIncomingCallHandler` component is included in the root layout (`app/layout.tsx`)
2. This ensures that incoming call notifications will appear on any page in the application

### Mock Implementation

The current implementation uses a mock socket system because:

1. It allows for frontend-only development without a backend WebSocket server
2. It simulates the real-time communication between users
3. In a production environment, this would be replaced with actual WebSocket connections

## Testing Doctor-to-Patient and Patient-to-Doctor Calls

### Doctor Calls Patient

1. Sign in as Doctor
2. Click "Call Patient"
3. The system simulates the patient receiving the call
4. Accept or reject the call to test the flow

### Patient Calls Doctor

1. Sign in as Patient
2. Click "Call Doctor"
3. The system simulates the doctor receiving the call
4. Accept or reject the call to test the flow

## Video Call Interface

When a call is accepted:

1. Both parties are redirected to the video call page (`/video-call`)
2. The video call page shows a mock interface
3. In a real implementation, this would connect to the Agora SDK

## Call Log

The test page includes a call log that shows:

- All call-related events with timestamps
- This helps visualize the calling flow

## Troubleshooting

### Incoming Call Modal Not Showing

If the incoming call modal doesn't appear:

1. Check the browser console for errors
2. Ensure the `GlobalIncomingCallHandler` is included in the layout
3. Verify that the calling service event listeners are properly set up

### Call Not Connecting

If calls aren't working properly:

1. Check that the mock socket implementation is functioning
2. Verify that event listeners are properly registered
3. Ensure the calling service methods are being called correctly

## Next Steps for Production

To implement this in a production environment:

1. Replace the mock socket implementation with a real WebSocket server
2. Implement proper Agora token generation on the backend
3. Add authentication and authorization for calls
4. Implement call history and logging
5. Add call quality monitoring
6. Implement proper error handling and user feedback
