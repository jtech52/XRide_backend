# 🚗 XRide Backend API

<div align="center">

![XRide Logo](https://via.placeholder.com/200x80/4F46E5/white?text=XRide)

**Secure, Scalable Backend API for XRide - Modern Ride-Hailing & Delivery Platform**

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18-blue)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-orange)](https://firebase.google.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Deploy](https://img.shields.io/badge/Deploy-Render-purple)](https://render.com)

</div>

---

## 🌟 Overview

XRide Backend API is a production-ready, enterprise-grade backend service designed for modern ride-hailing and delivery applications. Built with scalability, security, and performance in mind, it provides a robust foundation for mobile and web applications.

### 🎯 Key Features

- **🔐 Firebase Authentication** - JWT token verification and user management
- **🗄️ MySQL Integration** - Optimized connection pooling and database operations  
- **📚 Swagger Documentation** - Interactive API documentation and testing
- **🛡️ Enterprise Security** - Helmet, rate limiting, CORS, and input validation
- **⚡ High Performance** - Compression, caching, and optimized middleware stack
- **🚀 Production Ready** - Configured for Render.com with environment-based configurations
- **📍 Geolocation Support** - GPS coordinate validation and processing
- **📊 Request Logging** - Morgan logging with environment-specific configurations

## 🏗️ Architecture

```
XRide Backend API
├── 🔥 Firebase Authentication Layer
├── 🛡️ Security & Rate Limiting Middleware  
├── 📡 RESTful API Endpoints
├── 🗄️ MySQL Database Layer
└── 📚 Swagger API Documentation
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16.0 or higher
- **MySQL** 8.0 or higher
- **Firebase** project with Admin SDK
- **NPM** 8.0 or higher

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/xride/xride_backend.git
   cd xride-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**
   ```bash
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # MySQL Database (XAMPP Local)
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=
   DB_NAME=xride_db
   
   # Firebase Admin SDK
   FIREBASE_CREDENTIALS={"type":"service_account",...}
   
   # Production URLs
   API_URL=https://xride-backend.onrender.com
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - 🌐 **API Base URL**: `http://localhost:3000`
   - 📚 **Documentation**: `http://localhost:3000/api-docs`
   - 🏥 **Health Check**: `http://localhost:3000/health`

## 📡 API Endpoints

### 🔐 Authentication Required
All API endpoints require Firebase JWT authentication:
```
Authorization: Bearer <firebase-jwt-token>
```

### 🚗 Orders Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/orders` | Create a new ride/delivery order |
| `GET` | `/api/orders` | Get user's orders (with pagination) |
| `GET` | `/api/orders/:id` | Get specific order details |

### 🏥 System Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/health` | Service health status | ❌ |
| `GET` | `/api/test` | API connectivity test | ❌ |
| `GET` | `/api-docs` | Interactive API documentation | ❌ |

## 📋 Request/Response Examples

### Create Order
```bash
POST /api/orders
Content-Type: application/json
Authorization: Bearer <firebase-token>

{
  "pickupAddress": "123 Main Street, New York, NY 10001",
  "dropoffAddress": "456 Broadway, New York, NY 10013", 
  "latPickup": 40.7128,
  "lngPickup": -74.0060,
  "latDropoff": 40.7206,
  "lngDropoff": -74.0010,
  "amount": 24.99,
  "orderType": "ride"
}
```

### Response
```json
{
  "message": "Order created successfully",
  "order": {
    "orderId": 123,
    "userUid": "firebase-uid-123",
    "pickupAddress": "123 Main Street, New York, NY 10001",
    "dropoffAddress": "456 Broadway, New York, NY 10013",
    "latPickup": 40.7128,
    "lngPickup": -74.0060,
    "latDropoff": 40.7206,
    "lngDropoff": -74.0010,
    "amount": 24.99,
    "orderType": "ride",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🗄️ Database Schema

The system automatically creates optimized database tables:

```sql
CREATE TABLE orders (
  orderId INT AUTO_INCREMENT PRIMARY KEY,
  userUid VARCHAR(255) NOT NULL,
  pickupAddress TEXT NOT NULL,
  dropoffAddress TEXT NOT NULL,
  latPickup DECIMAL(10, 8) NOT NULL,
  lngPickup DECIMAL(11, 8) NOT NULL,
  latDropoff DECIMAL(10, 8) NOT NULL,
  lngDropoff DECIMAL(11, 8) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  orderType ENUM('ride', 'delivery', 'express', 'scheduled') NOT NULL,
  status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_userUid (userUid),
  INDEX idx_status (status),
  INDEX idx_createdAt (createdAt),
  INDEX idx_orderType (orderType)
);
```

## 🛡️ Security Features

### 🔒 Security Layers
- **Helmet** - HTTP security headers
- **CORS** - Cross-origin resource sharing control
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Input Validation** - Comprehensive request validation
- **Firebase Auth** - JWT token verification
- **SQL Injection Protection** - Parameterized queries

### 📊 Rate Limits
- **General API**: 100 requests / 15 minutes
- **Authentication**: 20 requests / 15 minutes  
- **Public endpoints**: 200 requests / 15 minutes

## 📁 Project Structure

```
xride-backend/
├── 📄 server.js                 # Main application entry
├── 📁 config/
│   ├── 🔥 firebase.js           # Firebase Admin SDK setup
│   └── 🗄️ db.js                 # MySQL connection & queries
├── 📁 middlewares/
│   ├── 🔐 auth.js               # Authentication middleware
│   ├── ⚡ rateLimiter.js         # Rate limiting configs
│   └── ❌ errorHandler.js        # Global error handling
├── 📁 routes/
│   └── 🚗 orders.js             # Orders API endpoints
├── 📦 package.json              # Dependencies & scripts
├── 🌍 .env.example              # Environment template
├── 📚 README.md                 # Documentation
└── 🚀 render.yaml               # Deployment config
```

## ☁️ Deployment

### 🚀 Render.com Deployment

1. **Repository Setup**
   ```bash
   git remote add origin https://github.com/your-username/xride-backend.git
   git push -u origin main
   ```

2. **Render Configuration**
   - Connect your GitHub repository to Render
   - Set build command: `npm install`
   - Set start command: `npm start`
   - Add environment variables from production config

3. **Environment Variables**
   ```bash
   NODE_ENV=production
   PORT=10000
   DB_HOST=your-production-db-host
   DB_USER=your-production-db-user
   DB_PASS=your-production-db-password
   DB_NAME=xride_production
   FIREBASE_CREDENTIALS=your-minified-firebase-json
   API_URL=https://your-app.onrender.com
   ALLOWED_ORIGINS=https://xride.app
   ```

### 🐳 Docker Support

```dockerfile
# Dockerfile included for containerization
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Development

### 📝 Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with auto-reload  
npm test           # Run test suite (coming soon)
npm run lint       # Run ESLint code analysis
npm run format     # Format code with Prettier
npm run docker:build  # Build Docker image
npm run docker:run    # Run Docker container
```

### 🔧 Local Development Setup

1. **XAMPP Configuration**
   - Start Apache and MySQL services
   - Create database: `CREATE DATABASE xride_db;`
   - Use default XAMPP credentials

2. **Firebase Setup**
   - Download Admin SDK JSON from Firebase Console
   - Minify JSON and set as `FIREBASE_CREDENTIALS`

3. **Environment Variables**
   - Copy `.env.example` to `.env`
   - Update with your local configurations

## 📊 Monitoring & Logging

- **Request Logging**: Morgan middleware with environment-specific configs
- **Error Tracking**: Comprehensive error handling and logging
- **Health Monitoring**: `/health` endpoint for uptime monitoring
- **Performance Metrics**: Built-in uptime and performance tracking

## 🤝 Contributing

We welcome contributions to XRide Backend API!

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open Pull Request**

### 🔍 Code Standards
- **ESLint** for code quality
- **Prettier** for code formatting
- **Conventional Commits** for commit messages
- **Jest** for testing (setup included)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

**XRide Development Team**
- **Lead Developer**: lead@xride.app
- **API Support**: api-support@xride.app
- **General Inquiries**: dev@xride.app

## 🆘 Support

### 📚 Resources
- **API Documentation**: `/api-docs` endpoint
- **Health Status**: `/health` endpoint  
- **Test Connectivity**: `/api/test` endpoint

### 🐛 Issue Reporting
- **GitHub Issues**: [Report a bug](https://github.com/xride/xride-backend/issues)
- **Email Support**: api-support@xride.app

### 💬 Community
- **Website**: [https://xride.app](https://xride.app)
- **Documentation**: Available at API docs endpoint
- **Status Page**: Monitor service health

---

<div align="center">

**🚗 Built with ❤️ by the XRide Team**

*Empowering the future of transportation and delivery*

</div>