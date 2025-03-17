// Admin credentials - in a real app, these would be environment variables
export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

export interface AdminState {
  isAuthenticated: boolean;
  username: string | null;
}

export interface AdminAuthResponse {
  success: boolean;
  message: string;
} 