// localStorage utility with error handling
export class LocalStorageManager {
  static setItem(key: string, value: any): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Error saving to localStorage:", error);
      return false;
    }
  }

  static getItem<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return defaultValue;
    }
  }

  static removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Error removing from localStorage:", error);
      return false;
    }
  }

  static clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error("Error clearing localStorage:", error);
      return false;
    }
  }

  // User session management
  static saveUserSession(user: any, token: string): boolean {
    const sessionData = {
      user,
      token,
      timestamp: Date.now(),
    };
    return this.setItem("userSession", sessionData);
  }

  static getUserSession(): {
    user: any;
    token: string;
    timestamp: number;
  } | null {
    return this.getItem("userSession");
  }

  static clearUserSession(): boolean {
    const success = this.removeItem("userSession");
    this.removeItem("authToken");
    this.removeItem("userRole");
    this.removeItem("userId");
    this.removeItem("userName");
    return success;
  }

  static isSessionValid(): boolean {
    const session = this.getUserSession();
    if (!session) return false;

    // Check if session is older than 7 days
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - session.timestamp < sevenDays;
  }

  // Cart management
  static saveCart(cart: any): boolean {
    return this.setItem("medicineCart", cart);
  }

  static getCart(): any {
    return this.getItem("medicineCart", {});
  }

  static clearCart(): boolean {
    return this.removeItem("medicineCart");
  }

  // Appointment data
  static saveAppointmentData(appointment: any): boolean {
    return this.setItem("lastAppointment", appointment);
  }

  static getAppointmentData(): any {
    return this.getItem("lastAppointment");
  }

  // Lab packages selection
  static saveSelectedLabPackages(packages: string[]): boolean {
    return this.setItem("selectedLabPackages", packages);
  }

  static getSelectedLabPackages(): string[] {
    return this.getItem("selectedLabPackages", []) as string[];
  }

  static clearSelectedLabPackages(): boolean {
    return this.removeItem("selectedLabPackages");
  }

  // Search history
  static saveSearchHistory(
    type: "doctor" | "medicine" | "lab",
    query: string
  ): boolean {
    const history = this.getItem(`${type}SearchHistory`, []);
    if (Array.isArray(history)) {
      const updatedHistory = [
        query,
        ...history.filter((item) => item !== query),
      ].slice(0, 10);
      return this.setItem(`${type}SearchHistory`, updatedHistory);
    }
    return false;
  }

  static getSearchHistory(type: "doctor" | "medicine" | "lab"): string[] {
    return this.getItem(`${type}SearchHistory`, []) as string[];
  }

  // Theme and preferences
  static savePreferences(preferences: any): boolean {
    return this.setItem("userPreferences", preferences);
  }

  static getPreferences(): any {
    return this.getItem("userPreferences", {
      theme: "light",
      notifications: true,
      language: "en",
    });
  }
}
