const admin = require("firebase-admin");

let firebaseApp;

// Initialize Firebase Admin SDK
const initializeFirebase = async () => {
  try {
    // Check if Firebase is already initialized
    if (firebaseApp) {
      console.log("✅ Firebase already initialized");
      return firebaseApp;
    }

    let serviceAccount;

    // Option 1: Load from JSON string (recommended for Render)
    if (process.env.FIREBASE_CREDENTIALS) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
      } catch (parseError) {
        console.error(
          "❌ Error parsing FIREBASE_CREDENTIALS JSON:",
          parseError.message
        );
        throw new Error("Invalid FIREBASE_CREDENTIALS format");
      }
    }
    // Option 2: Load from file path (for local development)
    else if (process.env.FIREBASE_CREDENTIALS_PATH) {
      serviceAccount = require(`../${process.env.FIREBASE_CREDENTIALS_PATH}`);
    } else {
      throw new Error(
        "Firebase credentials not found. Set FIREBASE_CREDENTIALS or FIREBASE_CREDENTIALS_PATH"
      );
    }

    // Validate required fields
    const requiredFields = [
      "type",
      "project_id",
      "private_key",
      "client_email",
    ];
    for (const field of requiredFields) {
      if (!serviceAccount[field]) {
        throw new Error(
          `Missing required field in Firebase credentials: ${field}`
        );
      }
    }

    // Initialize Firebase Admin
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    console.log("✅ Firebase Admin SDK initialized successfully");
    return firebaseApp;
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error.message);
    throw error;
  }
};

// Verify Firebase ID Token
const verifyIdToken = async (idToken) => {
  try {
    if (!firebaseApp) {
      await initializeFirebase();
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    throw new Error("Invalid or expired token");
  }
};

// Get Firebase Auth instance
const getAuth = () => {
  if (!firebaseApp) {
    throw new Error("Firebase not initialized");
  }
  return admin.auth();
};

// Get user by UID
const getUserByUid = async (uid) => {
  try {
    if (!firebaseApp) {
      await initializeFirebase();
    }

    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    console.error("❌ Error getting user by UID:", error.message);
    throw error;
  }
};

// Create custom token (if needed)
const createCustomToken = async (uid, additionalClaims = {}) => {
  try {
    if (!firebaseApp) {
      await initializeFirebase();
    }

    const customToken = await admin
      .auth()
      .createCustomToken(uid, additionalClaims);
    return customToken;
  } catch (error) {
    console.error("❌ Error creating custom token:", error.message);
    throw error;
  }
};

module.exports = {
  initializeFirebase,
  verifyIdToken,
  getAuth,
  getUserByUid,
  createCustomToken,
  admin,
};
