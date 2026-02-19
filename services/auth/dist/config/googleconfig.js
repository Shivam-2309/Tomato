import { google } from 'googleapis';
import dotenv from "dotenv";
dotenv.config();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// iss oauth2client ko kaise define kru ? -> 
// oauth2client = "Google se baat karne wala ticket + passport"
// credentials holder for talking to google servers via API calling
export const oauth2client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, "postmessage" // iska kaam h ki bhai oauthclient se aayi hui cheezo ko URL mn mt daalio blki mujhe directly dio vo sb kuch theeke as a POST request
);
