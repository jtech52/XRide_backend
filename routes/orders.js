const express = require("express");
const { checkAuth } = require("../middlewares/auth");
const { executeQuery } = require("../config/db");
const { asyncHandler, createError } = require("../middlewares/errorHandler");

const router = express.Router();

// All routes require authentication
router.use(checkAuth);

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     description: Creates a new order for the authenticated user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order created successfully
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    console.log(`🚛 [ORDER CREATE] User ${req.user.uid} attempting to create new order`);
    
    const {
      pickupAddress,
      dropoffAddress,
      latPickup,
      lngPickup,
      latDropoff,
      lngDropoff,
      amount,
      orderType,
    } = req.body;

    console.log(`   📍 Pickup: ${pickupAddress} (${latPickup}, ${lngPickup})`);
    console.log(`   📍 Dropoff: ${dropoffAddress} (${latDropoff}, ${lngDropoff})`);
    console.log(`   💰 Amount: $${amount}`);
    console.log(`   📦 Order Type: ${orderType}`);

    // Validation
    const requiredFields = [
      "pickupAddress",
      "dropoffAddress",
      "latPickup",
      "lngPickup",
      "latDropoff",
      "lngDropoff",
      "amount",
      "orderType",
    ];

    const missingFields = requiredFields.filter(
      (field) => !req.body[field] && req.body[field] !== 0
    );

    if (missingFields.length > 0) {
      console.log(`   ❌ Validation failed - Missing fields: ${missingFields.join(", ")}`);
      throw createError(
        `Missing required fields: ${missingFields.join(", ")}`,
        400
      );
    }

    // Validate coordinates
    if (latPickup < -90 || latPickup > 90) {
      console.log(`   ❌ Invalid pickup latitude: ${latPickup}`);
      throw createError(
        "Invalid pickup latitude. Must be between -90 and 90",
        400
      );
    }

    if (lngPickup < -180 || lngPickup > 180) {
      console.log(`   ❌ Invalid pickup longitude: ${lngPickup}`);
      throw createError(
        "Invalid pickup longitude. Must be between -180 and 180",
        400
      );
    }

    if (latDropoff < -90 || latDropoff > 90) {
      console.log(`   ❌ Invalid dropoff latitude: ${latDropoff}`);
      throw createError(
        "Invalid dropoff latitude. Must be between -90 and 90",
        400
      );
    }

    if (lngDropoff < -180 || lngDropoff > 180) {
      console.log(`   ❌ Invalid dropoff longitude: ${lngDropoff}`);
      throw createError(
        "Invalid dropoff longitude. Must be between -180 and 180",
        400
      );
    }

    // Validate amount
    if (typeof amount !== "number" || amount <= 0) {
      console.log(`   ❌ Invalid amount: ${amount}`);
      throw createError("Amount must be a positive number", 400);
    }

    // Validate orderType
    const validOrderTypes = ["delivery", "pickup", "express", "scheduled"];
    if (!validOrderTypes.includes(orderType.toLowerCase())) {
      console.log(`   ❌ Invalid order type: ${orderType}`);
      throw createError(
        `Invalid order type. Must be one of: ${validOrderTypes.join(", ")}`,
        400
      );
    }

    console.log(`   ✅ Validation passed for user ${req.user.uid}`);

    try {
      // Insert order into database
      console.log(`   💾 Inserting order into database for user ${req.user.uid}...`);
      const insertQuery = `
      INSERT INTO orders (
        userUid, pickupAddress, dropoffAddress, 
        latPickup, lngPickup, latDropoff, lngDropoff, 
        amount, orderType, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

      const result = await executeQuery(insertQuery, [
        req.user.uid,
        pickupAddress,
        dropoffAddress,
        latPickup,
        lngPickup,
        latDropoff,
        lngDropoff,
        amount,
        orderType.toLowerCase(),
      ]);

      console.log(`   ✅ Order created with ID: ${result.insertId}`);

      // Fetch the created order
      console.log(`   📋 Fetching created order details...`);
      const selectQuery = "SELECT * FROM orders WHERE orderId = ?";
      const [order] = await executeQuery(selectQuery, [result.insertId]);

      console.log(`   🎉 Order creation successful for user ${req.user.uid}, Order ID: ${result.insertId}`);

      res.status(201).json({
        message: "Order created successfully",
        order: {
          ...order,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error("❌ Error creating order:", error.message);
      console.error("   Stack trace:", error.stack);
      throw createError("Failed to create order. Please try again.", 500);
    }
  })
);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get orders for authenticated user
 *     description: Retrieves all orders for the authenticated user with optional filtering and pagination
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, in_progress, completed, cancelled]
 *         description: Filter by order status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of orders to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of orders to skip
 *       - in: query
 *         name: orderType
 *         schema:
 *           type: string
 *         description: Filter by order type
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Orders retrieved successfully
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 45
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     offset:
 *                       type: integer
 *                       example: 0
 *                     hasMore:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    console.log(`📋 [ORDER LIST] User ${req.user.uid} requesting orders list`);
    
    const { status, limit = 20, offset = 0, orderType } = req.query;

    console.log(`   📊 Query params - Status: ${status || 'all'}, Limit: ${limit}, Offset: ${offset}, Type: ${orderType || 'all'}`);

    // Validate pagination parameters
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const parsedOffset = Math.max(parseInt(offset) || 0, 0);

    console.log(`   📏 Parsed pagination - Limit: ${parsedLimit}, Offset: ${parsedOffset}`);

    try {
      // Build query conditions
      let whereConditions = ["userUid = ?"];
      let queryParams = [req.user.uid];

      if (status) {
        console.log(`   🔍 Filtering by status: ${status}`);
        const validStatuses = [
          "pending",
          "confirmed",
          "in_progress",
          "completed",
          "cancelled",
        ];
        if (!validStatuses.includes(status)) {
          console.log(`   ❌ Invalid status filter: ${status}`);
          throw createError(
            `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
            400
          );
        }
        whereConditions.push("status = ?");
        queryParams.push(status);
      }

      if (orderType) {
        console.log(`   🔍 Filtering by order type: ${orderType}`);
        whereConditions.push("orderType = ?");
        queryParams.push(orderType.toLowerCase());
      }

      const whereClause = whereConditions.join(" AND ");

      // Get total count
      console.log(`   🔢 Getting total count for user ${req.user.uid}...`);
      const countQuery = `SELECT COUNT(*) as total FROM orders WHERE ${whereClause}`;
      const [countResult] = await executeQuery(countQuery, queryParams);
      const total = countResult.total;
      
      console.log(`   📊 Found ${total} total orders for user`);

      // Get orders with pagination
      console.log(`   📋 Fetching orders with pagination...`);
      const selectQuery = `
      SELECT * FROM orders 
      WHERE ${whereClause}
      ORDER BY createdAt DESC 
      LIMIT ? OFFSET ?
    `;

      const orders = await executeQuery(selectQuery, [
        ...queryParams,
        parsedLimit,
        parsedOffset,
      ]);

      // Format dates
      const formattedOrders = orders.map((order) => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      }));

      console.log(`   ✅ Successfully retrieved ${formattedOrders.length} orders for user ${req.user.uid}`);
      console.log(`   📈 Pagination: ${parsedOffset}-${parsedOffset + formattedOrders.length} of ${total}`);

      res.json({
        message: "Orders retrieved successfully",
        orders: formattedOrders,
        pagination: {
          total,
          limit: parsedLimit,
          offset: parsedOffset,
          hasMore: parsedOffset + parsedLimit < total,
        },
      });
    } catch (error) {
      console.error("❌ Error fetching orders:", error.message);
      console.error("   Stack trace:", error.stack);
      if (error.status) throw error;
      throw createError("Failed to retrieve orders. Please try again.", 500);
    }
  })
);

/**
 * @swagger
 * /api/orders/{orderId}:
 *   get:
 *     summary: Get a specific order
 *     description: Retrieves a specific order by ID for the authenticated user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order retrieved successfully
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/:orderId",
  asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    console.log(`🔍 [ORDER DETAILS] User ${req.user.uid} requesting order ${orderId}`);

    // Validate orderId
    if (!orderId || isNaN(parseInt(orderId))) {
      console.log(`   ❌ Invalid order ID provided: ${orderId}`);
      throw createError("Invalid order ID", 400);
    }

    const parsedOrderId = parseInt(orderId);
    console.log(`   🔎 Searching for order ID: ${parsedOrderId}`);

    try {
      const selectQuery =
        "SELECT * FROM orders WHERE orderId = ? AND userUid = ?";
      const [order] = await executeQuery(selectQuery, [
        parsedOrderId,
        req.user.uid,
      ]);

      if (!order) {
        console.log(`   ❌ Order ${parsedOrderId} not found for user ${req.user.uid}`);
        throw createError("Order not found", 404);
      }

      console.log(`   ✅ Found order ${parsedOrderId} - Status: ${order.status}, Amount: $${order.amount}`);
      console.log(`   📍 Route: ${order.pickupAddress} → ${order.dropoffAddress}`);

      res.json({
        message: "Order retrieved successfully",
        order: {
          ...order,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error("❌ Error fetching order:", error.message);
      console.error("   Stack trace:", error.stack);
      if (error.status) throw error;
      throw createError("Failed to retrieve order. Please try again.", 500);
    }
  })
);

module.exports = router;
