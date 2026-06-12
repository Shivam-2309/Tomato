import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AppProvider } from "./context/AppProvider.tsx";
import { SocketProvider } from "./context/SocketContext.tsx";

export const authService = "http://localhost:3000";
export const restaurantService = "http://localhost:8080";
export const utilsService = "http://localhost:5002";
export const realtimeService = "http://localhost:5004";
export const riderService = "http://localhost:5005";

const googleAuthClientId = import.meta.env.VITE_GOOGLEAUTH_CLIENT_ID;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleAuthClientId}>
      <AppProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </AppProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
