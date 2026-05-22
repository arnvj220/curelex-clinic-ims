import { createContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getMe, login as loginApi, signup as signupApi } from "../services/authService";

export const AuthContext = createContext(null);

// Roles that exist in the clinic system too
const CLINIC_ROLES = ['receptionist', 'doctor', 'pharmacist', 'admin'];

// After IMS login, also login to clinic backend to get clinic token
async function fetchClinicToken(email, password, role) {
  try {
    if (!CLINIC_ROLES.includes(role)) return; // owner/manager — no clinic login
    
    const res = await fetch(
      `${import.meta.env.VITE_CLINIC_API_URL || 'http://localhost:5000/api/clinic'}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      }
    );
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('clinic_token', data.token);  // ← save separately
    }
  } catch (err) {
    console.warn('Clinic token fetch failed:', err.message);
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem("ims_token");
      if (!token) { setLoading(false); return; }
      try {
        const { user: currentUser } = await getMe();
        setUser(currentUser);
      } catch (error) {
        localStorage.removeItem("ims_token");
        localStorage.removeItem("clinic_token");  // ← clean up both
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (payload) => {
    const data = await loginApi(payload);
    localStorage.setItem("ims_token", data.token);
    setUser(data.user);

    // ── Also get clinic token so clinic APIs work ──
    await fetchClinicToken(payload.email, payload.password, data.user.role);

    toast.success("Logged in");
  };

  const signup = async (payload) => {
    const data = await signupApi(payload);
    localStorage.setItem("ims_token", data.token);
    setUser(data.user);

    // ── Also get clinic token if applicable ──
    await fetchClinicToken(payload.email, payload.password, data.user.role);

    toast.success("Account created");
  };

  const logout = () => {
    localStorage.removeItem("ims_token");
    localStorage.removeItem("clinic_token");  // ← clear both on logout
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, signup, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};