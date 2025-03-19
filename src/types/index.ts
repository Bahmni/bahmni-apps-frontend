// Define global types here

// Example type for a user
export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

// Example type for API response
export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  success: boolean;
}

// Add more types as needed
