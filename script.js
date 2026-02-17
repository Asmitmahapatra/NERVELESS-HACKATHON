const API_BASE = "/api";
let token = localStorage.getItem("authToken") || "";
let currentUser = null;

function escapeHtml(unsafe) {
  return String(unsafe || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setListState(container, { variant = "info", title = "", detail = "" } = {}) {
  if (!container) return;
  const safeTitle = escapeHtml(title);
  const safeDetail = escapeHtml(detail);
  container.dataset.state = variant;
  container.innerHTML = `
    <div style="padding: 0.75rem 0; opacity: 0.9;">
      <strong>${safeTitle}</strong>
      ${safeDetail ? `<div>${safeDetail}</div>` : ""}
    </div>
  `;
}

function setToken(newToken) {
  token = newToken || "";
  if (token) localStorage.setItem("authToken", token);
  else localStorage.removeItem("authToken");
}

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

  let data = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? { message: text } : {};
  }

  if (!response.ok) throw new Error(data.error || "API Error");
  return data;
};

function logout() {
  setToken("");
  currentUser = null;
  window.location.href = "index.html";
}

function showTab(tab) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const tabs = document.querySelectorAll(".role-tabs .tab");
  if (!loginForm || !registerForm || !tabs.length) return;

  const isLogin = tab === "login";
  loginForm.style.display = isLogin ? "block" : "none";
  registerForm.style.display = isLogin ? "none" : "block";

  tabs.forEach((t) => t.classList.remove("active"));
  const activeIndex = isLogin ? 0 : 1;
  if (tabs[activeIndex]) tabs[activeIndex].classList.add("active");
}

function selectRole(role) {
  localStorage.setItem("preferredRole", role);
  window.location.href = "login.html";
}

// AUTH - Login/Register
async function loginUser(email, password) {
  const data = await apiCall("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  currentUser = data.user;
  return data;
}

async function registerUser(userData) {
  const data = await apiCall("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
  setToken(data.token);
  currentUser = data.user;
  return data;
}

// DATA FETCHING - Dashboard, Jobs, Events
async function getMatches() {
  return await apiCall("/users/matches");
}
async function getConnections() {
  return await apiCall("/users/connections");
}
async function getJobs(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return await apiCall(`/jobs${suffix}`);
}
async function getEvents(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return await apiCall(`/events${suffix}`);
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

  // If user is on dashboard, refresh counts/lists.
  if (document.getElementById("welcomeMsg") && document.getElementById("topMatches")) {
    try {
      await loadDashboard();
    } catch {
      // ignore
    }
  }
}
async function applyJob(jobId) {
  await apiCall(`/jobs/${jobId}/apply`);
  alert("✅ Applied!");

  if (document.querySelector(".job-list")) {
    try {
      await loadJobsPage();
    } catch {
      // ignore
    }
  }
}
async function rsvpEvent(eventId) {
  await apiCall(`/events/${eventId}/rsvp`);
  alert("✅ RSVP Confirmed!");

  if (document.querySelector(".event-list")) {
    try {
      await loadEventsPage();
    } catch {
      // ignore
    }
  }
}

// MAIN HANDLERS
async function handleAuthSubmit(e) {
  e.preventDefault();
  const isLogin = document.getElementById("loginForm").style.display !== "none";

  try {
    if (isLogin) {
      const result = await loginUser(
        document.getElementById("loginEmail").value,
        document.getElementById("loginPassword").value,
      );
      const role = result?.user?.role;
      if (role === "admin") window.location.href = "admin.html";
      else window.location.href = "dashboard.html";
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

    const matches = await getMatches();
    const connections = await getConnections();

    const matchesCountEl = document.getElementById("matchesCount");
    const connectionsCountEl = document.getElementById("connectionsCount");
    const matchScoreEl = document.getElementById("matchScore");

    if (matchesCountEl) matchesCountEl.textContent = String(matches.length);
    if (connectionsCountEl) connectionsCountEl.textContent = String(connections.length);

    if (matchScoreEl) {
      const avg = matches.length
        ? Math.round(matches.reduce((sum, m) => sum + (Number(m.matchScore) || 0), 0) / matches.length)
        : 0;
      matchScoreEl.textContent = `${avg}%`;
    }

    const panel = document.getElementById("topMatches");
    const panelTitle = document.querySelector(".dashboard-grid .card h3");

    const renderMatches = () => {
      if (panelTitle) panelTitle.innerHTML = '<i class="fas fa-users"></i> Top Matches Today';
      if (!panel) return;
      if (!matches.length) {
        panel.innerHTML = '<div class="connection"><strong>No matches yet.</strong></div>';
        return;
      }
      panel.innerHTML = matches
        .slice(0, 10)
        .map(
          (m) => `
            <div class="connection" onclick="connectUser('${m._id}')">
                <strong>${m.name}</strong> <span>${m.matchScore}%</span>
            </div>
        `,
        )
        .join("");
    };

    const renderConnections = () => {
      if (panelTitle) panelTitle.innerHTML = '<i class="fas fa-user-check"></i> Your Connections';
      if (!panel) return;
      if (!connections.length) {
        panel.innerHTML = '<div class="connection"><strong>No connections yet.</strong> <span>Connect with a match</span></div>';
        return;
      }
      panel.innerHTML = connections
        .slice(0, 10)
        .map(
          (c) => `
            <div class="connection">
                <strong>${c.name}</strong> <span>${(c.role || "").toUpperCase()}</span>
            </div>
        `,
        )
        .join("");
    };

    // Wire stat cards to toggle views (only on dashboard page)
    const matchesCard = matchesCountEl?.closest(".stat-card");
    const connectionsCard = connectionsCountEl?.closest(".stat-card");
    const scoreCard = matchScoreEl?.closest(".stat-card");

    if (matchesCard && !matchesCard.dataset.bound) {
      matchesCard.dataset.bound = "1";
      matchesCard.style.cursor = "pointer";
      matchesCard.addEventListener("click", renderMatches);
    }
    if (connectionsCard && !connectionsCard.dataset.bound) {
      connectionsCard.dataset.bound = "1";
      connectionsCard.style.cursor = "pointer";
      connectionsCard.addEventListener("click", renderConnections);
    }
    if (scoreCard && !scoreCard.dataset.bound) {
      scoreCard.dataset.bound = "1";
      scoreCard.style.cursor = "pointer";
      scoreCard.addEventListener("click", renderMatches);
    }

    // Default view
    renderMatches();
  } catch (error) {
    alert("Session expired. Logging out...");
    logout();
  }
}

async function loadJobsPage() {
  const list = document.querySelector(".job-list");
  if (!list) return;

  const filtersRow = document.querySelector(".filters-row");
  const filterSelects = filtersRow
    ? Array.from(filtersRow.querySelectorAll("select.filter-select"))
    : [];
  const filterButton = filtersRow
    ? filtersRow.querySelector("button.btn-primary")
    : null;

  const mapJobType = (label) => {
    const v = String(label || "").toLowerCase();
    if (v.includes("full")) return "fulltime";
    if (v.includes("intern")) return "internship";
    if (v.includes("contract")) return "contract";
    return "";
  };

  const getFilterValues = () => {
    const [_domainSel, locationSel, typeSel] = filterSelects;
    const location =
      locationSel?.value && !String(locationSel.value).toLowerCase().includes("all")
        ? locationSel.value
        : "";
    const type =
      typeSel?.value && !String(typeSel.value).toLowerCase().includes("all")
        ? mapJobType(typeSel.value)
        : "";

    return { location, type };
  };

  async function renderJobs() {
    setListState(list, { variant: "loading", title: "Loading jobs…" });

    try {
      const payload = await getJobs(getFilterValues());
      const jobs = payload.jobs || [];
      if (!jobs.length) {
        return setListState(list, {
          variant: "empty",
          title: "No jobs found",
          detail: token ? "Try changing filters." : "Login to apply to jobs.",
        });
      }

      list.innerHTML = jobs
        .map(
          (job) => `
          <div class="job-card">
            <div class="job-header">
              <h3>${escapeHtml(job.title)}</h3>
              <div class="job-meta">
                <span class="job-company">${escapeHtml(job.company || job.postedBy?.name || "")}</span>
                <span class="job-location">• ${escapeHtml(job.location || "")}</span>
                <span class="job-type">${escapeHtml(job.type || "")}</span>
              </div>
            </div>
            <div class="job-details">
              <div class="job-skills">${escapeHtml((job.skills || []).slice(0, 4).join(" • "))}</div>
              <div class="job-info">${job.salary ? `Salary: ${escapeHtml(job.salary)}` : ""}</div>
            </div>
            <div class="job-actions">
              <button class="btn-primary" onclick="applyJob('${job._id}')">
                <i class="fas fa-paper-plane"></i> Apply Now
              </button>
            </div>
          </div>
        `,
        )
        .join("");
    } catch {
      setListState(list, {
        variant: "error",
        title: "Could not load jobs",
        detail: "Please refresh and try again.",
      });
    }
  }

  if (filterButton && !filterButton.dataset.bound) {
    filterButton.dataset.bound = "1";
    filterButton.addEventListener("click", (e) => {
      e.preventDefault();
      renderJobs();
    });
  }

  await renderJobs();
}

async function loadEventsPage() {
  const list = document.querySelector(".event-list");
  if (!list) return;

  const pastContainer = document.querySelector(".past-events");
  setListState(list, { variant: "loading", title: "Loading events…" });
  if (pastContainer) {
    setListState(pastContainer, { variant: "loading", title: "Loading your past events…" });
  }

  try {
    const payload = await getEvents();
    const events = payload.events || [];
    if (!events.length) {
      setListState(list, {
        variant: "empty",
        title: "No upcoming events",
        detail: "Check back later.",
      });
    } else {

      list.innerHTML = events
        .map((evt) => {
          const date = evt.date ? new Date(evt.date) : null;
          const dateStr = date
            ? date.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "";
          const timeStr = evt.time || "";
          const spotsLeft = evt.maxSpots
            ? Math.max(0, evt.maxSpots - (evt.rsvps?.length || 0))
            : null;
          const spotsText = spotsLeft === null ? "RSVP" : `RSVP (${spotsLeft} spots left)`;
          const typeLabel = evt.isOnline
            ? "Online"
            : `Offline${evt.location ? ` • ${evt.location}` : ""}`;

          return `
            <div class="event-card">
              <div class="event-header">
                <h4>${escapeHtml(evt.title)}</h4>
                <div class="event-date">
                  <i class="fas fa-calendar-day"></i> ${escapeHtml(dateStr)}
                  ${timeStr ? `<span class="event-time">${escapeHtml(timeStr)}</span>` : ""}
                </div>
              </div>
              <p>${escapeHtml(evt.description || "")}</p>
              <div class="event-actions">
                <button class="btn-primary" onclick="rsvpEvent('${evt._id}')">
                  <i class="fas fa-check-circle"></i> ${escapeHtml(spotsText)}
                </button>
                <span class="event-type">${escapeHtml(typeLabel)}</span>
              </div>
            </div>
          `;
        })
        .join("");
    }

    if (pastContainer) {
      if (!token) {
        setListState(pastContainer, {
          variant: "info",
          title: "Login to see your past events.",
        });
      } else {
        try {
          const mine = await apiCall("/events/my-events");
          const arr = Array.isArray(mine) ? mine : [];
          const now = new Date();
          const past = arr.filter((e) => e?.date && new Date(e.date) < now);
          if (!past.length) {
            setListState(pastContainer, {
              variant: "empty",
              title: "No past events yet",
            });
          } else {
            pastContainer.innerHTML = past
              .slice(0, 5)
              .map((e) => {
                const d = e.date ? new Date(e.date) : null;
                const ds = d
                  ? d.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "";
                return `<div>✅ ${escapeHtml(e.title || "Event")} <span>${escapeHtml(ds)}</span></div>`;
              })
              .join("");
          }
        } catch {
          setListState(pastContainer, {
            variant: "error",
            title: "Could not load past events",
          });
        }
      }
    }
  } catch {
    setListState(list, {
      variant: "error",
      title: "Could not load events",
      detail: "Please refresh and try again.",
    });
  }
}

function mapForumCategory(uiLabel) {
  const value = String(uiLabel || "").toLowerCase();
  if (value.includes("referral") || value.includes("job")) return "job";
  if (value.includes("event")) return "event";
  if (value.includes("higher") || value.includes("study") || value.includes("advice")) return "advice";
  return "general";
}

async function loadForumPage() {
  const postsContainer = document.querySelector(".forum-posts");
  const createButton = document.querySelector(".btn-primary.full-width");
  const input = document.querySelector(".post-input");
  const filter = document.querySelector(".forum-filter");
  if (!postsContainer) return;

  async function renderPosts() {
    try {
      setListState(postsContainer, { variant: "loading", title: "Loading discussions…" });
      const category = filter && filter.value && filter.value !== "All Categories" ? mapForumCategory(filter.value) : "";
      const payload = await apiCall(`/posts${category ? `?category=${encodeURIComponent(category)}` : ""}`);
      const posts = payload.posts || [];
      if (!posts.length) {
        return setListState(postsContainer, {
          variant: "empty",
          title: "No posts yet",
          detail: token ? "Be the first to post." : "Login to create a post.",
        });
      }

      postsContainer.innerHTML = posts
        .map(
          (p) => `
            <div class="forum-post" data-post-id="${p._id}">
              <div class="post-header">
                <img src="https://via.placeholder.com/40/667eea/ffffff?text=AL" class="post-avatar" />
                <div>
                  <strong>${p.author?.name || "Anonymous"}</strong>
                  <span class="post-time">• ${new Date(p.createdAt || Date.now()).toLocaleString()}</span>
                  <span class="post-category">${p.category || "general"}</span>
                </div>
              </div>
              <p>${escapeHtml(p.content)}</p>
              <div class="post-actions">
                <span class="like-btn" style="cursor:pointer"><i class="fas fa-heart"></i> ${(p.likes || []).length}</span>
                <span><i class="fas fa-comment"></i> ${(p.comments || []).length}</span>
              </div>
            </div>
          `,
        )
        .join("");
    } catch {
      setListState(postsContainer, {
        variant: "error",
        title: "Could not load posts",
        detail: "Please refresh and try again.",
      });
    }
  }

  postsContainer.addEventListener("click", async (e) => {
    const target = e.target.closest(".like-btn");
    if (!target) return;
    if (!token) return alert("Please login first");
    const postEl = e.target.closest(".forum-post");
    const postId = postEl?.getAttribute("data-post-id");
    if (!postId) return;
    try {
      await apiCall(`/posts/${postId}/like`, { method: "POST" });
      await renderPosts();
    } catch (err) {
      alert(err.message);
    }
  });

  if (filter) filter.addEventListener("change", renderPosts);

  if (createButton && input) {
    createButton.addEventListener("click", async () => {
      if (!token) return alert("Please login first");
      const content = input.value.trim();
      if (!content) return alert("Write something first");
      const category = filter && filter.value && filter.value !== "All Categories" ? mapForumCategory(filter.value) : "general";
      try {
        await apiCall("/posts", {
          method: "POST",
          body: JSON.stringify({ content, category }),
        });
        input.value = "";
        await renderPosts();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  await renderPosts();
}

async function loadMentorsPage() {
  const grid = document.querySelector(".mentor-grid");
  if (!grid) return;

  setListState(grid, { variant: "loading", title: "Loading mentors…" });

  function getSelectedTime() {
    const active = document.querySelector(".time-slot.active");
    return active ? active.textContent.trim() : "";
  }

  document.querySelectorAll(".time-slot").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".time-slot").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  window.bookSession = async (mentorId) => {
    if (!token) return alert("Please login first");
    const dateInput = document.getElementById("mentorDate");
    const date = dateInput?.value;
    const time = getSelectedTime();
    if (!date) return alert("Select a date first");
    if (!time) return alert("Select a time slot first");

    try {
      await apiCall("/mentor/book", {
        method: "POST",
        body: JSON.stringify({ mentorId, date, time, topic: "Mentorship Session" }),
      });
      alert("✅ Session booked successfully!");
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  try {
    const mentors = await getMentors();
    if (!Array.isArray(mentors) || !mentors.length) {
      return setListState(grid, {
        variant: "empty",
        title: "No mentors available right now",
        detail: "Please check back later.",
      });
    }
    grid.innerHTML = mentors
      .map(
        (m) => `
          <div class="mentor-card">
            <div class="mentor-avatar">
              <img src="${escapeHtml(m.profilePic || "https://via.placeholder.com/80/667eea/ffffff?text=AL")}" alt="${escapeHtml(m.name)}" />
            </div>
            <h4>${escapeHtml(m.name)}</h4>
            <p class="mentor-role">${escapeHtml(m.industry || "Alumni Mentor")}</p>
            <div class="mentor-skills">${escapeHtml((m.skills || []).slice(0, 4).join(" • "))}</div>
            <div class="mentor-actions">
              <button class="btn-primary" onclick="bookSession('${m._id}')">
                <i class="fas fa-calendar-plus"></i> Book Now
              </button>
            </div>
          </div>
        `,
      )
      .join("");
  } catch {
    setListState(grid, {
      variant: "error",
      title: "Could not load mentors",
      detail: "Please refresh and try again.",
    });
  }
}

async function loadAdminPage() {
  const isAdminPage = document.title.toLowerCase().includes("admin") || document.querySelector(".admin-actions");
  if (!isAdminPage) return;

  if (!token) return (window.location.href = "login.html");

  try {
    const profile = await apiCall("/auth/profile");
    const user = profile?.user;
    if (!user || user.role !== "admin") {
      alert("Admin access required");
      return (window.location.href = "dashboard.html");
    }
  } catch {
    return (window.location.href = "login.html");
  }

  const buttons = document.querySelectorAll(".admin-actions .admin-btn");
  const manageUsersBtn = buttons[0];
  const verifyJobsBtn = buttons[1];
  const eventsBtn = buttons[2];
  const exportBtn = buttons[3];

  if (verifyJobsBtn) verifyJobsBtn.addEventListener("click", () => (window.location.href = "jobs.html"));
  if (eventsBtn) eventsBtn.addEventListener("click", () => (window.location.href = "events.html"));

  async function downloadExport() {
    if (!token) return alert("Please login as admin first");
    try {
      const data = await apiCall("/admin/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "alumlink-export.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    }
  }

  if (exportBtn) exportBtn.addEventListener("click", downloadExport);
  if (manageUsersBtn) manageUsersBtn.addEventListener("click", downloadExport);

  // Live stats
  try {
    const stats = await apiCall("/admin/stats");

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    setText("adminTotalUsers", stats.users ?? "—");
    setText("adminActiveMentors", stats.mentors ?? "—");
    setText("adminUsersToday", stats.usersToday ?? "—");
    setText("adminJobsToday", stats.jobsToday ?? "—");
    setText("adminBookingsToday", stats.bookingsToday ?? "—");
  } catch {
    // ignore
  }
}

function initPreferredRoleOnLoginPage() {
  const role = localStorage.getItem("preferredRole");
  if (!role) return;
  const roleSelect = document.getElementById("regRole");
  if (!roleSelect) return;
  roleSelect.value = role;
}

function initPage() {
  // login/register
  if (document.getElementById("loginForm") && document.getElementById("registerForm")) {
    initPreferredRoleOnLoginPage();
  }

  // page-specific loaders
  if (document.getElementById("welcomeMsg") && document.getElementById("topMatches")) loadDashboard();
  if (document.querySelector(".job-list")) loadJobsPage();
  if (document.querySelector(".event-list")) loadEventsPage();
  if (document.querySelector(".forum-posts")) loadForumPage();
  if (document.querySelector(".mentor-grid")) loadMentorsPage();
  if (document.querySelector(".admin-actions")) loadAdminPage();
}

document.addEventListener("DOMContentLoaded", initPage);
