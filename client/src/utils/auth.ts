export function isTokenExpired(token: string) {
  if (!token) return true;
  const payload = JSON.parse(atob(token.split(".")[1]));
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const res = await fetch(
      "https://web-production-6baf3.up.railway.app/api/auth/token/refresh/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      }
    );

    if (!res.ok) throw new Error("Refresh failed");

    const data = await res.json();
    localStorage.setItem("accessToken", data.access);
    return data.access;
  } catch (err) {
    console.error("Token refresh error:", err);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    return null;
  }
}