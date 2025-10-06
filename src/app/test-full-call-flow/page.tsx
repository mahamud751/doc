"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { callingService, ActiveCall } from "@/lib/calling-service";
import { socketClient } from "@/lib/socket-client";

export default function TestFullCallFlowPage() {
  const [step, setStep] = useState(0); // 0: setup, 1: doctor calls patient, 2: patient receives call, 3: patient accepts, 4: call connected
  const [callLog, setCallLog] = useState<string[]>([]);
  const [doctorCall, setDoctorCall] = useState<ActiveCall | null>(null);
  const [patientIncomingCall, setPatientIncomingCall] = useState<ActiveCall | null>(null);

  useEffect(() => {
    // Connect both users to socket
    const token = "test-token";
    socketClient.connect(token);
    
    // Set up listeners for doctor
    const handleDoctorCallResponse = (response: any) => {
      if (response.callerId === "doctor_123") {
        if (response.accepted) {
          addToLog("Doctor: Call accepted by patient");
          setStep(4); // Call connected
        } else {
          addToLog("Doctor: Call rejected by patient");
          setStep(1); // Back to calling step
          setDoctorCall(null);
        }
      }
    };
    
    callingService.onCallResponse(handleDoctorCallResponse);
    
    // Set up listeners for patient
    const handlePatientIncomingCall = (call: ActiveCall) => {
      if (call.calleeId === "patient_456") {
        addToLog(`Patient: Incoming call from ${call.callerName}`);
        setPatientIncomingCall(call);
        setStep(2); // Patient receives call
      }
    };
    
    callingService.onIncomingCall(handlePatientIncomingCall);
    
    return () => {
      callingService.onCallResponse(() => {});
      callingService.onIncomingCall(() => {});
    };
  }, []);

  const addToLog = (message: string) => {
    setCallLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleDoctorCallPatient = async () => {
    addToLog("Doctor: Calling patient...");
    
    const call = await callingService.initiateCall(
      {
        calleeId: "patient_456",
        calleeName: "John Doe",
        appointmentId: "appointment_789",
        channelName: "channel_789",
      },
      "doctor_123",
      "Dr. Smith"
    );
    
    setDoctorCall(call);
    setStep(1); // Doctor is calling
    addToLog("Doctor: Call initiated");
  };

  const handlePatientAcceptCall = () => {
    if (patientIncomingCall) {
      callingService.acceptCall(patientIncomingCall.callId, "patient_456");
      addToLog("Patient: Accepted call");
      setPatientIncomingCall(null);
    }
  };

  const handlePatientRejectCall = () => {
    if (patientIncomingCall) {
      callingService.rejectCall(patientIncomingCall.callId, "patient_456");
      addToLog("Patient: Rejected call");
      setPatientIncomingCall(null);
      setStep(1); // Back to calling step
      setDoctorCall(null);
    }
  };

  const handleDoctorEndCall = () => {
    if (doctorCall) {
      callingService.endCall(doctorCall.callId);
      addToLog("Doctor: Ended call");
      setDoctorCall(null);
      setStep(0); // Back to setup
    }
  };

  const resetTest = () => {
    setStep(0);
    setDoctorCall(null);
    setPatientIncomingCall(null);
    setCallLog([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8">Full Doctor-Patient Call Flow Test</h1>
        
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Test Scenario</h2>
          <p className="text-gray-700">
            This test simulates a complete calling flow between a doctor and patient using the mock socket system.
          </p>
        </div>
        
        {/* Step 0: Setup */}
        {step === 0 && (
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-4">Step 1: Setup</h2>
            <p className="mb-4">Both doctor and patient are connected to the system.</p>
            <Button 
              onClick={handleDoctorCallPatient}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Doctor Calls Patient
            </Button>
          </div>
        )}
        
        {/* Step 1: Doctor calling */}
        {step === 1 && (
          <div className="bg-blue-50 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-4">Step 2: Doctor Calling Patient</h2>
            <p className="mb-4">Doctor has initiated a call to the patient. Patient should receive an incoming call notification.</p>
            <div className="bg-white p-4 rounded-lg shadow mb-4">
              <p className="font-semibold">Call Details:</p>
              <p>To: John Doe (patient_456)</p>
              <p>Appointment: appointment_789</p>
            </div>
            <Button 
              onClick={handleDoctorEndCall}
              className="bg-red-500 hover:bg-red-600"
            >
              Doctor Ends Call
            </Button>
          </div>
        )}
        
        {/* Step 2: Patient receives call */}
        {step === 2 && (
          <div className="bg-green-50 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-4">Step 3: Patient Receives Call</h2>
            <p className="mb-4">Patient has received an incoming call from Dr. Smith.</p>
            <div className="bg-white p-4 rounded-lg shadow mb-4">
              <p className="font-semibold">Incoming Call:</p>
              <p>From: Dr. Smith (doctor_123)</p>
              <p>Appointment: appointment_789</p>
            </div>
            <div className="flex gap-4">
              <Button 
                onClick={handlePatientAcceptCall}
                className="bg-green-500 hover:bg-green-600"
              >
                Patient Accepts Call
              </Button>
              <Button 
                onClick={handlePatientRejectCall}
                className="bg-red-500 hover:bg-red-600"
              >
                Patient Rejects Call
              </Button>
            </div>
          </div>
        )}
        
        {/* Step 3: Call connected */}
        {step === 4 && (
          <div className="bg-purple-50 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-4">Step 4: Call Connected</h2>
            <p className="mb-4">The call has been successfully connected between doctor and patient.</p>
            <div className="bg-white p-4 rounded-lg shadow mb-4">
              <p className="font-semibold">Active Call:</p>
              <p>Doctor: Dr. Smith (doctor_123)</p>
              <p>Patient: John Doe (patient_456)</p>
              <p>Appointment: appointment_789</p>
            </div>
            <Button 
              onClick={handleDoctorEndCall}
              className="bg-red-500 hover:bg-red-600"
            >
              End Call
            </Button>
          </div>
        )}
        
        <div className="bg-yellow-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Call Log</h2>
          <div className="bg-white p-4 rounded-lg shadow h-64 overflow-y-auto">
            {callLog.length === 0 ? (
              <p className="text-gray-500">No events yet...</p>
            ) : (
              <ul className="space-y-2">
                {callLog.map((log, index) => (
                  <li key={index} className="text-sm font-mono">{log}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <Button 
            onClick={resetTest}
            className="bg-gray-500 hover:bg-gray-600"
          >
            Reset Test
          </Button>
        </div>
      </div>
    </div>
  );
}