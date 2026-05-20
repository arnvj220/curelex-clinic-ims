/**
 * imsAuthBridge.js  (place in: frontend/src/clinic/utils/imsAuthBridge.js)
 *
 * Called from the clinic side to:
 *  1. Auto-register a new pharmacist in the IMS backend
 *  2. Auto-login a pharmacist into IMS (stores ims_token) before redirecting
 */

const IMS_BASE =
  import.meta.env.VITE_IMS_API_URL || "http://localhost:5000/api/ims/api/v1";

/**
 * Creates the pharmacist account in IMS backend.
 * Called when admin clicks "Add Pharmacist" in clinic dashboard.
 */
export async function registerPharmacistInIMS({ fullName, email, password }) {
  try {
    const res = await fetch(`${IMS_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
    });
    // 409 = already exists — that's fine, don't throw
    if (!res.ok && res.status !== 409) {
      const err = await res.json().catch(() => ({}));
      console.warn("IMS signup warning:", err.message || res.status);
    }
  } catch (e) {
    // Non-fatal — clinic save still succeeds even if IMS is unreachable
    console.warn("IMS signup failed (non-fatal):", e.message);
  }
}

/**
 * Logs the pharmacist into IMS and stores ims_token in localStorage.
 * Returns true if successful, false otherwise.
 */
export async function loginPharmacistIntoIMS({ email, password }) {
  try {
    const res = await fetch(`${IMS_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("ims_token", data.token);
      return true;
    }
    return false;
  } catch (e) {
    console.warn("IMS auto-login failed:", e.message);
    return false;
  }
}