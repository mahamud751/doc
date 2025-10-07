import { NextRequest, NextResponse } from "next/server";

// Import the same EventStore class
interface RealTimeEvent {
  id: string;
  userId: string;
  eventType: string;
  data: any;
  timestamp: number;
  processed?: boolean;
}

class EventStore {
  private static instance: EventStore;
  private events: Map<string, RealTimeEvent[]> = new Map();

  private constructor() {}

  public static getInstance(): EventStore {
    if (!EventStore.instance) {
      EventStore.instance = new EventStore();
    }
    return EventStore.instance;
  }

  public addEvent(userId: string, eventType: string, data: any): string {
    const eventId = `event_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const event: RealTimeEvent = {
      id: eventId,
      userId,
      eventType,
      data,
      timestamp: Date.now(),
    };

    if (!this.events.has(userId)) {
      this.events.set(userId, []);
    }

    this.events.get(userId)?.push(event);

    // Special handling for call-related events
    if (
      (eventType === "incoming-call" || eventType === "initiate-call") &&
      data.calleeId
    ) {
      // Route incoming-call event to the target user (calleeId)
      const targetUserId = data.calleeId;

      if (targetUserId !== userId) {
        if (!this.events.has(targetUserId)) {
          this.events.set(targetUserId, []);
        }

        // 🚨 CRITICAL FIX: For initiate-call events, also create an incoming-call event for the target
        const targetEventType =
          eventType === "initiate-call" ? "incoming-call" : eventType;

        this.events.get(targetUserId)?.push({
          ...event,
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: targetUserId,
          eventType: targetEventType, // Convert initiate-call to incoming-call for target
        });
        console.log(
          `[EVENT STORE] Routed ${eventType} to target user ${targetUserId} as ${targetEventType}`
        );

        // Also keep the original event for debugging
        if (eventType === "initiate-call") {
          this.events.get(targetUserId)?.push({
            ...event,
            id: `event_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            userId: targetUserId,
            eventType: "initiate-call", // Keep original for calling service bridge
          });
        }
      }
    }

    // Route call-response events to both caller and callee
    if (eventType === "call-response") {
      if (data.callerId && data.callerId !== userId) {
        if (!this.events.has(data.callerId)) {
          this.events.set(data.callerId, []);
        }
        this.events.get(data.callerId)?.push({
          ...event,
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: data.callerId,
        });
      }
      if (data.calleeId && data.calleeId !== userId) {
        if (!this.events.has(data.calleeId)) {
          this.events.set(data.calleeId, []);
        }
        this.events.get(data.calleeId)?.push({
          ...event,
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: data.calleeId,
        });
      }
    }

    // Route call-ended events to both caller and callee
    if (eventType === "call-ended") {
      if (data.callerId && data.callerId !== userId) {
        if (!this.events.has(data.callerId)) {
          this.events.set(data.callerId, []);
        }
        this.events.get(data.callerId)?.push({
          ...event,
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: data.callerId,
        });
      }
      if (data.calleeId && data.calleeId !== userId) {
        if (!this.events.has(data.calleeId)) {
          this.events.set(data.calleeId, []);
        }
        this.events.get(data.calleeId)?.push({
          ...event,
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: data.calleeId,
        });
      }
    }

    console.log(
      `[EVENT STORE] Added event ${eventType} for user ${userId}:`,
      data
    );
    return eventId;
  }

  public getEvents(userId: string, since: number = 0): RealTimeEvent[] {
    const userEvents = this.events.get(userId) || [];
    return userEvents.filter((event) => event.timestamp > since);
  }
}

const eventStore = EventStore.getInstance();

interface EmitRequest {
  userId: string;
  eventType: string;
  data: any;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, eventType, data }: EmitRequest = await request.json();

    if (!userId || !eventType) {
      return NextResponse.json(
        { error: "Missing userId or eventType" },
        { status: 400 }
      );
    }

    console.log(
      `[REAL-TIME API] Emitting event ${eventType} from user ${userId}:`,
      data
    );

    const eventId = eventStore.addEvent(userId, eventType, data);

    return NextResponse.json({
      success: true,
      eventId,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("[REAL-TIME API] Emit error:", error);
    return NextResponse.json({ error: "Emit failed" }, { status: 500 });
  }
}
