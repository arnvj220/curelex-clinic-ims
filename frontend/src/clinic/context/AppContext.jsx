// src/context/AppContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  apiLogout,
  getSession,
  setSession as persistSession,
  apiGetMyClinic,
  apiUpdateMyClinic,
  apiGetUsers,
  apiAddUser,
  apiDeleteUser,
  apiGetPatients,
  apiAddPatient,
  apiUpdatePatientStatus,
  apiUpdateFollowUp,
  apiUpdateTokenLimit,
  apiGetMe,
  apiUploadPatientFile,
  apiGetPatientFiles,
  apiDownloadPatientFile,
  apiDeletePatientFile,
  apiGetPatientHistory,
  apiActivatePlan,
} from '../utils/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [session, setSessionState] = useState(() => getSession());

  // ── Plan state ───────────────────────────────────────────────────
  // FIX: useCallback so reference is stable — no re-renders on every Provider render
  const [activePlan, setActivePlanState] = useState(
    () => localStorage.getItem('curelex_activePlan') ?? null
  );

  const setActivePlan = useCallback((planKey) => {
    localStorage.setItem('curelex_activePlan', planKey);
    setActivePlanState(planKey);
  }, []);

  const clearPlan = useCallback(() => {
    localStorage.removeItem('curelex_activePlan');
    setActivePlanState(null);
  }, []);
  // ────────────────────────────────────────────────────────────────

  // FIX: clearPlan added to dependency array so setSession never holds stale ref
  const setSession = useCallback((sess) => {
    setSessionState(sess);
    if (sess) persistSession(sess);
    else { apiLogout(); clearPlan(); }
  }, [clearPlan]);

  const login  = useCallback((sess) => setSession(sess), [setSession]);
  const logout = useCallback(() => setSession(null),     [setSession]);

  // ── Clinic ───────────────────────────────────────────────────────
  const refreshClinic = useCallback(() => apiGetMyClinic(), []);
  const saveClinic    = useCallback((updates) => apiUpdateMyClinic(updates), []);

  // ── Users ────────────────────────────────────────────────────────
  const getUsers   = useCallback(() => apiGetUsers(), []);
  const addUser    = useCallback((data) => apiAddUser(data), []);
  const deleteUser = useCallback((userId) => apiDeleteUser(userId), []);
  const getMe      = useCallback(() => apiGetMe(), []);

  // ── Token Limit ──────────────────────────────────────────────────
  const updateTokenLimit = useCallback(
    (doctorId, limit) => apiUpdateTokenLimit(doctorId, limit), []
  );

  // ── Patients ─────────────────────────────────────────────────────
  const getPatients         = useCallback((params = {}) => apiGetPatients(params), []);
  const addPatient          = useCallback((data) => apiAddPatient(data), []);
  const updatePatientStatus = useCallback(
    (patientId, status) => apiUpdatePatientStatus(patientId, status), []
  );
  const updateFollowUp = useCallback(
    (patientId, followUpDate, followUpNote) =>
      apiUpdateFollowUp(patientId, followUpDate, followUpNote), []
  );

  // ── Patient Files ────────────────────────────────────────────────
  const uploadPatientFile = useCallback(
    (patientId, file) => apiUploadPatientFile(patientId, file), []
  );
  const getPatientFiles = useCallback(
    (patientId) => apiGetPatientFiles(patientId), []
  );
  const downloadPatientFile = useCallback(
    (patientId, fileId) => apiDownloadPatientFile(patientId, fileId), []
  );
  const deletePatientFile = useCallback(
    (patientId, fileId) => apiDeletePatientFile(patientId, fileId), []
  );

  // ── Patient History ──────────────────────────────────────────────
  const getPatientHistory = useCallback(
    (phone) => apiGetPatientHistory(phone), []
  );

  // ── Plan Activation ──────────────────────────────────────────────
  const activatePlan = useCallback(async (planKey) => {
    await apiActivatePlan(planKey);
    setActivePlan(planKey);
  }, [setActivePlan]);

  return (
    <AppContext.Provider value={{
      session, login, logout,
      // ── Plan ──
      activePlan,       // 'lite' | 'plus' | 'pro' | null
      setActivePlan,    // call after successful payment
      clearPlan,        // called automatically on logout
      activatePlan,     // calls API + sets plan in one shot
      // ── Clinic ──
      refreshClinic, saveClinic,
      // ── Users ──
      getUsers, addUser, deleteUser, getMe,
      // ── Token ──
      updateTokenLimit,
      // ── Patients ──
      getPatients, addPatient, updatePatientStatus, updateFollowUp,
      // ── Files ──
      uploadPatientFile, getPatientFiles, downloadPatientFile, deletePatientFile,
      // ── History ──
      getPatientHistory,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}