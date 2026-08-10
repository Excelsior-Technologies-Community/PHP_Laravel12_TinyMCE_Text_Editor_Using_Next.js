import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const TinyEditor = dynamic(() => import("../tinymce"), { ssr: false });

const DRAFT_KEY_PREFIX = "post_draft_";
const DRAFT_INTERVAL = 30000;

export default function Edit() {
  const router = useRouter();
  const { id } = router.query;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [statuses, setStatuses] = useState({});
  const [lastSaved, setLastSaved] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [showRevisions, setShowRevisions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [restoringId, setRestoringId] = useState(null);

  const DEFAULT_STATUSES = { draft: "Draft", published: "Published", archived: "Archived" };

  useEffect(() => {
    if (!id) return;

    fetch("/api/posts/statuses")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load statuses");
        return res.json();
      })
      .then((data) => setStatuses(data))
      .catch((err) => {
        console.error("Statuses load failed:", err);
        setStatuses(DEFAULT_STATUSES);
      });

    fetch(`/api/posts/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTitle(data.title);
        setDescription(data.description);
        setStatus(data.status || "draft");
      });
  }, [id]);

  useEffect(() => {
    const draftKey = `${DRAFT_KEY_PREFIX}${id || "new"}`;
    const draft = localStorage.getItem(draftKey);
    if (draft && !title) {
      const parsed = JSON.parse(draft);
      if (parsed.title) setTitle(parsed.title);
      if (parsed.description) setDescription(parsed.description);
      if (parsed.status) setStatus(parsed.status);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const draftKey = `${DRAFT_KEY_PREFIX}${id}`;
    const interval = setInterval(() => {
      const draft = {
        title,
        description,
        status,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
      setLastSaved(new Date());
    }, DRAFT_INTERVAL);

    return () => clearInterval(interval);
  }, [id, title, description, status]);

  useEffect(() => {
    if (!id || !showRevisions) return;

    fetch(`/api/posts/${id}/revisions`)
      .then((res) => res.json())
      .then((data) => setRevisions(Array.isArray(data) ? data : []));
  }, [id, showRevisions]);

  const clearDraft = () => {
    if (!id) return;
    localStorage.removeItem(`${DRAFT_KEY_PREFIX}${id}`);
  };

  const [updating, setUpdating] = useState(false);

  const update = async () => {
    setUpdating(true);
    try {
      await fetch(`/api/posts/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, status }),
      });

      clearDraft();
      router.push("/");
    } catch (err) {
      console.error("Failed to update post", err);
      alert("Failed to update post. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const restoreRevision = async (revisionId) => {
    setRestoringId(revisionId);
    try {
      await fetch(`/api/posts/${id}/revisions/${revisionId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const res = await fetch(`/api/posts/${id}`);
      const data = await res.json();
      setTitle(data.title);
      setDescription(data.description);
      setStatus(data.status || "draft");
      setShowRevisions(false);
      clearDraft();
    } catch (err) {
      console.error("Failed to restore revision", err);
      alert("Failed to restore revision. Please try again.");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="wrapper">
      <h2>Edit Post</h2>

      {showRevisions && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <h3>Revision History</h3>
            {revisions.length === 0 ? (
              <p>No revisions yet.</p>
            ) : (
              <div className="revisions-list">
                {revisions.map((rev) => (
                  <div key={rev.id} className="revision-item">
                    <div className="revision-meta">
                      <strong>Revision #{rev.id}</strong>
                      <span>{new Date(rev.created_at).toLocaleString()}</span>
                    </div>
                    <div className="revision-content">
                      <strong>Title:</strong> {rev.title}
                    </div>
                    <div
                      className="revision-content"
                      dangerouslySetInnerHTML={{ __html: rev.content }}
                    />
                    <button
                      className="btn btn-small"
                      onClick={() => restoreRevision(rev.id)}
                      disabled={restoringId === rev.id}
                    >
                      {restoringId === rev.id ? "Restoring..." : "Restore"}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              className="btn btn-secondary"
              style={{ marginTop: 15 }}
              onClick={() => setShowRevisions(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <h3>Preview</h3>
            <div
              className="preview-content"
              dangerouslySetInnerHTML={{ __html: description }}
            />
            <button
              className="btn btn-secondary"
              onClick={() => setShowPreview(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <label>Title</label>
      <input
        className="input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label>Status</label>
      <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
        {Object.entries(statuses).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>

      <label>Description</label>

      <TinyEditor
        key={id}
        value={description}
        onChange={setDescription}
        postId={typeof id === "string" ? id : undefined}
      />

      <div className="actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setShowPreview(true)}
        >
          Preview
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setShowRevisions(true)}
        >
          Revision History
        </button>
        <button type="button" className="btn" onClick={update} disabled={updating}>
          {updating ? "Updating..." : "Update"}
        </button>
      </div>

      {lastSaved && (
        <div className="autosave-indicator">
          Last saved: {lastSaved.toLocaleTimeString()}
        </div>
      )}

      <style jsx>{`
        .wrapper {
          max-width: 900px;
          margin: 40px auto;
          font-family: Arial, sans-serif;
        }

        label {
          display: block;
          margin: 15px 0 6px;
          font-weight: bold;
        }

        .input {
          width: 100%;
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
        }

        .btn {
          padding: 10px 18px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #6b7280;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }

        .btn-small {
          padding: 6px 12px;
          font-size: 12px;
          margin-top: 8px;
        }

        .actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
          flex-wrap: wrap;
        }

        .autosave-indicator {
          margin-top: 10px;
          font-size: 12px;
          color: #6b7280;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: #fff;
          padding: 30px;
          border-radius: 8px;
          max-width: 700px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-lg {
          max-width: 900px;
        }

        .modal h3 {
          margin-top: 0;
        }

        .revisions-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .revision-item {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 15px;
        }

        .revision-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          color: #6b7280;
        }

        .revision-content {
          font-size: 14px;
          color: #374151;
          margin-bottom: 5px;
        }

        .preview-content {
          border: 1px solid #e5e7eb;
          padding: 20px;
          border-radius: 4px;
          min-height: 200px;
          max-height: 400px;
          overflow: auto;
          margin-bottom: 15px;
        }
      `}</style>
    </div>
  );
}
