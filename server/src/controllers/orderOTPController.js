import Order from '../models/Order.js';
import User from '../models/User.js';
import { generateAndSendOTP, verifyOTP, resendOTP } from '../services/otp/otpService.js';

/**
 * Create a new order and send OTP for confirmation
 */
export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;
    const userId = req.user.id; // From auth middleware

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order items are required' });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }

    if (!paymentMethod) {
      return res.status(400).json({ message: 'Payment method is required' });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create order
    const order = new Order({
      userId,
      items: items.map(item => ({
        ...item,
        totalPrice: item.price * item.quantity
      })),
      shippingAddress,
      paymentMethod,
      notes
    });

    // Calculate total amount
    order.calculateTotal();
    
    // Save order
    await order.save();

    // Generate and send OTP for order confirmation
    const otpResult = await generateAndSendOTP(user.email, 'order', userId, order._id);
    
    if (!otpResult.success) {
      // If OTP sending fails, delete the created order
      await Order.findByIdAndDelete(order._id);
      return res.status(500).json({ 
        message: "Failed to send order confirmation code",
        error: otpResult.error 
      });
    }

    return res.status(201).json({
      message: "Order created successfully. Please check your email for confirmation code.",
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        items: order.items,
        shippingAddress: order.shippingAddress
      },
      otpExpiresAt: otpResult.expiresAt
    });

  } catch (error) {
    console.error("[CREATE ORDER ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Verify OTP and confirm order
 */
export const confirmOrder = async (req, res) => {
  try {
    const { orderId, otp } = req.body;
    const userId = req.user.id;

    if (!orderId || !otp) {
      return res.status(400).json({ message: 'Order ID and OTP are required' });
    }

    // Find the order
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order is already confirmed
    if (order.isOTPVerified) {
      return res.status(400).json({ message: 'Order already confirmed' });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify OTP
    const otpResult = await verifyOTP(user.email, otp, 'order', userId, orderId);
    
    if (!otpResult.success) {
      return res.status(400).json({ message: otpResult.error });
    }

    // Update order status
    order.isOTPVerified = true;
    order.otpVerifiedAt = new Date();
    order.status = 'confirmed';
    
    // Set estimated delivery (7 days from now)
    order.estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await order.save();

    return res.json({
      message: "Order confirmed successfully",
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        estimatedDelivery: order.estimatedDelivery,
        otpVerifiedAt: order.otpVerifiedAt
      }
    });

  } catch (error) {
    console.error("[CONFIRM ORDER ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Resend OTP for order confirmation
 */
export const resendOrderOTP = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Find the order
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order is already confirmed
    if (order.isOTPVerified) {
      return res.status(400).json({ message: 'Order already confirmed' });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Resend OTP
    const otpResult = await resendOTP(user.email, 'order', userId, orderId);
    
    if (!otpResult.success) {
      return res.status(400).json({ message: otpResult.error });
    }

    return res.json({
      message: "Order confirmation code resent successfully",
      expiresAt: otpResult.expiresAt
    });

  } catch (error) {
    console.error("[RESEND ORDER OTP ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get user's orders
 */
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: {
        path: 'userId',
        select: 'name email'
      }
    };

    const orders = await Order.find(query)
      .sort(options.sort)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .populate(options.populate);

    const total = await Order.countDocuments(query);

    return res.json({
      orders,
      pagination: {
        current: options.page,
        pages: Math.ceil(total / options.limit),
        total
      }
    });

  } catch (error) {
    console.error("[GET USER ORDERS ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: orderId, userId })
      .populate('userId', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json({ order });

  } catch (error) {
    console.error("[GET ORDER BY ID ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Cancel order (only if not confirmed)
 */
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order can be cancelled
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      return res.status(400).json({ 
        message: 'Order cannot be cancelled. It is already being processed.' 
      });
    }

    order.status = 'cancelled';
    await order.save();

    return res.json({
      message: "Order cancelled successfully",
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status
      }
    });

  } catch (error) {
    console.error("[CANCEL ORDER ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};