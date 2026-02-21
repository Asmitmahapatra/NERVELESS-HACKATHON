import { useCallback, useEffect, useState } from "react";
import Loader from "../components/Loader";
import { apiRequest } from "../lib/api";

export default function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/posts", {
        params: category ? { category } : undefined,
      });
      setPosts(data.posts || []);
    } finally {
      setLoading(false);
    }
  }, [category]);

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

  return (
    <div className="grid">
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Community Forum</h2>
        <div className="grid" style={{ gridTemplateColumns: "1fr auto auto", alignItems: "center" }}>
          <textarea className="textarea" rows="3" placeholder="Share an update, ask for advice, or start a discussion..." value={content} onChange={(e) => setContent(e.target.value)} />
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="muted">{new Date(post.createdAt || Date.now()).toLocaleString()}</span>
                <button className="btn btn-soft" onClick={() => likePost(post._id)}>
                  ❤️ {(post.likes || []).length}
                </button>
              </div>
            </article>
          ))}
          {!posts.length && <div className="card muted">No posts yet. Be the first to start a discussion.</div>}
        </section>
      )}
    </div>
  );
}
