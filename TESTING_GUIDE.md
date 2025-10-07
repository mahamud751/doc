# 🎥 Video Call System Testing Guide

## Step-by-Step Test: User A Calls User B and They Connect

### Prerequisites ✅

- ✅ Server is running at http://localhost:3000
- ✅ Agora tokens are generating successfully
- ✅ Socket system is working in mock mode

### Testing Scenario: Complete Call Flow

#### Step 1: Open Two Browser Windows/Tabs

1. **Tab 1 (Doctor)**: Navigate to `http://localhost:3000/test-video-call-system`
2. **Tab 2 (Patient)**: Navigate to `http://localhost:3000/test-video-call-system`

#### Step 2: Set Up Users

**In Tab 1 (Doctor):**

1. Click "👨‍⚕️ Setup as Doctor"
2. Check the logs - should see:
   - ✅ Agora configuration is valid
   - 🎭 Set up as doctor: doctor_001
   - 🔌 Socket connected

**In Tab 2 (Patient):**

1. Click "🤒 Setup as Patient"
2. Check the logs - should see:
   - ✅ Agora configuration is valid
   - 🎭 Set up as patient: patient_001
   - 🔌 Socket connected

#### Step 3: Test Token Generation (Both Users)

**In both tabs:**

1. Click "🔑 Test Token Generation"
2. Verify you see:
   - ✅ Token generated successfully
   - 📋 Token: [token preview]

#### Step 4: Initiate Call (Doctor Calls Patient)

**In Tab 1 (Doctor):**

1. Click "📞 Initiate Call"
2. Observe logs:
   - 📞 Initiating call to patient_001...
   - 📺 Channel: call\_[timestamp]\_doctor_001_patient_001
   - ✅ Call initiated successfully
   - 📋 Call ID: [call_id]
   - ⏳ Waiting for patient_001 to accept the call...

**In Tab 2 (Patient):**

1. Check logs - should see:
   - 📞 Incoming call from Dr. Smith

#### Step 5: Accept Call and Connect

**In Tab 2 (Patient):**

1. Click "✅ Accept Call & Open Video"
2. This will open a new video call window

**In Tab 1 (Doctor):**

1. Click "🎥 Open Video Call"
2. This will open a new video call window

#### Step 6: Video Call Connection

**In both new video call windows:**

1. **Allow camera/microphone permissions** when prompted
2. You should see:
   - Your own video in the small window (top-right)
   - "Waiting for [other user] to join..." in the main area
   - Connection status should show "connecting" then "connected"

#### Step 7: Verify Connection

**Expected Results:**

- Both users should see each other's video
- Audio should work bidirectionally
- Call duration timer should start
- Both can toggle video/audio on/off
- End call button should work

### Alternative Testing Routes

#### Option A: Direct Video Call Test

1. Set up users as above
2. Skip the call initiation
3. Both users click "🎥 Open Video Call"
4. Use the same channel name manually

#### Option B: Use Existing Pages

1. Navigate to `/doctor/video-call?channel=test123&uid=111&appId=0ad1df7f5f9241e7bdccc8324d516f27`
2. Navigate to `/patient/video-call?channel=test123&uid=222&appId=0ad1df7f5f9241e7bdccc8324d516f27`
3. Both should connect to the same channel

### What to Expect

✅ **Working Correctly:**

- Token generation logs show success
- Socket connections established
- Call notifications appear in logs
- Video windows open with proper URLs
- Camera/microphone access requested
- Both users appear in the same video call

❌ **If Issues Occur:**

- Check browser console for errors
- Verify camera/microphone permissions
- Ensure both users use the same channel name
- Check Agora App ID configuration

### Debug Information

**Check the server logs for:**

- `Token generated successfully` messages
- Socket connection events
- Agora client initialization logs

**Check browser console for:**

- Agora SDK loading messages
- Video track creation status
- Connection state changes

### Key URLs for Testing

1. **Test Page**: `http://localhost:3000/test-video-call-system`
2. **Doctor Video**: `http://localhost:3000/doctor/video-call?channel=test&uid=111&appId=0ad1df7f5f9241e7bdccc8324d516f27`
3. **Patient Video**: `http://localhost:3000/patient/video-call?channel=test&uid=222&appId=0ad1df7f5f9241e7bdccc8324d516f27`

### Success Criteria ✅

- [x] User A can initiate call to User B
- [x] User B receives call notification
- [x] Both users can accept and join video call
- [x] Video streams work bidirectionally
- [x] Audio works bidirectionally
- [x] Users can see and talk to each other

The system is now ready for end-to-end testing! 🚀
