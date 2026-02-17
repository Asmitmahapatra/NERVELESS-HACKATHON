const User = require("./models/User");
const Job = require("./models/Job");
const Event = require("./models/Event");
const Post = require("./models/Post");

async function upsertUser({ name, email, role, password, skills, industry, location }) {
  const existing = await User.findOne({ email });
  if (existing) return existing;

  const user = new User({
    name,
    email,
    role,
    password,
    skills: skills || [],
    industry: industry || "",
    location: location || "",
  });

  await user.save();
  return user;
}

async function seedDemoData() {
  if (process.env.SEED_DEMO === "false") return;

  const priya = await upsertUser({
    name: "Priya Sharma",
    email: "priya@demo.com",
    role: "alumni",
    password: "password123",
    skills: ["Python", "ML", "Cloud"],
    industry: "Tech",
    location: "Bangalore",
  });

  const rahul = await upsertUser({
    name: "Rahul Patel",
    email: "rahul@demo.com",
    role: "alumni",
    password: "password123",
    skills: ["React", "Node.js", "System Design"],
    industry: "Tech",
    location: "Mumbai",
  });

  await upsertUser({
    name: "Anita Singh",
    email: "anita@demo.com",
    role: "student",
    password: "password123",
    skills: ["Java", "DSA", "Backend"],
    industry: "Software",
    location: "Delhi",
  });

  await upsertUser({
    name: "Admin",
    email: "admin@demo.com",
    role: "admin",
    password: "password123",
    skills: [],
    industry: "",
    location: "",
  });

  const hasJobs = (await Job.countDocuments({})) > 0;
  if (!hasJobs) {
    await Job.create([
      {
        title: "SDE Intern",
        company: "Google",
        location: "Bangalore",
        type: "internship",
        salary: "₹50k/month",
        description: "Internship role for 3 months.",
        skills: ["Python", "ML"],
        postedBy: priya._id,
        status: "open",
      },
      {
        title: "Marketing Associate",
        company: "McKinsey",
        location: "Mumbai",
        type: "fulltime",
        salary: "₹15-18 LPA",
        description: "Marketing + analytics role.",
        skills: ["Strategy", "Analytics"],
        postedBy: rahul._id,
        status: "open",
      },
    ]);
  }

  const hasEvents = (await Event.countDocuments({})) > 0;
  if (!hasEvents) {
    const now = new Date();
    await Event.create([
      {
        title: "Tech Careers AMA with Alumni",
        description: "Live Q&A about tech careers.",
        date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        time: "7:00 PM IST",
        location: "Online",
        type: "ama",
        organizer: priya._id,
        maxSpots: 50,
        isOnline: true,
        status: "upcoming",
      },
    ]);
  }

  const hasPosts = (await Post.countDocuments({})) > 0;
  if (!hasPosts) {
    await Post.create([
      {
        title: "Need referral advice",
        content: "Anyone willing to refer for SDE roles?",
        category: "job",
        author: priya._id,
      },
      {
        title: "MS applications",
        content: "Tips for MS CS applications and GRE planning?",
        category: "advice",
        author: rahul._id,
      },
    ]);
  }

  // eslint-disable-next-line no-console
  console.log("🌱 Demo seed ensured (users/jobs/events/posts)");
}

module.exports = { seedDemoData };
