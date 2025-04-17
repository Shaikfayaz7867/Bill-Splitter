/**
 * Google OAuth Configuration
 * 
 * To obtain your Google Client ID:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select an existing one
 * 3. Navigate to "APIs & Services" > "Credentials"
 * 4. Click "Create Credentials" > "OAuth client ID"
 * 5. Select "Web application" as the application type
 * 6. Add your domain in "Authorized JavaScript origins" (e.g., http://localhost:5173 for development)
 * 7. Add your redirect URI in "Authorized redirect URIs" (usually same as your origin for single-page apps)
 * 8. Click "Create" and copy the generated Client ID
 */

// Get the client ID from environment variables
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Google OAuth scopes
export const GOOGLE_SCOPES = ['email', 'profile'];

// Export configuration
export default {
  clientId: GOOGLE_CLIENT_ID,
  scopes: GOOGLE_SCOPES
}; 