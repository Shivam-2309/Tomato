import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google';

export const authService = 'http://localhost:3000'
const googleAuthClientId = import.meta.env.VITE_GOOGLEAUTH_CLIENT_ID;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleAuthClientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
)
