const express = require("express");
const Post = require("../models/Post");
const auth = require("../middleware/auth");
const router = express.Router();

// Get posts (with filters)
router.get("/", async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (search) filter.content = { $regex: search, $options: "i" };

    const posts = await Post.find(filter)
      .populate("author", "name")
      .populate("likes", "name")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(filter);

    res.json({
      posts,
      pagination: {
        current: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create post
router.post("/", auth, async (req, res) => {
  try {
    const post = new Post({
      ...req.body,
      author: req.user.userId,
    });
    await post.save();

    const populatedPost = await Post.findById(post._id).populate(
      "author",
      "name",
    );

    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like post
router.post("/:postId/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    const userIndex = post.likes.indexOf(req.user.userId);
    if (userIndex > -1) {
      // Unlike
      post.likes.splice(userIndex, 1);
    } else {
      // Like
      post.likes.push(req.user.userId);
    }

    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate("author", "name")
      .populate("likes", "name");

    res.json({
      success: true,
      likes: post.likes.length,
      post: populatedPost,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment
router.post("/:postId/comment", auth, async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      {
        $push: {
          comments: {
            user: req.user.userId,
            content,
          },
        },
      },
      { new: true },
    ).populate("author", "name");

    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get my posts
router.get("/my-posts", auth, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user.userId })
      .populate("likes", "name")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
