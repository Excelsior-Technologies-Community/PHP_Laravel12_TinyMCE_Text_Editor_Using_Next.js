import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

const TinyEditor = dynamic(() => import("../tinymce"), { ssr: false });

const DRAFT_KEY = "post_draft_new";
const DRAFT_INTERVAL = 30000;

export default function Create() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [statuses, setStatuses] = useState({});
  const [lastSaved, setLastSaved] = useState(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const DEFAULT_STATUSES = { draft: "Draft", published: "Published", archived: "Archived" };

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      setShowDraftModal(true);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const draft = { title, description, status, savedAt: new Date().toISOString() };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setLastSaved(new Date());
    }, DRAFT_INTERVAL);

    return () => clearInterval(interval);
  }, [title, description, status]);

  const restoreDraft = () => {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
    if (draft.title) setTitle(draft.title);
    if (draft.description) setDescription(draft.description);
    if (draft.status) setStatus(draft.status);
    setShowDraftModal(false);
  };

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setShowDraftModal(false);
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
  };

  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, status }),
      });

      clearDraft();
      router.push("/");
    } catch (err) {
      console.error("Failed to save post", err);
      alert("Failed to save post. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="wrapper">
      <h2>Create Post</h2>

      {showDraftModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Restore Draft?</h3>
            <p>You have a saved draft. Would you like to restore it?</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={discardDraft}>
                Discard
              </button>
              <button className="btn" onClick={restoreDraft}>
                Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <h3>Preview</h3>
            <div className="preview-content" dangerouslySetInnerHTML={{ __html: description }} />
            <button className="btn btn-secondary" onClick={() => setShowPreview(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      <label>Title</label>
      <input
        className="input"
        placeholder="Enter title"
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
      <TinyEditor onChange={setDescription} />

      <div className="actions">
        <button type="button" className="btn btn-secondary" onClick={() => setShowPreview(true)}>
          Preview
        </button>
        <button type="button" className="btn" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
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

        .actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
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
          max-width: 600px;
          width: 90%;
        }

        .modal-lg {
          max-width: 900px;
        }

        .modal h3 {
          margin-top: 0;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .preview-content {
          border: 1px solid #e5e7eb;
          padding: 20px;
          border-radius: 4px;
          min-height: 200px;
          margin-bottom: 15px;
          max-height: 400px;
          overflow: auto;
        }
      `}</style>
    </div>
  );
}
