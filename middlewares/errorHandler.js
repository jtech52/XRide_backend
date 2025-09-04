// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error("❌ Error caught by global handler:", err);

  // Default error
  let error = {
    message: err.message || "Internal Server Error",
    status: err.status || err.statusCode || 500,
  };

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = {
      message: `Validation Error: ${message}`,
      status: 400,
    };
  }

  // MySQL/Database errors
  if (err.code === "ER_DUP_ENTRY") {
    error = {
      message: "Duplicate entry. Resource already exists.",
      status: 409,
    };
  }

  if (err.code === "ER_NO_SUCH_TABLE") {
    error = {
      message: "Database table not found.",
      status: 500,
    };
  }

  if (err.code === "ECONNREFUSED") {
    error = {
      message: "Database connection failed.",
      status: 500,
    };
  }

  // Firebase Auth errors
  if (err.code && err.code.startsWith("auth/")) {
    error = {
      message: "Authentication error.",
      status: 401,
    };
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error = {
      message: "Invalid token.",
      status: 401,
    };
  }

  if (err.name === "TokenExpiredError") {
    error = {
      message: "Token expired.",
      status: 401,
    };
  }

  // Syntax errors (malformed JSON)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    error = {
      message: "Invalid JSON format in request body.",
      status: 400,
    };
  }

  // Cast error (invalid ObjectId, etc.)
  if (err.name === "CastError") {
    error = {
      message: "Invalid resource ID format.",
      status: 400,
    };
  }

  // Request timeout
  if (err.code === "ETIMEDOUT") {
    error = {
      message: "Request timeout.",
      status: 408,
    };
  }

  // File size limit
  if (err.code === "LIMIT_FILE_SIZE") {
    error = {
      message: "File size too large.",
      status: 413,
    };
  }

  // Rate limit error
  if (err.status === 429) {
    error = {
      message: "Too many requests. Please try again later.",
      status: 429,
    };
  }

  // Don't expose sensitive error details in production
  const response = {
    error: error.message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      details: err,
    }),
  };

  // Log error details for debugging
  if (error.status >= 500) {
    console.error("🚨 Server Error:", {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
  }

  res.status(error.status).json(response);
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Create custom error
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.status = statusCode;
  return error;
};

module.exports = {
  errorHandler,
  asyncHandler,
  createError,
};
