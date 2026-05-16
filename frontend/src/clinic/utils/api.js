// ── Curelex API Service (Merged Version) ─────────────────────────────────────
// Updated to use merged backend endpoint with /clinic prefix
const BASE = import.meta.env.VITE_CLINIC_API_URL
  ? `${import.meta.env.VITE_CLINIC_API_URL}`
  : '/api/clinic';

// ── Token / Session helpers (using clinic_ prefix to avoid conflict with IMS) ──
export function getToken()      { return localStorage.getItem('clinic_token'); }
export function setToken(t)     { localStorage.setItem('clinic_token', t); }
export function removeToken()   { localStorage.removeItem('clinic_token'); }

export function getSession() {
  try { return JSON.parse(localStorage.getItem('clinic_session') || 'null'); }
  catch { return null; }
}
export function setSession(s)   { localStorage.setItem('clinic_session', JSON.stringify(s)); }
export function removeSession() { localStorage.removeItem('clinic_session'); }

// ── IST date/time helpers ─────────────────────────────────────────────────────
function getTodayIST() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().split('T')[0];
}

function getCurrentTimeIST() {
  return new Date().toLocaleTimeString('en-IN', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// ── Base fetch ────────────────────────────────────────────────────────────────
async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res  = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function apiRegister(form) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name:     form.clinicName,
      owner:    form.ownerName,
      email:    form.email,
      password: form.password,
      phone:    form.phone     || '',
      whatsapp: form.whatsapp  || '',
      address:  form.address   || '',
      city:     form.city      || '',
      district: form.district  || '',
      state:    form.state     || '',
    }),
  });
  setToken(data.token);
  setSession({ type: data.role, clinicId: String(data.clinicId), user: data.clinic || null, token: data.token });
  return data;
}

export async function apiLogin(role, email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ role, email, password }),
  });
  setToken(data.token);
  const clinicId = data.clinicId ? String(data.clinicId) : null;
  setSession({ type: data.role, clinicId, user: data.clinic || data.user || null, token: data.token });
  return data;
}

export function apiLogout() {
  removeToken();
  removeSession();
}

// ── Clinic ────────────────────────────────────────────────────────────────────
export async function apiGetMyClinic() {
  return request('/clinics/me');
}

export async function apiUpdateMyClinic(updates) {
  return request('/clinics/me', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function apiActivatePlan(plan) {
  return request('/clinics/activate-plan', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  });
}

// ── Users ─────────────────────────────────────────────────────────────────────
export async function apiGetUsers() {
  return request('/users');
}

export async function apiGetMe() {
  return request('/users/me');
}

export async function apiAddUser(userData) {
  return request('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function apiDeleteUser(userId) {
  return request(`/users/${userId}`, { method: 'DELETE' });
}

export async function apiUpdateTokenLimit(doctorId, limit) {
  return request(`/users/${doctorId}/token-limit`, {
    method: 'PATCH',
    body: JSON.stringify({ dailyTokenLimit: limit }),
  });
}

// ── Patients ──────────────────────────────────────────────────────────────────
export async function apiGetPatients(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/patients${qs ? '?' + qs : ''}`);
}

export async function apiAddPatient(patientData) {
  const payload = {
    name:      patientData.name,
    symptoms:  patientData.symptoms,
    doctorId:  patientData.doctorId,
    doctorName: patientData.doctorName || patientData.doctorId,
    date: patientData.date || getTodayIST(),
    time: patientData.time || getCurrentTimeIST(),
    age:           patientData.age          || '',
    phone:         patientData.phone        || '',
    whatsapp:      patientData.whatsapp     || '',
    gender:        patientData.gender       || 'male',
    notes:         patientData.notes        || '',
    totalFee:      patientData.totalFee     ?? 0,
    paid:          patientData.paid         ?? 0,
    dues:          patientData.dues         ?? Math.max(0, (patientData.totalFee || 0) - (patientData.paid || 0)),
    paymentMethod: patientData.paymentMethod || 'cash',
    isReturnVisit: patientData.isReturnVisit || false,
  };

  return request('/patients', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdatePatientStatus(patientId, status) {
  return request(`/patients/${patientId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function apiUpdateFollowUp(patientId, followUpDate, followUpNote) {
  return request(`/patients/${patientId}/followup`, {
    method: 'PATCH',
    body: JSON.stringify({ followUpDate, followUpNote }),
  });
}

// ── Super Admin ───────────────────────────────────────────────────────────────
export async function apiSuperGetClinics() {
  return request('/superadmin/clinics');
}

export async function apiSuperGetClinic(clinicId) {
  return request(`/superadmin/clinics/${clinicId}`);
}

export async function apiSuperDeleteClinic(clinicId) {
  return request(`/superadmin/clinics/${clinicId}`, { method: 'DELETE' });
}

export async function apiSuperSetPlan(clinicId, plan) {
  return request(`/superadmin/clinics/${clinicId}/plan`, {
    method: 'PATCH',
    body: JSON.stringify({ plan }),
  });
}

// ── Queue / SMS ───────────────────────────────────────────────────────────────
export async function apiSendTokenSMS(patientId) {
  return request('/queue/send-sms', {
    method: 'POST',
    body: JSON.stringify({ patientId }),
  });
}

export async function apiGetQueueStatus(sessionToken) {
  const res  = await fetch(`${BASE}/queue/track/${sessionToken}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Queue session not found');
  return data;
}