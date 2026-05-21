const IMS_BASE = import.meta.env.VITE_IMS_API_URL || '/ims/api/v1';

// Called when admin adds a pharmacist — creates their IMS account
export async function registerPharmacistInIMS({ fullName, email, password }) {
  try {
    const res = await fetch(`${IMS_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password }),
    });
    if (!res.ok && res.status !== 409) {
      const err = await res.json().catch(() => ({}));
      console.warn('IMS signup warning:', err.message || res.status);
    }
  } catch (e) {
    console.warn('IMS signup failed (non-fatal):', e.message);
  }
}

// loginPharmacistIntoIMS is no longer needed — SSO handles it
// Kept as no-op for backward compatibility if imported anywhere
export async function loginPharmacistIntoIMS() {
  return true;
}