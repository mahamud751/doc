import { NextRequest, NextResponse } from "next/server";

interface CallEndNotification {
  callId: string;
  callerId: string;
  calleeId: string;
  appointmentId: string;
}

// Store call end notifications in memory (in production, use Redis or database)
const callEndNotifications = new Map<string, CallEndNotification[]>();

export async function POST(request: NextRequest) {
  try {
    console.log("📞 API: Call end notification received");
    
    const callData = await request.json() as CallEndNotification;
    
    console.log("📞 API: Call end data", {
      callId: callData.callId,
      participants: [callData.callerId, callData.calleeId],
    });

    // Validate required fields
    if (!callData.callId || !callData.callerId || !callData.calleeId) {
      return NextResponse.json(
        { error: "Missing required call data" },
        { status: 400 }
      );
    }

    // Notify both participants
    const participants = [callData.callerId, callData.calleeId];
    
    participants.forEach(participantId => {
      const participantNotifications = callEndNotifications.get(participantId) || [];
      
      // Add notification (avoid duplicates)
      const existingIndex = participantNotifications.findIndex(n => n.callId === callData.callId);
      if (existingIndex === -1) {
        participantNotifications.push(callData);
        callEndNotifications.set(participantId, participantNotifications);
        
        console.log(`📞 API: Added call end notification for user ${participantId}`, {
          callId: callData.callId,
          totalNotifications: participantNotifications.length,
        });
      }
    });

    // Clean up from incoming calls API if it exists
    try {
      const response = await fetch(`${request.nextUrl.origin}/api/agora/notify-incoming-call?doctorId=${encodeURIComponent(callData.calleeId)}&callId=${encodeURIComponent(callData.callId)}`, {
        method: "DELETE",
      });
      if (response.ok) {
        console.log("📞 API: Cleaned up incoming call notification");
      }
    } catch (error) {
      console.log("📞 API: Could not clean up incoming call (this is normal)");
    }

    return NextResponse.json({ 
      success: true, 
      message: "Call end notifications sent",
      callId: callData.callId 
    });
    
  } catch (error) {
    console.error("📞 API: Error processing call end notification:", error);
    
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
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    console.log(`📞 API: Fetching call end notifications for user ${userId}`);
    
    const userNotifications = callEndNotifications.get(userId) || [];
    
    console.log(`📞 API: Found ${userNotifications.length} call end notifications for user ${userId}`);
    
    // Clear notifications after fetching (they're one-time events)
    if (userNotifications.length > 0) {
      callEndNotifications.set(userId, []);
    }
    
    return NextResponse.json({
      success: true,
      notifications: userNotifications,
      count: userNotifications.length
    });
    
  } catch (error) {
    console.error("📞 API: Error fetching call end notifications:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch notifications",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}