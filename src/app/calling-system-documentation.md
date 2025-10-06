# Doctor-Patient Video Calling System

## Overview

This document explains how the doctor-patient video calling system works in the MediConnect platform. The system allows doctors and patients to initiate video calls with proper ringing and accept/reject functionality.

## System Components

### 1. Calling Service (`calling-service.ts`)

The calling service is the core of the calling system. It manages:

- Active calls tracking
- Call initiation
- Call acceptance/rejection
- Call ending
- Event handling

### 2. Socket Client (`socket-client.ts`)

The socket client handles real-time communication between users. In the current implementation, it uses a mock mode for frontend-only development.

### 3. Global Incoming Call Handler (`GlobalIncomingCallHandler.tsx`)

This component is included in the root layout to ensure incoming call notifications work on any page.

### 4. Incoming Call Modal (`IncomingCallModal.tsx`)

Displays the incoming call UI with accept/reject buttons.

## How It Works

### Doctor Calls Patient

1. Doctor initiates a call through the calling service
2. The call is emitted to the socket server
3. Patient receives the incoming call notification
4. Patient can accept or reject the call
5. If accepted, both parties are redirected to the video call page

### Patient Calls Doctor

1. Patient initiates a call through the calling service
2. The call is emitted to the socket server
3. Doctor receives the incoming call notification
4. Doctor can accept or reject the call
5. If accepted, both parties are redirected to the video call page

## Implementation Details

### Setting Up the System

1. The `GlobalIncomingCallHandler` component is included in the root layout (`app/layout.tsx`)
2. Each page that needs calling functionality imports the `callingService`
3. Event listeners are set up to handle incoming calls, responses, and call endings

### Initiating a Call

```typescript
const call = await callingService.initiateCall(
  {
    calleeId: targetUserId,
    calleeName: targetUserName,
    appointmentId: "appointment_123",
    channelName: "channel_123",
  },
  userId,
  userName
);
```

### Accepting a Call

```typescript
callingService.acceptCall(callId, userId);
```

### Rejecting a Call

```typescript
callingService.rejectCall(callId, userId);
```

### Ending a Call

```typescript
callingService.endCall(callId);
```

## Testing the System

To test the calling system:

1. Navigate to `/test-calling-system`
2. Choose to sign in as either Doctor or Patient
3. Click "Call Patient" (if signed in as Doctor) or "Call Doctor" (if signed in as Patient)
4. The other party will receive an incoming call notification
5. Accept or reject the call to test the functionality

## Future Improvements

1. Replace mock socket implementation with real WebSocket connection
2. Add call duration tracking
3. Implement call history
4. Add busy/reject tones
5. Improve UI/UX for the calling interface
