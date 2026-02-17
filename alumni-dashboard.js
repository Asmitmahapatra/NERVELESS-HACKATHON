// Minimal alumni dashboard wiring: loads current user profile
// and replaces placeholder names so the page feels real.

document.addEventListener("DOMContentLoaded", async () => {
  try {
    if (typeof token === "undefined") return;
    if (!token) return (window.location.href = "login.html");

    const profile = await apiCall("/auth/profile");
    const user = profile?.user;
    if (!user) return;

    const sidebarName = document.querySelector(".sidebar-profile h3");
    if (sidebarName) sidebarName.textContent = user.name;

    const profileName = document.querySelector(".profile-info h3");
    if (profileName) profileName.textContent = user.name;
  } catch {
    // If anything fails, keep static content.
  }
});
