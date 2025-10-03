// localStorage utility with error handling
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  // Add other user properties as needed
}

interface UserSession {
  user: User;
  token: string;
  timestamp: number;
}

interface Preferences {
  theme: string;
  notifications: boolean;
  language: string;
}

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  // Add other cart item properties as needed
}

interface Cart {
  items: CartItem[];
  total: number;
  // Add other cart properties as needed
}

interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  date: string;
  time: string;
  // Add other appointment properties as needed
}

export class LocalStorageManager {
  static setItem<T>(key: string, value: T): boolean {
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
  static saveUserSession(user: User, token: string): boolean {
    const sessionData = {
      user,
      token,
      timestamp: Date.now(),
    };
    return this.setItem("userSession", sessionData);
  }

  static getUserSession(): UserSession | null {
    return this.getItem<UserSession>("userSession", null);
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
  static saveCart(cart: Cart): boolean {
    return this.setItem("medicineCart", cart);
  }

  static getCart(): Cart {
    return this.getItem<Cart>("medicineCart", { items: [], total: 0 }) as Cart;
  }

  static clearCart(): boolean {
    return this.removeItem("medicineCart");
  }

  // Appointment data
  static saveAppointmentData(appointment: Appointment): boolean {
    return this.setItem("lastAppointment", appointment);
  }

  static getAppointmentData(): Appointment | null {
    return this.getItem<Appointment>("lastAppointment", null);
  }

  // Lab packages selection
  static saveSelectedLabPackages(packages: string[]): boolean {
    return this.setItem("selectedLabPackages", packages);
  }

  static getSelectedLabPackages(): string[] {
    return this.getItem<string[]>("selectedLabPackages", []) as string[];
  }

  static clearSelectedLabPackages(): boolean {
    return this.removeItem("selectedLabPackages");
  }

  // Search history
  static saveSearchHistory(
    type: "doctor" | "medicine" | "lab",
    query: string
  ): boolean {
    const history = this.getItem<string[]>(`${type}SearchHistory`, []);
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
    return this.getItem<string[]>(`${type}SearchHistory`, []) as string[];
  }

  // Theme and preferences
  static savePreferences(preferences: Preferences): boolean {
    return this.setItem("userPreferences", preferences);
  }

  static getPreferences(): Preferences {
    return this.getItem<Preferences>("userPreferences", {
      theme: "light",
      notifications: true,
      language: "en",
    }) as Preferences;
  }
}
