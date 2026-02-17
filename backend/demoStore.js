const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");

function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];
  return skills.map((s) => String(s || "").trim()).filter(Boolean);
}

const state = {
  users: [],
  jobs: [],
  events: [],
  posts: [],
  bookings: [],
};

function hydratePost(post) {
  if (!post) return null;
  const author = state.users.find((u) => u._id === String(post.author));
  return {
    ...post,
    author: author ? { _id: author._id, name: author.name } : null,
  };
}

function seedOnce() {
  if (state.users.length > 0) return;

  const now = new Date();

  const users = [
    {
      _id: randomUUID(),
      name: "Priya Sharma",
      email: "priya@demo.com",
      role: "alumni",
      passwordHash: bcrypt.hashSync("password123", 10),
      skills: ["Python", "ML", "Cloud"],
      industry: "Tech",
      location: "Bangalore",
      connections: [],
      isActive: true,
      profilePic: "",
      joined: now,
    },
    {
      _id: randomUUID(),
      name: "Rahul Patel",
      email: "rahul@demo.com",
      role: "alumni",
      passwordHash: bcrypt.hashSync("password123", 10),
      skills: ["React", "Node.js", "System Design"],
      industry: "Tech",
      location: "Mumbai",
      connections: [],
      isActive: true,
      profilePic: "",
      joined: now,
    },
    {
      _id: randomUUID(),
      name: "Anita Singh",
      email: "anita@demo.com",
      role: "student",
      passwordHash: bcrypt.hashSync("password123", 10),
      skills: ["Java", "DSA", "Backend"],
      industry: "Software",
      location: "Delhi",
      connections: [],
      isActive: true,
      profilePic: "",
      joined: now,
    },
    {
      _id: randomUUID(),
      name: "Admin",
      email: "admin@demo.com",
      role: "admin",
      passwordHash: bcrypt.hashSync("password123", 10),
      skills: [],
      industry: "",
      location: "",
      connections: [],
      isActive: true,
      profilePic: "",
      joined: now,
    },
  ];

  state.users.push(...users);

  state.jobs.push(
    {
      _id: randomUUID(),
      title: "SDE Intern",
      company: "Google",
      location: "Bangalore",
      type: "internship",
      salary: "₹50k/month",
      description: "Internship role for 3 months.",
      skills: ["Python", "ML"],
      postedBy: users[0]._id,
      applications: [],
      status: "open",
      postedAt: now,
    },
    {
      _id: randomUUID(),
      title: "Marketing Associate",
      company: "McKinsey",
      location: "Mumbai",
      type: "fulltime",
      salary: "₹15-18 LPA",
      description: "Marketing + analytics role.",
      skills: ["Strategy", "Analytics"],
      postedBy: users[1]._id,
      applications: [],
      status: "open",
      postedAt: now,
    },
  );

  state.events.push(
    {
      _id: randomUUID(),
      title: "Tech Careers AMA with Alumni",
      description: "Live Q&A about tech careers.",
      date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      time: "7:00 PM IST",
      location: "Online",
      type: "ama",
      organizer: users[0]._id,
      rsvps: [],
      maxSpots: 50,
      isOnline: true,
      link: "",
      status: "upcoming",
    },
  );

  state.posts.push(
    {
      _id: randomUUID(),
      title: "Need referral advice",
      content: "Anyone willing to refer for SDE roles?",
      category: "job",
      author: users[0]._id,
      likes: [],
      comments: [],
      createdAt: now,
    },
  );
}

seedOnce();

async function createUser({ name, email, password, role, skills, industry, location }) {
  const user = {
    _id: randomUUID(),
    name: String(name || "").trim(),
    email: String(email || "").toLowerCase().trim(),
    role,
    skills: normalizeSkills(skills),
    industry: String(industry || ""),
    location: String(location || ""),
    connections: [],
    isActive: true,
    profilePic: "",
    joined: new Date(),
    passwordHash: await bcrypt.hash(String(password || ""), 12),
  };

  state.users.push(user);
  return sanitizeUser(user);
}

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return { ...rest };
}

async function findUserByEmail(email) {
  const normalized = String(email || "").toLowerCase().trim();
  const user = state.users.find((u) => u.email === normalized);
  return user ? { ...user } : null;
}

async function findUserById(id) {
  const user = state.users.find((u) => u._id === String(id));
  return user ? sanitizeUser(user) : null;
}

async function listUsers() {
  return state.users.map((u) => sanitizeUser(u));
}

async function comparePassword(userRecord, password) {
  if (!userRecord) return false;
  return bcrypt.compare(String(password || ""), userRecord.passwordHash);
}

async function addConnection(fromUserId, toUserId) {
  const from = state.users.find((u) => u._id === String(fromUserId));
  const to = state.users.find((u) => u._id === String(toUserId));
  if (!from || !to) return false;
  if (!from.connections.includes(to._id)) from.connections.push(to._id);
  return true;
}

function paginate(items, page = 1, limit = 10) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.max(1, Number(limit) || 10);
  const start = (p - 1) * l;
  return {
    items: items.slice(start, start + l),
    pagination: {
      current: p,
      totalPages: Math.ceil(items.length / l),
      total: items.length,
    },
  };
}

async function listJobs({ location, type, skills, page, limit }) {
  let jobs = state.jobs.filter((j) => j.status === "open");
  if (location) {
    const q = String(location).toLowerCase();
    jobs = jobs.filter((j) => String(j.location || "").toLowerCase().includes(q));
  }
  if (type) jobs = jobs.filter((j) => j.type === type);
  if (skills) jobs = jobs.filter((j) => (j.skills || []).includes(skills));

  jobs = jobs.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
  return paginate(jobs, page, limit);
}

async function applyToJob(jobId, userId) {
  const job = state.jobs.find((j) => j._id === String(jobId));
  if (!job || job.status === "closed") return { ok: false, error: "Job not found or closed" };
  if (!job.applications.includes(String(userId))) job.applications.push(String(userId));
  return { ok: true };
}

async function listEvents({ type, location, page, limit }) {
  const now = new Date();
  let events = state.events.filter((e) => new Date(e.date) >= now);
  if (type) events = events.filter((e) => e.type === type);
  if (location) {
    const q = String(location).toLowerCase();
    events = events.filter((e) => String(e.location || "").toLowerCase().includes(q));
  }

  events = events.sort((a, b) => new Date(a.date) - new Date(b.date));
  return paginate(events, page, limit);
}

async function rsvpEvent(eventId, userId) {
  const event = state.events.find((e) => e._id === String(eventId));
  if (!event || event.status === "completed") {
    return { ok: false, error: "Event not found or completed" };
  }
  if (!event.rsvps.includes(String(userId))) {
    if (event.maxSpots && event.rsvps.length >= event.maxSpots) {
      return { ok: false, error: "Event is full" };
    }
    event.rsvps.push(String(userId));
  }
  return {
    ok: true,
    spotsLeft: event.maxSpots ? event.maxSpots - event.rsvps.length : null,
    event: { ...event },
  };
}

async function listPosts({ category, search, page, limit }) {
  let posts = [...state.posts];
  if (category) posts = posts.filter((p) => p.category === category);
  if (search) {
    const q = String(search).toLowerCase();
    posts = posts.filter((p) => String(p.content || "").toLowerCase().includes(q));
  }

  posts = posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const hydrated = posts.map((p) => hydratePost(p));
  return paginate(hydrated, page, limit);
}

async function createPost({ content, category = "general", authorId }) {
  const now = new Date();
  const post = {
    _id: randomUUID(),
    title: "",
    content: String(content || "").trim(),
    category: String(category || "general"),
    author: String(authorId),
    likes: [],
    comments: [],
    createdAt: now,
  };
  state.posts.unshift(post);
  return hydratePost(post);
}

async function togglePostLike(postId, userId) {
  const post = state.posts.find((p) => p._id === String(postId));
  if (!post) return null;
  const uid = String(userId);
  const idx = post.likes.indexOf(uid);
  if (idx > -1) post.likes.splice(idx, 1);
  else post.likes.push(uid);
  return hydratePost(post);
}

async function addPostComment(postId, userId, content) {
  const post = state.posts.find((p) => p._id === String(postId));
  if (!post) return null;
  post.comments.push({
    _id: randomUUID(),
    user: String(userId),
    content: String(content || "").trim(),
    createdAt: new Date(),
  });
  return hydratePost(post);
}

async function createBooking({ studentId, mentorId, date, time, topic }) {
  const booking = {
    _id: randomUUID(),
    student: String(studentId),
    mentor: String(mentorId),
    date: date ? new Date(date) : new Date(),
    time: String(time || ""),
    topic: String(topic || ""),
    status: "pending",
    createdAt: new Date(),
  };
  state.bookings.push(booking);
  return { ...booking };
}

async function listBookingsForUser({ userId, role }) {
  const uid = String(userId);
  const relevant = state.bookings.filter((b) =>
    role === "student" ? b.student === uid : b.mentor === uid,
  );
  return relevant
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((b) => ({ ...b }));
}

async function listMentors({ skills, location }) {
  let mentors = state.users
    .filter((u) => u.role === "alumni" && u.isActive)
    .map((u) => sanitizeUser(u));

  if (skills) {
    const wanted = String(skills)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    mentors = mentors.filter((m) => wanted.some((w) => (m.skills || []).includes(w)));
  }

  if (location) {
    const q = String(location).toLowerCase();
    mentors = mentors.filter((m) => String(m.location || "").toLowerCase().includes(q));
  }

  return mentors.map((m) => ({
    _id: m._id,
    name: m.name,
    skills: m.skills || [],
    industry: m.industry || "",
    location: m.location || "",
    profilePic: m.profilePic || "",
  }));
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  listUsers,
  comparePassword,
  addConnection,
  listJobs,
  applyToJob,
  listEvents,
  rsvpEvent,
  listPosts,
  createPost,
  togglePostLike,
  addPostComment,
  listMentors,
  createBooking,
  listBookingsForUser,
  _state: state,
};
