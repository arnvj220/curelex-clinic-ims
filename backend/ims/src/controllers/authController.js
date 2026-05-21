import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import env from '../config/env.js';
import { STAFF_PERMISSIONS, ROLES } from '../utils/permissions.js';
import User from '../models/User.js';
import SsoToken from '../../../models/SsoToken.js'; // ← FIXED

const signToken = (userId) =>
  jwt.sign({ id: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const signup = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) { res.status(409); throw new Error('Email already exists'); }

  const user = await User.create({
    fullName, email: email.toLowerCase(), password,
    role: ROLES.STAFF,
    permissions: STAFF_PERMISSIONS.SALES_BILLING,
  });

  const token = signToken(user._id);
  res.status(201).json({ token, user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await user.comparePassword(password))) {
    res.status(401); throw new Error('Invalid credentials');
  }
  user.lastLoginAt = new Date();
  await user.save();
  const token = signToken(user._id);
  res.json({ token, user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role, permissions: user.permissions } });
});

export const ssoExchange = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) { res.status(400); throw new Error('SSO token required'); }

  const record = await SsoToken.findOneAndDelete({ token });
  if (!record) { res.status(401); throw new Error('Invalid or expired SSO token'); }

  const user = await User.findOne({ email: record.email });
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error('Pharmacist not found in IMS. Ask admin to add you first.');
  }

  const imsToken = signToken(user._id);
  res.json({
    token: imsToken,
    user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role, permissions: user.permissions }
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});