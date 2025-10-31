import crypto from 'crypto';
import OTP from '../../models/OTP.js';
import { sendOTPEmail } from '../email/emailService.js';

/**
 * Generate a 6-digit OTP
 */
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Generate and send OTP for various purposes
 */
export const generateAndSendOTP = async (email, purpose, userId = null, orderId = null) => {
  try {
    // Clean up any existing OTPs for this email and purpose
    await OTP.deleteMany({ 
      email: email.toLowerCase(), 
      purpose,
      isVerified: false 
    });

    // Generate new OTP
    const otpCode = generateOTP();
    
    // Create OTP record
    const otpRecord = new OTP({
      email: email.toLowerCase(),
      otp: otpCode,
      purpose,
      userId,
      orderId
    });

    await otpRecord.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otpCode, purpose);
    
    if (!emailResult.success) {
      // If email fails, clean up the OTP record
      await OTP.findByIdAndDelete(otpRecord._id);
      throw new Error(`Failed to send OTP email: ${emailResult.error}`);
    }

    return {
      success: true,
      message: 'OTP sent successfully',
      otpId: otpRecord._id,
      expiresAt: otpRecord.expiresAt
    };
  } catch (error) {
    console.error('Error generating and sending OTP:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verify OTP
 */
export const verifyOTP = async (email, otpCode, purpose, userId = null, orderId = null) => {
  try {
    // Find the OTP record
    const query = {
      email: email.toLowerCase(),
      otp: otpCode,
      purpose,
      isVerified: false
    };

    // Add userId or orderId to query if provided
    if (userId) query.userId = userId;
    if (orderId) query.orderId = orderId;

    const otpRecord = await OTP.findOne(query);

    if (!otpRecord) {
      return {
        success: false,
        error: 'Invalid OTP or OTP not found'
      };
    }

    // Check if OTP is expired
    if (otpRecord.isExpired()) {
      await OTP.findByIdAndDelete(otpRecord._id);
      return {
        success: false,
        error: 'OTP has expired'
      };
    }

    // Check if maximum attempts reached
    if (otpRecord.maxAttemptsReached()) {
      await OTP.findByIdAndDelete(otpRecord._id);
      return {
        success: false,
        error: 'Maximum verification attempts reached. Please request a new OTP.'
      };
    }

    // Increment attempts
    otpRecord.attempts += 1;

    // Mark as verified
    otpRecord.isVerified = true;
    await otpRecord.save();

    // Clean up verified OTP after successful verification
    setTimeout(async () => {
      try {
        await OTP.findByIdAndDelete(otpRecord._id);
      } catch (error) {
        console.error('Error cleaning up verified OTP:', error);
      }
    }, 5000); // Delete after 5 seconds

    return {
      success: true,
      message: 'OTP verified successfully',
      otpRecord
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Resend OTP
 */
export const resendOTP = async (email, purpose, userId = null, orderId = null) => {
  try {
    // Check if there's a recent OTP request (rate limiting)
    const recentOTP = await OTP.findOne({
      email: email.toLowerCase(),
      purpose,
      createdAt: { $gte: new Date(Date.now() - 60000) } // Within last minute
    });

    if (recentOTP) {
      return {
        success: false,
        error: 'Please wait at least 1 minute before requesting a new OTP'
      };
    }

    // Generate and send new OTP
    return await generateAndSendOTP(email, purpose, userId, orderId);
  } catch (error) {
    console.error('Error resending OTP:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Check if user has pending OTP
 */
export const hasPendingOTP = async (email, purpose, userId = null, orderId = null) => {
  try {
    const query = {
      email: email.toLowerCase(),
      purpose,
      isVerified: false,
      expiresAt: { $gt: new Date() }
    };

    if (userId) query.userId = userId;
    if (orderId) query.orderId = orderId;

    const pendingOTP = await OTP.findOne(query);
    
    return {
      hasPending: !!pendingOTP,
      otpRecord: pendingOTP,
      expiresAt: pendingOTP?.expiresAt
    };
  } catch (error) {
    console.error('Error checking pending OTP:', error);
    return {
      hasPending: false,
      error: error.message
    };
  }
};

/**
 * Clean up expired OTPs (can be called periodically)
 */
export const cleanupExpiredOTPs = async () => {
  try {
    const result = await OTP.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { isVerified: true, updatedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Verified OTPs older than 24 hours
      ]
    });
    
    console.log(`Cleaned up ${result.deletedCount} expired OTP records`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
    return 0;
  }
};

/**
 * Get OTP statistics for monitoring
 */
export const getOTPStats = async () => {
  try {
    const stats = await OTP.aggregate([
      {
        $group: {
          _id: '$purpose',
          total: { $sum: 1 },
          verified: { $sum: { $cond: ['$isVerified', 1, 0] } },
          expired: { $sum: { $cond: [{ $lt: ['$expiresAt', new Date()] }, 1, 0] } }
        }
      }
    ]);

    return {
      success: true,
      stats
    };
  } catch (error) {
    console.error('Error getting OTP stats:', error);
    return {
      success: false,
      error: error.message
    };
  }
};