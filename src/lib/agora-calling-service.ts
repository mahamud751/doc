// src/lib/agora-calling-service.ts
// Simplified calling service using only Agora SDK - no socket.io needed

export interface CallSession {
  callId: string;
  channelName: string;
  appointmentId: string;
  callerId: string;
  callerName: string;
  calleeId: string;
  calleeName: string;
  status: "initiating" | "calling" | "connected" | "ended";
  startTime?: Date;
  endTime?: Date;
}

export interface CallParticipant {
  userId: string;
  userName: string;
  userRole: "patient" | "doctor";
}

class AgoraCallingService {
  private static instance: AgoraCallingService;
  private activeSessions: Map<string, CallSession> = new Map();
  private currentSession: CallSession | null = null;

  private constructor() {}

  public static getInstance(): AgoraCallingService {
    if (!AgoraCallingService.instance) {
      AgoraCallingService.instance = new AgoraCallingService();
    }
    return AgoraCallingService.instance;
  }

  /**
   * Generate Agora token for video call
   */
  public async generateAgoraToken(
    channelName: string,
    uid: number,
    userRole: "patient" | "doctor"
  ): Promise<{
    token: string;
    appId: string;
    channelName: string;
    uid: number;
  }> {
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("Authentication required");
      }

      console.log("🎥 AGORA: Generating token for", {
        channelName,
        uid,
        userRole,
      });

      const response = await fetch("/api/agora/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          channelName,
          uid,
          role: userRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP ${response.status}: Token generation failed`
        );
      }

      const tokenData = await response.json();
      console.log("🎥 AGORA: Token generated successfully");

      return {
        token: tokenData.token,
        appId: tokenData.appId,
        channelName,
        uid,
      };
    } catch (error) {
      console.error("🎥 AGORA: Token generation failed:", error);
      throw error;
    }
  }

  /**
   * Create a new call session
   */
  public createCallSession(
    appointmentId: string,
    caller: CallParticipant,
    callee: CallParticipant
  ): CallSession {
    const callId = `call_${Date.now()}_${caller.userId}_${callee.userId}`;
    const channelName = `appointment_${appointmentId}`;

    const session: CallSession = {
      callId,
      channelName,
      appointmentId,
      callerId: caller.userId,
      callerName: caller.userName,
      calleeId: callee.userId,
      calleeName: callee.userName,
      status: "initiating",
    };

    this.activeSessions.set(callId, session);
    this.currentSession = session;

    console.log("📞 AGORA CALLING: Created session", session);
    return session;
  }

  /**
   * Start a video call (Patient initiates to Doctor)
   */
  public async startVideoCall(
    appointmentId: string,
    doctorId: string,
    doctorName: string
  ): Promise<{
    callSession: CallSession;
    callUrl: string;
  }> {
    try {
      const patientId = localStorage.getItem("userId");
      const patientName = localStorage.getItem("userName");

      if (!patientId || !patientName) {
        throw new Error("Patient authentication required");
      }

      console.log("📞 AGORA CALLING: Patient starting call to doctor", {
        appointmentId,
        doctorId,
        doctorName,
        patientId,
        patientName,
      });

      // Create call session
      const session = this.createCallSession(
        appointmentId,
        { userId: patientId, userName: patientName, userRole: "patient" },
        { userId: doctorId, userName: doctorName, userRole: "doctor" }
      );

      // Generate Agora token
      const uid = Math.floor(Math.random() * 1000000);
      const tokenData = await this.generateAgoraToken(
        session.channelName,
        uid,
        "patient"
      );

      // Create call URL
      const callUrl = `/patient/video-call?channel=${encodeURIComponent(
        session.channelName
      )}&token=${encodeURIComponent(
        tokenData.token
      )}&uid=${uid}&appId=${encodeURIComponent(tokenData.appId)}&callId=${
        session.callId
      }&appointmentId=${appointmentId}`;

      // Update session status
      session.status = "calling";
      session.startTime = new Date();

      // 🔥 NEW: Notify doctor about incoming call via API
      await this.notifyDoctorOfIncomingCall(session);

      console.log("📞 AGORA CALLING: Call URL generated", callUrl);

      return {
        callSession: session,
        callUrl,
      };
    } catch (error) {
      console.error("📞 AGORA CALLING: Failed to start call:", error);
      throw error;
    }
  }

  /**
   * Join an existing video call (Doctor joins after patient starts)
   */
  public async joinVideoCall(
    appointmentId: string,
    channelName?: string
  ): Promise<{
    callUrl: string;
    callSession?: CallSession;
  }> {
    try {
      const userId = localStorage.getItem("userId");
      const userName = localStorage.getItem("userName");
      const userRole = localStorage.getItem("userRole");

      if (!userId || !userName || !userRole) {
        throw new Error("User authentication required");
      }

      console.log("📞 AGORA CALLING: User joining call", {
        appointmentId,
        channelName,
        userId,
        userName,
        userRole,
      });

      // Use provided channel name or generate from appointment
      const finalChannelName = channelName || `appointment_${appointmentId}`;

      // Look for existing session with this channel
      let existingSession = this.getSessionByChannel(finalChannelName);

      if (existingSession) {
        console.log(
          "📞 AGORA CALLING: Found existing session",
          existingSession
        );
        // Update session to show doctor has joined
        existingSession.status = "connected";
        this.currentSession = existingSession;
      } else {
        // Create new session if none exists (rare case)
        console.log("📞 AGORA CALLING: Creating new session for join");
        existingSession = this.createCallSession(
          appointmentId,
          {
            userId: "unknown_caller",
            userName: "Unknown Caller",
            userRole: "patient",
          },
          { userId, userName, userRole: userRole as "patient" | "doctor" }
        );
        existingSession.channelName = finalChannelName;
      }

      // Generate Agora token
      const uid = Math.floor(Math.random() * 1000000);
      const tokenData = await this.generateAgoraToken(
        finalChannelName,
        uid,
        userRole as "patient" | "doctor"
      );

      // Create call URL based on user role
      const callUrl =
        userRole === "DOCTOR"
          ? `/doctor/video-call?channel=${encodeURIComponent(
              finalChannelName
            )}&token=${encodeURIComponent(
              tokenData.token
            )}&uid=${uid}&appId=${encodeURIComponent(
              tokenData.appId
            )}&appointmentId=${appointmentId}&callId=${existingSession.callId}`
          : `/patient/video-call?channel=${encodeURIComponent(
              finalChannelName
            )}&token=${encodeURIComponent(
              tokenData.token
            )}&uid=${uid}&appId=${encodeURIComponent(
              tokenData.appId
            )}&appointmentId=${appointmentId}&callId=${existingSession.callId}`;

      console.log("📞 AGORA CALLING: Join URL generated", callUrl);

      return { callUrl, callSession: existingSession };
    } catch (error) {
      console.error("📞 AGORA CALLING: Failed to join call:", error);
      throw error;
    }
  }

  /**
   * End a call session and notify other participants
   */
  public async endCall(callId: string): Promise<void> {
    const session = this.activeSessions.get(callId);
    if (session) {
      session.status = "ended";
      session.endTime = new Date();

      console.log("📞 AGORA CALLING: Ending call", session);

      // Notify other participants via API
      await this.notifyCallEnded(session);

      // Remove from active sessions after a delay
      setTimeout(() => {
        this.activeSessions.delete(callId);
        if (this.currentSession?.callId === callId) {
          this.currentSession = null;
        }
      }, 1000); // Reduced delay for faster cleanup
    }
  }

  /**
   * Notify all participants that call has ended
   */
  private async notifyCallEnded(session: CallSession): Promise<void> {
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        console.warn("📞 AGORA CALLING: No auth token for end notification");
        return;
      }

      console.log("📞 AGORA CALLING: Notifying call end", {
        callId: session.callId,
        participants: [session.callerId, session.calleeId],
      });

      const response = await fetch("/api/agora/end-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          callId: session.callId,
          callerId: session.callerId,
          calleeId: session.calleeId,
          appointmentId: session.appointmentId,
        }),
      });

      if (!response.ok) {
        console.error(
          "📞 AGORA CALLING: Failed to notify call end:",
          response.status
        );
      } else {
        console.log(
          "📞 AGORA CALLING: Call end notification sent successfully"
        );
      }
    } catch (error) {
      console.error("📞 AGORA CALLING: Error notifying call end:", error);
    }
  }

  /**
   * Get call session by channel name (for joining existing calls)
   */
  public getSessionByChannel(channelName: string): CallSession | undefined {
    return Array.from(this.activeSessions.values()).find(
      (session) => session.channelName === channelName
    );
  }

  /**
   * Get current active session
   */
  public getCurrentSession(): CallSession | null {
    return this.currentSession;
  }

  /**
   * Get session by ID
   */
  public getSession(callId: string): CallSession | undefined {
    return this.activeSessions.get(callId);
  }

  /**
   * Get all active sessions for a user
   */
  public getUserSessions(userId: string): CallSession[] {
    return Array.from(this.activeSessions.values()).filter(
      (session) => session.callerId === userId || session.calleeId === userId
    );
  }

  /**
   * Check if user is in any active call
   */
  public isUserInCall(userId: string): boolean {
    return this.getUserSessions(userId).some(
      (session) =>
        session.status === "calling" || session.status === "connected"
    );
  }

  /**
   * Notify doctor about incoming call via API
   */
  private async notifyDoctorOfIncomingCall(
    session: CallSession
  ): Promise<void> {
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        console.warn("📞 AGORA CALLING: No auth token for notification");
        return;
      }

      console.log("📞 AGORA CALLING: Notifying doctor of incoming call", {
        callId: session.callId,
        doctorId: session.calleeId,
        patientName: session.callerName,
      });

      const response = await fetch("/api/agora/notify-incoming-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          callId: session.callId,
          callerId: session.callerId,
          callerName: session.callerName,
          calleeId: session.calleeId,
          calleeName: session.calleeName,
          channelName: session.channelName,
          appointmentId: session.appointmentId,
        }),
      });

      if (!response.ok) {
        console.error(
          "📞 AGORA CALLING: Failed to notify doctor:",
          response.status
        );
      } else {
        console.log("📞 AGORA CALLING: Doctor notification sent successfully");
      }
    } catch (error) {
      console.error("📞 AGORA CALLING: Error notifying doctor:", error);
    }
  }
}

export const agoraCallingService = AgoraCallingService.getInstance();
