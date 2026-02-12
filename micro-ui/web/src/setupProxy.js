const dotenv = require("dotenv");
const express = require("express");

// Load .env file
const env = dotenv.config().parsed || {};

// Import mock API middleware if enabled (API console logs live in mockApiServer)
let mockApiMiddleware = null;
let mockApi = null;
if (env.REACT_APP_MOCK_API === "true" || process.env.REACT_APP_MOCK_API === "true") {
  try {
    mockApi = require("./mockApiServer.js");
    mockApiMiddleware = mockApi.mockApiMiddleware;
    mockApi.logMockApiEnabled();
  } catch (error) {
    console.warn("⚠️  Could not load mock API server:", error.message);
  }
}

// Proxy is configured in webpack.dev.js devServer.proxy.
// This file only registers body parsing and mock API middleware (so mock API runs before proxy).
module.exports = function (app) {
  // Add body parsing middleware for JSON requests (required for mock API)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mock API middleware runs first; unhandled requests are forwarded by devServer.proxy
  if (mockApiMiddleware && mockApi) {
    app.use(mockApiMiddleware);
    mockApi.logMockApiMiddlewareRegistered();
  }
};
