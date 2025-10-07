import { NextRequest, NextResponse } from "next/server";

// Simple in-memory event store for real-time events
interface RealTimeEvent {
  id: string;
  userId: string;
  eventType: string;
  data: any;
  timestamp: number;
  processed?: boolean;
}

// In-memory event store (in production, use Redis or database)
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
    const recentEvents = userEvents.filter((event) => event.timestamp > since);

    console.log(
      `[EVENT STORE] Retrieved ${recentEvents.length} events for user ${userId} since ${since}`
    );
    return recentEvents;
  }

  public clearOldEvents(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    this.events.forEach((events, userId) => {
      const filteredEvents = events.filter(
        (event) => event.timestamp > oneHourAgo
      );
      this.events.set(userId, filteredEvents);
    });
  }
}

const eventStore = EventStore.getInstance();

// Clean old events every 10 minutes
setInterval(() => {
  eventStore.clearOldEvents();
}, 10 * 60 * 1000);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const since = parseInt(searchParams.get("since") || "0");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const events = eventStore.getEvents(userId, since);

    return NextResponse.json(events);
  } catch (error) {
    console.error("[REAL-TIME API] Poll error:", error);
    return NextResponse.json({ error: "Poll failed" }, { status: 500 });
  }
}
