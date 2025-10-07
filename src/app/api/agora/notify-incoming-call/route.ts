import { NextRequest, NextResponse } from "next/server";

interface IncomingCallNotification {
  callId: string;
  callerId: string;
  callerName: string;
  calleeId: string;
  calleeName: string;
  channelName: string;
  appointmentId: string;
}

// Store active incoming calls in memory (in production, use Redis or database)
const incomingCalls = new Map<string, IncomingCallNotification[]>();

export async function POST(request: NextRequest) {
  try {
    console.log("📞 API: Incoming call notification received");
    
    const callData = await request.json() as IncomingCallNotification;
    
    console.log("📞 API: Call notification data", {
      callId: callData.callId,
      from: callData.callerName,
      to: callData.calleeName,
      doctorId: callData.calleeId,
    });

    // Validate required fields
    if (!callData.callId || !callData.calleeId || !callData.callerName) {
      return NextResponse.json(
        { error: "Missing required call data" },
        { status: 400 }
      );
    }

    // Store the notification for the doctor
    const doctorId = callData.calleeId;
    const doctorCalls = incomingCalls.get(doctorId) || [];
    
    // Add new call (avoid duplicates)
    const existingCallIndex = doctorCalls.findIndex(call => call.callId === callData.callId);
    if (existingCallIndex === -1) {
      doctorCalls.push(callData);
      incomingCalls.set(doctorId, doctorCalls);
      
      console.log(`📞 API: Added incoming call for doctor ${doctorId}`, {
        callId: callData.callId,
        totalCalls: doctorCalls.length,
      });
    } else {
      console.log(`📞 API: Call ${callData.callId} already exists for doctor ${doctorId}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Doctor notified successfully",
      callId: callData.callId 
    });
    
  } catch (error) {
    console.error("📞 API: Error processing incoming call notification:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to process notification",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    
    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID required" },
        { status: 400 }
      );
    }

    console.log(`📞 API: Fetching incoming calls for doctor ${doctorId}`);
    
    const doctorCalls = incomingCalls.get(doctorId) || [];
    
    console.log(`📞 API: Found ${doctorCalls.length} incoming calls for doctor ${doctorId}`);
    
    return NextResponse.json({
      success: true,
      calls: doctorCalls,
      count: doctorCalls.length
    });
    
  } catch (error) {
    console.error("📞 API: Error fetching incoming calls:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch incoming calls",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const callId = searchParams.get("callId");
    
    if (!doctorId || !callId) {
      return NextResponse.json(
        { error: "Doctor ID and Call ID required" },
        { status: 400 }
      );
    }

    console.log(`📞 API: Removing call ${callId} for doctor ${doctorId}`);
    
    const doctorCalls = incomingCalls.get(doctorId) || [];
    const updatedCalls = doctorCalls.filter(call => call.callId !== callId);
    
    incomingCalls.set(doctorId, updatedCalls);
    
    console.log(`📞 API: Removed call ${callId}, remaining calls: ${updatedCalls.length}`);
    
    return NextResponse.json({
      success: true,
      message: "Call removed successfully",
      remainingCalls: updatedCalls.length
    });
    
  } catch (error) {
    console.error("📞 API: Error removing call:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to remove call",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}