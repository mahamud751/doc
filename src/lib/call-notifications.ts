// src/lib/call-notifications.ts
// Simple notification system for call status updates (no real-time socket needed)

export interface CallNotification {
  id: string;
  type: "call-started" | "call-joined" | "call-ended" | "call-failed";
  title: string;
  message: string;
  appointmentId: string;
  timestamp: Date;
  read: boolean;
}

class CallNotificationService {
  private static instance: CallNotificationService;
  private notifications: CallNotification[] = [];
  private listeners: ((notification: CallNotification) => void)[] = [];

  private constructor() {}

  public static getInstance(): CallNotificationService {
    if (!CallNotificationService.instance) {
      CallNotificationService.instance = new CallNotificationService();
    }
    return CallNotificationService.instance;
  }

  /**
   * Add a new notification
   */
  public addNotification(
    type: CallNotification["type"],
    title: string,
    message: string,
    appointmentId: string
  ): void {
    const notification: CallNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      appointmentId,
      timestamp: new Date(),
      read: false,
    };

    this.notifications.unshift(notification);

    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    // Notify all listeners
    this.listeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (error) {
        console.error("Error in notification listener:", error);
      }
    });

    console.log("📢 NOTIFICATION:", notification);
  }

  /**
   * Listen for new notifications
   */
  public onNotification(
    listener: (notification: CallNotification) => void
  ): void {
    this.listeners.push(listener);
  }

  /**
   * Remove notification listener
   */
  public offNotification(
    listener: (notification: CallNotification) => void
  ): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Mark notification as read
   */
  public markAsRead(notificationId: string): void {
    const notification = this.notifications.find(
      (n) => n.id === notificationId
    );
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * Get all notifications
   */
  public getNotifications(): CallNotification[] {
    return [...this.notifications];
  }

  /**
   * Get unread notifications count
   */
  public getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  /**
   * Clear all notifications
   */
  public clearAll(): void {
    this.notifications = [];
  }

  /**
   * Notify when call starts
   */
  public notifyCallStarted(appointmentId: string, doctorName: string): void {
    this.addNotification(
      "call-started",
      "Video Call Started",
      `Your call with ${doctorName} has started`,
      appointmentId
    );
  }

  /**
   * Notify when someone joins the call
   */
  public notifyCallJoined(
    appointmentId: string,
    participantName: string
  ): void {
    this.addNotification(
      "call-joined",
      "Participant Joined",
      `${participantName} has joined the call`,
      appointmentId
    );
  }

  /**
   * Notify when call ends
   */
  public notifyCallEnded(appointmentId: string, duration?: string): void {
    this.addNotification(
      "call-ended",
      "Call Ended",
      duration ? `Call ended after ${duration}` : "Call has ended",
      appointmentId
    );
  }

  /**
   * Notify when call fails
   */
  public notifyCallFailed(appointmentId: string, error: string): void {
    this.addNotification(
      "call-failed",
      "Call Failed",
      `Unable to start call: ${error}`,
      appointmentId
    );
  }
}

export const callNotifications = CallNotificationService.getInstance();
