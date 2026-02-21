import { useCallback, useEffect, useState } from "react";
import EmptyState from "../components/EmptyState";
import Loader from "../components/Loader";
import PageHeader from "../components/PageHeader";
import { apiRequest } from "../lib/api";

export default function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [search, setSearch] = useState("");
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/posts", {
        params: {
          ...(category ? { category } : {}),
          ...(search.trim() ? { search: search.trim() } : {}),
        },
      });
      setPosts(data.posts || []);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  async function createPost() {
    if (!content.trim()) return;
    try {
      await apiRequest("/posts", {
        method: "POST",
        body: { content: content.trim(), category },
      });
      setContent("");
      loadPosts();
    } catch (err) {
      alert(err.message);
    }
  }

  async function likePost(id) {
    try {
      await apiRequest(`/posts/${id}/like`, { method: "POST" });
      loadPosts();
    } catch (err) {
      alert(err.message);
    }
  }

  async function commentOnPost(postId) {
    const value = (comments[postId] || "").trim();
    if (!value) return;
    try {
      await apiRequest(`/posts/${postId}/comment`, {
        method: "POST",
        body: { content: value },
      });
      setComments((prev) => ({ ...prev, [postId]: "" }));
      loadPosts();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="grid">
      <PageHeader
        title="Community Forum"
        subtitle="Ask for referrals, share updates, and learn from the alumni network."
      />

      <section className="card">
        <div className="grid mobile-col" style={{ gridTemplateColumns: "1fr auto auto auto", alignItems: "center" }}>
          <textarea className="textarea" rows="3" placeholder="Share an update, ask for advice, or start a discussion..." value={content} onChange={(e) => setContent(e.target.value)} />
          <input className="input" placeholder="Search posts" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="general">General</option>
            <option value="job">Jobs</option>
            <option value="event">Events</option>
            <option value="advice">Advice</option>
          </select>
          <button className="btn btn-primary" onClick={createPost}>Post</button>
        </div>
      </section>

      {loading ? (
        <Loader label="Loading discussions..." />
      ) : (
        <section className="grid">
          {posts.map((post) => (
            <article className="card" key={post._id}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <strong>{post.author?.name || "Anonymous"}</strong>
                <span className="badge">{post.category}</span>
              </div>
              <p>{post.content}</p>
              {(post.comments || []).length > 0 ? (
                <div className="stack" style={{ marginBottom: 10 }}>
                  {(post.comments || []).slice(-2).map((comment, idx) => (
                    <div key={`${post._id}-comment-${idx}`} className="pill" style={{ borderRadius: 10 }}>
                      {comment.content}
                    </div>
                  ))}
                </div>
              ) : null}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="muted">{new Date(post.createdAt || Date.now()).toLocaleString()}</span>
                <button className="btn btn-soft" onClick={() => likePost(post._id)}>
                  ❤️ {(post.likes || []).length}
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginTop: 10 }}>
                <input
                  className="input"
                  placeholder="Write a comment"
                  value={comments[post._id] || ""}
                  onChange={(e) => setComments((prev) => ({ ...prev, [post._id]: e.target.value }))}
                />
                <button className="btn btn-soft" onClick={() => commentOnPost(post._id)}>Comment</button>
              </div>
            </article>
          ))}
          {!posts.length && <EmptyState title="No posts yet" detail="Try changing category/search or create the first discussion." />}
        </section>
      )}
    </div>
  );
}
