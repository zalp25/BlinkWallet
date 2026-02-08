const API_BASE = "http://localhost:8080";
const DEFAULT_USER_ID = 1;

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function loadRemoteUser(userId = DEFAULT_USER_ID) {
  try {
    const res = await fetch(`${API_BASE}/user?id=${userId}`);
    if (!res.ok) return null;
    return await safeJson(res);
  } catch {
    return null;
  }
}

export async function registerUser(payload) {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await safeJson(res);
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: null };
  }
}

export async function loginUser(payload) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await safeJson(res);
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: null };
  }
}

export async function saveRemoteUser(userId = DEFAULT_USER_ID, name) {
  try {
    const res = await fetch(`${API_BASE}/user`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user_id: userId, name })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function updateUserTag(userId = DEFAULT_USER_ID, tag) {
  try {
    const res = await fetch(`${API_BASE}/user/tag`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user_id: userId, tag })
    });
    const data = await safeJson(res);
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: null };
  }
}

export async function updateUserPassword(userId = DEFAULT_USER_ID, password) {
  try {
    const res = await fetch(`${API_BASE}/user/password`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user_id: userId, password })
    });
    const data = await safeJson(res);
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: null };
  }
}

export async function loadRemoteBalances(userId = DEFAULT_USER_ID) {
  try {
    const res = await fetch(`${API_BASE}/balances?id=${userId}`);
    if (!res.ok) return null;
    const data = await safeJson(res);
    return data?.balances ?? null;
  } catch {
    return null;
  }
}

export async function saveRemoteBalances(userId = DEFAULT_USER_ID, balances) {
  try {
    const res = await fetch(`${API_BASE}/balances`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user_id: userId, balances })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function transferToUser(payload) {
  try {
    const res = await fetch(`${API_BASE}/transfer`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await safeJson(res);
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: null };
  }
}

export { API_BASE, DEFAULT_USER_ID };
