import jwt from 'jsonwebtoken'

import {asyncHandler} from '../utils/asyncHandler.js';
import env from '../config/env.js'
import { STAFF_PERMISSIONS, ROLES } from '../utils/permissions.js';
import User from '../models/User.js';




const signToken = (userId) =>
  jwt.sign({ id: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

// POST /auth/signup
export const signup = asyncHandler(async (req, res) => {
  const { fullName, email, password, role } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    res.status(409);
    throw new Error("Email already exists");
  }

  // FIX: Prevent staff from self-assigning admin role via API
  const assignedRole = ROLES.STAFF; // Always create as staff; promote via admin panel
  const permissions = STAFF_PERMISSIONS.SALES_BILLING;

  const user = await User.create({
    fullName,
    email,
    password,
    role: assignedRole,
    permissions
  });

  const token = signToken(user._id);
  res.status(201).json({
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    }
  });
});

// POST /auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user._id);

  res.json({
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    }
  });
});

// GET /auth/me
export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

