import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import dotenv from 'dotenv';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';  // Import getStorage

dotenv.config();

const firebaseConfig = {
    apiKey:"AIzaSyAFTMCP8Xess7YdQORSVoL-NGFDjPCnMHM",
    authDomain: "omebudgetapp-9f89b.firebaseapp.com",
    projectId: "homebudgetapp-9f89b",
    storageBucket: "homebudgetapp-9f89b.appspot.com",
    messagingSenderId: "376870799077",
    appId: "1:376870799077:web:63ec29e676a073f02f760c"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore, Auth, and Storage
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); // Initialize Firebase Storage

// Export the services
export { db, auth, storage };
