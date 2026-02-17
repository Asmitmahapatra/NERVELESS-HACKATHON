// Replace ENTIRE script.js with this COMPLETE version:
const API_BASE = "/api";
let token = localStorage.getItem("authToken") || "";
let currentUser = null;

// API Helper (ALL endpoints)
const apiCall = async (endpoint, options = {}) => {
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) throw new Error(data.error || "API Error");
  return data;
};

// AUTH - Login/Register
async function loginUser(email, password) {
  const data = await apiCall("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem("authToken", data.token);
  token = data.token;
  currentUser = data.user;
  return data;
}

async function registerUser(userData) {
  const data = await apiCall("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
  localStorage.setItem("authToken", data.token);
  token = data.token;
  currentUser = data.user;
  return data;
}

// DATA FETCHING - Dashboard, Jobs, Events
async function getMatches() {
  return await apiCall("/users/matches");
}
async function getJobs() {
  return await apiCall("/jobs");
}
async function getEvents() {
  return await apiCall("/events");
}
async function getPosts() {
  return await apiCall("/posts");
}
async function getMentors() {
  return await apiCall("/mentor/mentors");
}

// ACTIONS - Connect, Apply, RSVP
async function connectUser(userId) {
  await apiCall(`/users/connect/${userId}`);
  alert("✅ Connected!");
}
async function applyJob(jobId) {
  await apiCall(`/jobs/${jobId}/apply`);
  alert("✅ Applied!");
}
async function rsvpEvent(eventId) {
  await apiCall(`/events/${eventId}/rsvp`);
  alert("✅ RSVP Confirmed!");
}

// MAIN HANDLERS
async function handleAuthSubmit(e) {
  e.preventDefault();
  const isLogin = document.getElementById("loginForm").style.display !== "none";

  try {
    if (isLogin) {
      await loginUser(
        document.getElementById("loginEmail").value,
        document.getElementById("loginPassword").value,
      );
      window.location.href = "dashboard.html";
    } else {
      await registerUser({
        name: document.getElementById("regName").value,
        email: document.getElementById("regEmail").value,
        password: document.getElementById("regPassword").value,
        role: document.getElementById("regRole").value,
        skills: document
          .getElementById("regSkills")
          .value.split(",")
          .map((s) => s.trim()),
        industry: document.getElementById("regIndustry")?.value || "",
        location: document.getElementById("regLocation")?.value || "",
      });
      alert("✅ Registered! Please login.");
      showTab("login");
    }
  } catch (error) {
    alert("❌ " + error.message);
  }
}

async function demoMatch() {
  const skills = document.getElementById("quickSkills").value;
  if (!skills) return alert("Enter skills!");

  try {
    const data = await apiCall("/users/ai-match", {
      method: "POST",
      body: JSON.stringify({ skills: skills.split(",").map((s) => s.trim()) }),
    });

    document.getElementById("matchResults").innerHTML = `
            <h3>🔥 Top Matches (${data.matches.length} found)</h3>
            <div class="demo-matches">
                ${data.matches
                  .map(
                    (m) => `
                    <div class="match-card">
                        <div>
                            <strong>${m.name}</strong> (${m.role})
                            <div>${m.skills?.slice(0, 2).join(", ")}...</div>
                            <small>${m.location} • ${m.industry}</small>
                        </div>
                        <div>${m.matchScore}%</div>
                        <button class="btn-small" onclick="connectUser('${m._id}')">Connect</button>
                    </div>
                `,
                  )
                  .join("")}
            </div>`;
  } catch (error) {
    alert("Demo mode: " + error.message);
  }
}

// DASHBOARD LOADING
async function loadDashboard() {
  if (!token) return (window.location.href = "login.html");

  try {
    currentUser = (await apiCall("/auth/profile")).user;
    document.getElementById("welcomeMsg").innerHTML =
      `Welcome, <strong>${currentUser.name}</strong> <span class="role-badge ${currentUser.role}">${currentUser.role}</span>`;

    // Load matches
    const matches = await getMatches();
    document.getElementById("topMatches").innerHTML = matches
      .slice(0, 5)
      .map(
        (m) => `
            <div class="connection" onclick="connectUser('${m._id}')">
                ${m.name} <span>${m.matchScore}%</span>
            </div>
        `,
      )
      .join("");
  } catch (error) {
    alert("Session expired. Logging out...");
    logout();
  }
}
