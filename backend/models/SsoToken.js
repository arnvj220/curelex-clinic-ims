import mongoose from 'mongoose';

const ssoTokenSchema = new mongoose.Schema({
  token:     { type: String, required: true, unique: true, index: true },
  email:     { type: String, required: true },
  clinicId:  { type: String, default: null },
  createdAt: { type: Date, default: Date.now, expires: 120 },
});

export default mongoose.models.SsoToken || mongoose.model('SsoToken', ssoTokenSchema);