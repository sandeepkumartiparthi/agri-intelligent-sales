import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// These are public, client-side configuration keys provided by the Firebase Console.
// They are safe to include in your React frontend and do NOT expose your private backend GEMINI_API_KEY.
const firebaseConfig = {
  apiKey: "AIzaSyYourPublicClientApiKeyExampleHere_abc123",
  authDomain: "agri-intelligent-sales.firebaseapp.com",
  projectId: "agri-intelligent-sales",
  storageBucket: "agri-intelligent-sales.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

// Initialize the Firebase application instance
const app = initializeApp(firebaseConfig);

// Export authentication modules to be imported and used inside App.js
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
