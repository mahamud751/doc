import { NextRequest, NextResponse } from "next/server";

// Simple in-memory tracking for demo purposes
// In production, you'd use a database or Redis
const channelParticipants = new Map<
  string,
  Array<{
    uid: number;
    role: string;
    joinTime: Date;
  }>
>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel");

    if (!channel) {
      return NextResponse.json(
        { error: "Channel name is required" },
        { status: 400 }
      );
    }

    const participants = channelParticipants.get(channel) || [];

    return NextResponse.json({
      success: true,
      channel,
      participants: participants.map((p) => ({
        uid: p.uid,
        role: p.role,
        joinTime: p.joinTime,
      })),
      participantCount: participants.length,
    });
  } catch (error) {
    console.error("Error getting channel status:", error);
    return NextResponse.json(
      { error: "Failed to get channel status" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { channel, uid, role, action } = await request.json();

    if (!channel || !uid || !role || !action) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const participants = channelParticipants.get(channel) || [];

    if (action === "join") {
      // Add participant if not already present
      const existingIndex = participants.findIndex((p) => p.uid === uid);
      if (existingIndex === -1) {
        participants.push({
          uid,
          role,
          joinTime: new Date(),
        });
        channelParticipants.set(channel, participants);
        console.log(`✅ User ${uid} (${role}) joined channel ${channel}`);
      }
    } else if (action === "leave") {
      // Remove participant
      const filteredParticipants = participants.filter((p) => p.uid !== uid);
      channelParticipants.set(channel, filteredParticipants);
      console.log(`👋 User ${uid} (${role}) left channel ${channel}`);
    }

    return NextResponse.json({
      success: true,
      channel,
      action,
      participantCount: channelParticipants.get(channel)?.length || 0,
    });
  } catch (error) {
    console.error("Error updating channel status:", error);
    return NextResponse.json(
      { error: "Failed to update channel status" },
      { status: 500 }
    );
  }
}
