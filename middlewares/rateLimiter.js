const rateLimit = require("express-rate-limit");

// Basic rate limiter: 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests",
    message: "Rate limit exceeded. Please try again later.",
    retryAfter: Math.ceil((15 * 60 * 1000) / 1000), // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    console.log(`⚠️ Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

// Strict rate limiter for sensitive endpoints (e.g., auth, payments)
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    error: "Too many requests",
    message:
      "Rate limit exceeded for sensitive endpoint. Please try again later.",
    retryAfter: Math.ceil((15 * 60 * 1000) / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(
      `⚠️ Strict rate limit exceeded for IP: ${req.ip} on ${req.path}`
    );
    res.status(429).json({
      error: "Too many requests",
      message:
        "Rate limit exceeded for sensitive endpoint. Please try again later.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

// Lenient rate limiter for public endpoints
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: {
    error: "Too many requests",
    message: "Rate limit exceeded. Please try again later.",
    retryAfter: Math.ceil((15 * 60 * 1000) / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`⚠️ Public rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

// Custom rate limiter factory
const createCustomLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  };

  return rateLimit({
    ...defaultOptions,
    ...options,
    handler: (req, res) => {
      console.log(`⚠️ Custom rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        error: "Too many requests",
        message:
          options.message?.message ||
          "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
      });
    },
  });
};

module.exports = {
  limiter,
  strictLimiter,
  publicLimiter,
  createCustomLimiter,
};
