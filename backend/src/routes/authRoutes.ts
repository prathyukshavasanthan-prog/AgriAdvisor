import process from 'process';
import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { registerSchema, loginSchema, updateLanguageSchema } from '../validators/authSchemas.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware.js';

const router = Router();

const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'supersecretagriadvisorkey2026_change_in_production';
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

// POST /api/auth/register
router.post('/register', async (req, res): Promise<void> => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation failed',
        errors: parseResult.error.errors,
      });
      return;
    }

    const { name, phone_number, password, preferred_language, latitude, longitude } = parseResult.data;

    // Check if phone number is already registered
    const existingUser = await User.findOne({ phone_number });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'A user with this phone number already exists',
      });
      return;
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = new User({
      name,
      phone_number,
      password_hash,
      preferred_language: preferred_language || 'en',
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      created_at: new Date(),
    });

    const savedUser = await newUser.save();
    const token = generateToken(savedUser._id.toString());

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        phone_number: savedUser.phone_number,
        preferred_language: savedUser.preferred_language,
        latitude: savedUser.latitude,
        longitude: savedUser.longitude,
        created_at: savedUser.created_at,
      },
    });
  } catch (error) {
    console.error('[Auth Register Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while registering user',
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation failed',
        errors: parseResult.error.errors,
      });
      return;
    }

    const { phone_number, password } = parseResult.data;

    // Find user
    const user = await User.findOne({ phone_number });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid phone number or password',
      });
      return;
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid phone number or password',
      });
      return;
    }

    const token = generateToken(user._id.toString());

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone_number: user.phone_number,
        preferred_language: user.preferred_language,
        latitude: user.latitude,
        longitude: user.longitude,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('[Auth Login Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
    });
  }
});

// GET /api/auth/me (Protected)
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      phone_number: req.user.phone_number,
      preferred_language: req.user.preferred_language,
      latitude: req.user.latitude,
      longitude: req.user.longitude,
      created_at: req.user.created_at,
    },
  });
});

// PUT /api/auth/language (Sync preferred_language)
router.put('/language', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = updateLanguageSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Invalid language selection',
      });
      return;
    }

    const { preferred_language } = parseResult.data;
    const updatedUser = await User.findByIdAndUpdate(
      req.user!._id,
      { preferred_language },
      { new: true }
    ).select('-password_hash');

    res.status(200).json({
      success: true,
      message: 'Preferred language updated',
      user: updatedUser,
    });
  } catch (error) {
    console.error('[Auth Language Update Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferred language',
    });
  }
});

export default router;
