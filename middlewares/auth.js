const { verifyIdToken } = require("../config/firebase");

// Firebase authentication middleware
const checkAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Authorization header missing",
        message: "Please provide a valid Bearer token",
      });
    }

    // Check if it starts with "Bearer "
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Invalid authorization format",
        message: 'Authorization header must start with "Bearer "',
      });
    }

    // Extract token
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        error: "Token missing",
        message: "Please provide a valid Firebase ID token",
      });
    }

    // Verify token with Firebase
    const decodedToken = await verifyIdToken(token);

    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
      authTime: decodedToken.auth_time,
      iat: decodedToken.iat,
      exp: decodedToken.exp,
    };

    // Continue to next middleware
    next();
  } catch (error) {
    console.error("❌ Authentication error:", error.message);

    // Handle different Firebase Auth errors
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        error: "Token expired",
        message: "Your session has expired. Please sign in again.",
      });
    }

    if (error.code === "auth/id-token-revoked") {
      return res.status(401).json({
        error: "Token revoked",
        message: "Your session has been revoked. Please sign in again.",
      });
    }

    if (error.code === "auth/invalid-id-token") {
      return res.status(401).json({
        error: "Invalid token",
        message: "The provided token is invalid or malformed.",
      });
    }

    // Generic authentication error
    return res.status(401).json({
      error: "Authentication failed",
      message: "Unable to authenticate request. Please check your token.",
    });
  }
};

// Optional auth middleware (doesn't fail if no token provided)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      if (token) {
        try {
          const decodedToken = await verifyIdToken(token);
          req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified,
            name: decodedToken.name,
            picture: decodedToken.picture,
            authTime: decodedToken.auth_time,
            iat: decodedToken.iat,
            exp: decodedToken.exp,
          };
        } catch (error) {
          // Token is invalid but we don't fail the request
          console.log(
            "⚠️ Optional auth failed, continuing without user:",
            error.message
          );
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Admin check middleware (requires auth first)
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "This endpoint requires authentication",
      });
    }

    // Check if user has admin claim
    // You can customize this based on your admin logic
    if (!req.user.admin && !req.user.customClaims?.admin) {
      return res.status(403).json({
        error: "Insufficient permissions",
        message: "This endpoint requires admin privileges",
      });
    }

    next();
  } catch (error) {
    console.error("❌ Admin check error:", error.message);
    return res.status(500).json({
      error: "Authorization error",
      message: "Unable to verify admin privileges",
    });
  }
};

module.exports = {
  checkAuth,
  optionalAuth,
  requireAdmin,
};
