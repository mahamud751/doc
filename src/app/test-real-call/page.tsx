"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { callingService, ActiveCall } from "@/lib/calling-service";
import { socketClient } from "@/lib/socket-client";

export default function TestRealCallPage() {
  const [patientId] = useState("patient_123");
  const [doctorId] = useState("doctor_456");
  const [patientName] = useState("John Patient");
  const [doctorName] = useState("Dr. Smith");
  const [outgoingCall, setOutgoingCall] = useState<ActiveCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<ActiveCall | null>(null);
  const [status, setStatus] = useState("Ready");
  const [isPatientMode, setIsPatientMode] = useState(true);

  useEffect(() => {
    // Connect to socket with user ID
    const userId = isPatientMode ? patientId : doctorId;
    const token = "test-token";
    socketClient.connect(token, userId);
    setStatus(`${isPatientMode ? "Patient" : "Doctor"} mode - Connected`);

    // Set up listeners for incoming calls
    const handleIncomingCall = (call: ActiveCall) => {
      console.log("Received incoming call:", call);
      // Only show modal if this user is the callee
      if (call.calleeId === userId) {
        setIncomingCall(call);
        setStatus("Incoming call");
      }
    };

    callingService.onIncomingCall(handleIncomingCall);

    // Set up listeners for call responses
    const handleCallResponse = (response: any) => {
      console.log("Received call response:", response);
      if (response.callerId === userId) {
        if (response.accepted) {
          setStatus("Call accepted");
          setOutgoingCall(null);
        } else {
          setStatus("Call rejected");
          setOutgoingCall(null);
        }
      }
    };

    callingService.onCallResponse(handleCallResponse);

    // Set up listeners for call ended
    const handleCallEnded = (callId: string) => {
      console.log("Call ended:", callId);
      setStatus("Call ended");
      setOutgoingCall(null);
      setIncomingCall(null);
    };

    callingService.onCallEnded(handleCallEnded);

    return () => {
      callingService.onIncomingCall(() => {});
      callingService.onCallResponse(() => {});
      callingService.onCallEnded(() => {});
    };
  }, [isPatientMode, patientId, doctorId]);

  const handleCall = async () => {
    const targetId = isPatientMode ? doctorId : patientId;
    const targetName = isPatientMode ? doctorName : patientName;
    const callerId = isPatientMode ? patientId : doctorId;
    const callerName = isPatientMode ? patientName : doctorName;

    setStatus(`Calling ${targetName}...`);

    const call = await callingService.initiateCall(
      {
        calleeId: targetId,
        calleeName: targetName,
        appointmentId: "test-appointment",
        channelName: "test-channel",
      },
      callerId,
      callerName
    );

    setOutgoingCall(call);
    setStatus("Calling...");
  };

  const handleAccept = () => {
    if (incomingCall) {
      callingService.acceptCall(
        incomingCall.callId,
        isPatientMode ? patientId : doctorId
      );
      setIncomingCall(null);
      setStatus("Call accepted");
    }
  };

  const handleReject = () => {
    if (incomingCall) {
      callingService.rejectCall(
        incomingCall.callId,
        isPatientMode ? patientId : doctorId
      );
      setIncomingCall(null);
      setStatus("Call rejected");
    }
  };

  const handleEndCall = () => {
    if (outgoingCall) {
      callingService.endCall(outgoingCall.callId);
      setOutgoingCall(null);
      setStatus("Call ended");
    } else if (incomingCall) {
      callingService.endCall(incomingCall.callId);
      setIncomingCall(null);
      setStatus("Call ended");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Test Real Call System
        </h1>

        <div className="mb-6">
          <Button
            onClick={() => setIsPatientMode(!isPatientMode)}
            className="bg-purple-500 hover:bg-purple-600"
          >
            Switch to {isPatientMode ? "Doctor" : "Patient"} Mode
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div
            className={`p-6 rounded-lg ${
              isPatientMode ? "bg-blue-50" : "bg-green-50"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">Current User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  User Type
                </label>
                <p className="mt-1 font-semibold">
                  {isPatientMode ? "Patient" : "Doctor"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  User ID
                </label>
                <p className="mt-1 font-semibold">
                  {isPatientMode ? patientId : doctorId}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <p className="mt-1 font-semibold">
                  {isPatientMode ? patientName : doctorName}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Target User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Target User Type
                </label>
                <p className="mt-1 font-semibold">
                  {isPatientMode ? "Doctor" : "Patient"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Target User ID
                </label>
                <p className="mt-1 font-semibold">
                  {isPatientMode ? doctorId : patientId}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Target Name
                </label>
                <p className="mt-1 font-semibold">
                  {isPatientMode ? doctorName : patientName}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Status: {status}</h2>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={handleCall}
              disabled={outgoingCall !== null || incomingCall !== null}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Call {isPatientMode ? "Doctor" : "Patient"}
            </Button>

            {incomingCall && (
              <div className="flex gap-2">
                <Button
                  onClick={handleAccept}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Accept Call
                </Button>
                <Button
                  onClick={handleReject}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Reject Call
                </Button>
              </div>
            )}

            {(outgoingCall || incomingCall) && (
              <Button
                onClick={handleEndCall}
                className="bg-red-500 hover:bg-red-600"
              >
                End Call
              </Button>
            )}
          </div>
        </div>

        {incomingCall && (
          <div className="mt-8 bg-red-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Incoming Call</h2>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="font-semibold">From: {incomingCall.callerName}</p>
              <p>User ID: {incomingCall.callerId}</p>
              <p>Appointment: {incomingCall.appointmentId}</p>
            </div>
          </div>
        )}

        {outgoingCall && (
          <div className="mt-8 bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Outgoing Call</h2>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="font-semibold">To: {outgoingCall.calleeName}</p>
              <p>User ID: {outgoingCall.calleeId}</p>
              <p>Appointment: {outgoingCall.appointmentId}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
