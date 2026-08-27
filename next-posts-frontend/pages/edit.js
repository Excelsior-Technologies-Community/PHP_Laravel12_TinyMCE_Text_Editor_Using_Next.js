import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const TinyEditor = dynamic(
  () => import("../tinymce"),
  { ssr: false }
);

const DRAFT_KEY_PREFIX = "post_draft_";
const DRAFT_INTERVAL = 30000;

const DEFAULT_STATUSES = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export default function Edit() {
  const router = useRouter();
  const { id } = router.query;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] =
    useState("");

  const [status, setStatus] =
    useState("draft");

  const [statuses, setStatuses] =
    useState({});

  const [metaTitle, setMetaTitle] =
    useState("");

  const [metaDescription, setMetaDescription] =
    useState("");

  const [stats, setStats] = useState({
    words: 0,
    characters: 0,
    charactersWithoutSpaces: 0,
    paragraphs: 0,
    readingTime: 0,
  });

  const [lastSaved, setLastSaved] =
    useState(null);

  const [revisions, setRevisions] =
    useState([]);

  const [showRevisions, setShowRevisions] =
    useState(false);

  const [showPreview, setShowPreview] =
    useState(false);

  const [showSeoPreview, setShowSeoPreview] =
    useState(false);

  const [restoringId, setRestoringId] =
    useState(null);

  const [updating, setUpdating] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Load post
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (!id) return;

    fetch("/api/posts/statuses")
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            "Failed to load statuses"
          );
        }

        return res.json();
      })
      .then((data) => {
        setStatuses(data);
      })
      .catch(() => {
        setStatuses(DEFAULT_STATUSES);
      });

    fetch(`/api/posts/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            "Failed to load post"
          );
        }

        return res.json();
      })
      .then((data) => {
        setTitle(data.title || "");
        setSlug(data.slug || "");
        setDescription(
          data.description || ""
        );
        setStatus(
          data.status || "draft"
        );
        setMetaTitle(
          data.meta_title || ""
        );
        setMetaDescription(
          data.meta_description || ""
        );
      })
      .catch((error) => {
        console.error(
          "Failed to load post:",
          error
        );
      });
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | Restore local draft
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (!id) return;

    const draftKey =
      `${DRAFT_KEY_PREFIX}${id}`;

    const draft =
      localStorage.getItem(draftKey);

    if (draft && !title) {
      try {
        const parsed =
          JSON.parse(draft);

        if (parsed.title) {
          setTitle(parsed.title);
        }

        if (parsed.slug) {
          setSlug(parsed.slug);
        }

        if (parsed.description) {
          setDescription(
            parsed.description
          );
        }

        if (parsed.status) {
          setStatus(parsed.status);
        }

        if (parsed.metaTitle) {
          setMetaTitle(
            parsed.metaTitle
          );
        }

        if (parsed.metaDescription) {
          setMetaDescription(
            parsed.metaDescription
          );
        }
      } catch (error) {
        console.error(
          "Draft restore failed:",
          error
        );
      }
    }
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | Auto-save
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (!id) return;

    const draftKey =
      `${DRAFT_KEY_PREFIX}${id}`;

    const interval =
      setInterval(() => {

        const draft = {
          title,
          slug,
          description,
          status,
          metaTitle,
          metaDescription,
          savedAt:
            new Date().toISOString(),
        };

        localStorage.setItem(
          draftKey,
          JSON.stringify(draft)
        );

        setLastSaved(
          new Date()
        );

      }, DRAFT_INTERVAL);

    return () =>
      clearInterval(interval);

  }, [
    id,
    title,
    slug,
    description,
    status,
    metaTitle,
    metaDescription,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Revision list
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (!id || !showRevisions) return;

    fetch(
      `/api/posts/${id}/revisions`
    )
      .then((res) => res.json())
      .then((data) => {
        setRevisions(
          Array.isArray(data)
            ? data
            : []
        );
      })
      .catch(() => {
        setRevisions([]);
      });

  }, [id, showRevisions]);

  /*
  |--------------------------------------------------------------------------
  | Slug generation
  |--------------------------------------------------------------------------
  */
  const generateSlug = (value) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleTitleChange = (value) => {
    setTitle(value);

    /*
     * Keep existing slug unless
     * the slug is empty.
     */
    if (!slug) {
      setSlug(
        generateSlug(value)
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Clear draft
  |--------------------------------------------------------------------------
  */
  const clearDraft = () => {
    if (!id) return;

    localStorage.removeItem(
      `${DRAFT_KEY_PREFIX}${id}`
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Update post
  |--------------------------------------------------------------------------
  */
  const update = async () => {
    if (!title.trim()) {
      alert("Please enter a title.");
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch(
        `/api/posts/${id}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            title,
            slug,
            description,
            status,
            meta_title: metaTitle,
            meta_description:
              metaDescription,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update post."
        );
      }

      clearDraft();

      router.push("/");

    } catch (error) {
      console.error(
        "Failed to update post:",
        error
      );

      alert(
        error.message ||
          "Failed to update post. Please try again."
      );

    } finally {
      setUpdating(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Restore revision
  |--------------------------------------------------------------------------
  */
  const restoreRevision =
    async (revisionId) => {

      setRestoringId(
        revisionId
      );

      try {
        const response =
          await fetch(
            `/api/posts/${id}/revisions/${revisionId}/restore`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );

        if (!response.ok) {
          throw new Error(
            "Failed to restore revision."
          );
        }

        const res =
          await fetch(
            `/api/posts/${id}`
          );

        const data =
          await res.json();

        setTitle(
          data.title || ""
        );

        setSlug(
          data.slug || ""
        );

        setDescription(
          data.description || ""
        );

        setStatus(
          data.status || "draft"
        );

        setMetaTitle(
          data.meta_title || ""
        );

        setMetaDescription(
          data.meta_description || ""
        );

        setShowRevisions(
          false
        );

        clearDraft();

      } catch (error) {
        console.error(
          "Failed to restore revision:",
          error
        );

        alert(
          "Failed to restore revision. Please try again."
        );

      } finally {
        setRestoringId(null);
      }
    };

  const seoTitle =
    metaTitle ||
    title ||
    "Your Post Title";

  const seoDescription =
    metaDescription ||
    "Your meta description will appear here.";

  const seoSlug =
    slug ||
    "your-post-slug";

  return (
    <div className="wrapper">

      <h2>Edit Post</h2>

      {/* =====================================================
          REVISION HISTORY
      ====================================================== */}

      {showRevisions && (
        <div className="modal-overlay">

          <div className="modal modal-lg">

            <h3>
              Revision History
            </h3>

            {revisions.length === 0 ? (

              <p>
                No revisions yet.
              </p>

            ) : (

              <div className="revisions-list">

                {revisions.map(
                  (rev) => (

                    <div
                      key={rev.id}
                      className="revision-item"
                    >

                      <div className="revision-meta">

                        <strong>
                          Revision #{rev.id}
                        </strong>

                        <span>
                          {new Date(
                            rev.created_at
                          ).toLocaleString()}
                        </span>

                      </div>

                      <div className="revision-content">

                        <strong>
                          Title:
                        </strong>{" "}
                        {rev.title}

                      </div>

                      <div
                        className="revision-content"
                        dangerouslySetInnerHTML={{
                          __html:
                            rev.content,
                        }}
                      />

                      <button
                        className="btn btn-small"
                        onClick={() =>
                          restoreRevision(
                            rev.id
                          )
                        }
                        disabled={
                          restoringId ===
                          rev.id
                        }
                      >
                        {restoringId ===
                        rev.id
                          ? "Restoring..."
                          : "Restore"}
                      </button>

                    </div>

                  )
                )}

              </div>

            )}

            <button
              className="btn btn-secondary"
              style={{
                marginTop: 15,
              }}
              onClick={() =>
                setShowRevisions(false)
              }
            >
              Close
            </button>

          </div>

        </div>
      )}

      {/* =====================================================
          CONTENT PREVIEW
      ====================================================== */}

      {showPreview && (
        <div className="modal-overlay">

          <div className="modal modal-lg">

            <h3>
              Content Preview
            </h3>

            <h1>
              {title ||
                "Untitled Post"}
            </h1>

            <div
              className="preview-content"
              dangerouslySetInnerHTML={{
                __html:
                  description,
              }}
            />

            <button
              className="btn btn-secondary"
              onClick={() =>
                setShowPreview(false)
              }
            >
              Close
            </button>

          </div>

        </div>
      )}

      {/* =====================================================
          SEO PREVIEW
      ====================================================== */}

      {showSeoPreview && (
        <div className="modal-overlay">

          <div className="modal modal-lg">

            <h3>
              Google Search Preview
            </h3>

            <div className="google-preview">

              <div className="google-url">
                example.com/posts/
                {seoSlug}
              </div>

              <div className="google-title">
                {seoTitle}
              </div>

              <div className="google-description">
                {seoDescription}
              </div>

            </div>

            <button
              className="btn btn-secondary"
              onClick={() =>
                setShowSeoPreview(
                  false
                )
              }
            >
              Close
            </button>

          </div>

        </div>
      )}

      {/* =====================================================
          TITLE
      ====================================================== */}

      <label>
        Title
      </label>

      <input
        className="input"
        value={title}
        onChange={(e) =>
          handleTitleChange(
            e.target.value
          )
        }
      />

      {/* =====================================================
          STATUS
      ====================================================== */}

      <label>
        Status
      </label>

      <select
        className="input"
        value={status}
        onChange={(e) =>
          setStatus(
            e.target.value
          )
        }
      >

        {Object.entries(
          statuses
        ).map(
          ([key, label]) => (
            <option
              key={key}
              value={key}
            >
              {label}
            </option>
          )
        )}

      </select>

      {/* =====================================================
          SLUG
      ====================================================== */}

      <label>
        URL Slug
      </label>

      <input
        className="input"
        value={slug}
        onChange={(e) =>
          setSlug(
            generateSlug(
              e.target.value
            )
          )
        }
      />

      <div className="help-text">
        URL:
        {" "}
        example.com/posts/
        {slug ||
          "your-post-slug"}
      </div>

      {/* =====================================================
          EDITOR
      ====================================================== */}

      <label>
        Description
      </label>

      <TinyEditor
        key={id}
        value={description}
        onChange={setDescription}
        postId={
          typeof id === "string"
            ? id
            : undefined
        }
        onStatsChange={setStats}
      />

      {/* =====================================================
          CONTENT STATISTICS
      ====================================================== */}

      <div className="stats-card">

        <div className="stats-header">

          <strong>
            Content Statistics
          </strong>

          <span>
            Live
          </span>

        </div>

        <div className="stats-grid">

          <div className="stat-item">
            <strong>
              {stats.words}
            </strong>

            <span>
              Words
            </span>
          </div>

          <div className="stat-item">
            <strong>
              {stats.characters}
            </strong>

            <span>
              Characters
            </span>
          </div>

          <div className="stat-item">
            <strong>
              {stats.charactersWithoutSpaces}
            </strong>

            <span>
              Characters without spaces
            </span>
          </div>

          <div className="stat-item">
            <strong>
              {stats.paragraphs}
            </strong>

            <span>
              Paragraphs
            </span>
          </div>

          <div className="stat-item">
            <strong>
              {stats.readingTime}
            </strong>

            <span>
              Min. reading time
            </span>
          </div>

        </div>

      </div>

      {/* =====================================================
          SEO
      ====================================================== */}

      <div className="seo-card">

        <div className="seo-header">

          <div>

            <h3>
              SEO Settings
            </h3>

            <p>
              Optimize how your post
              appears in search engines.
            </p>

          </div>

          <button
            type="button"
            className="btn btn-seo"
            onClick={() =>
              setShowSeoPreview(
                true
              )
            }
          >
            SEO Preview
          </button>

        </div>

        {/* Meta title */}

        <label>
          Meta Title
        </label>

        <input
          className="input"
          placeholder="Enter SEO title"
          maxLength={60}
          value={metaTitle}
          onChange={(e) =>
            setMetaTitle(
              e.target.value
            )
          }
        />

        <div className="counter">
          {metaTitle.length}/60
        </div>

        {/* Meta description */}

        <label>
          Meta Description
        </label>

        <textarea
          className="textarea"
          placeholder="Enter SEO description"
          maxLength={160}
          rows={4}
          value={metaDescription}
          onChange={(e) =>
            setMetaDescription(
              e.target.value
            )
          }
        />

        <div className="counter">
          {metaDescription.length}/160
        </div>

        {/* SEO preview */}

        <div className="seo-inline-preview">

          <div className="google-url">
            example.com/posts/
            {seoSlug}
          </div>

          <div className="google-title">
            {seoTitle}
          </div>

          <div className="google-description">
            {seoDescription}
          </div>

        </div>

      </div>

      {/* =====================================================
          ACTIONS
      ====================================================== */}

      <div className="actions">

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() =>
            setShowPreview(true)
          }
        >
          Preview
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() =>
            setShowRevisions(true)
          }
        >
          Revision History
        </button>

        <button
          type="button"
          className="btn"
          onClick={update}
          disabled={updating}
        >
          {updating
            ? "Updating..."
            : "Update"}
        </button>

      </div>

      {lastSaved && (
        <div className="autosave-indicator">
          Draft auto-saved at{" "}
          {lastSaved.toLocaleTimeString()}
        </div>
      )}

      <style jsx>{`

        .wrapper {
          max-width: 1000px;
          margin: 40px auto;
          font-family: Arial, sans-serif;
          padding-bottom: 60px;
        }

        h2 {
          margin-bottom: 25px;
        }

        label {
          display: block;
          margin: 15px 0 6px;
          font-weight: bold;
        }

        .input,
        .textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 5px;
          box-sizing: border-box;
          font-size: 14px;
        }

        .textarea {
          resize: vertical;
        }

        .input:focus,
        .textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow:
            0 0 0 2px
            rgba(37, 99, 235, 0.1);
        }

        .help-text {
          margin-top: 5px;
          font-size: 12px;
          color: #6b7280;
        }

        .btn {
          padding: 10px 18px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 500;
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

        .btn-seo {
          background: #7c3aed;
        }

        .btn-seo:hover {
          background: #6d28d9;
        }

        .btn-small {
          padding: 6px 12px;
          font-size: 12px;
          margin-top: 8px;
        }

        .actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        /* Statistics */

        .stats-card {
          margin-top: 15px;
          padding: 18px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }

        .stats-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .stats-header span {
          font-size: 11px;
          background: #dcfce7;
          color: #166534;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: bold;
        }

        .stats-grid {
          display: grid;
          grid-template-columns:
            repeat(5, 1fr);
          gap: 10px;
        }

        .stat-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
          text-align: center;
        }

        .stat-item strong {
          display: block;
          font-size: 22px;
          color: #111827;
        }

        .stat-item span {
          display: block;
          margin-top: 4px;
          font-size: 11px;
          color: #6b7280;
        }

        /* SEO */

        .seo-card {
          margin-top: 25px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          background: white;
        }

        .seo-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
        }

        .seo-header h3 {
          margin: 0;
        }

        .seo-header p {
          margin: 5px 0 15px;
          color: #6b7280;
          font-size: 13px;
        }

        .counter {
          text-align: right;
          margin-top: 4px;
          font-size: 11px;
          color: #6b7280;
        }

        .seo-inline-preview {
          margin-top: 20px;
          padding: 18px;
          background: #f8fafc;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        .google-url {
          color: #15803d;
          font-size: 13px;
          margin-bottom: 5px;
          word-break: break-all;
        }

        .google-title {
          color: #1a0dab;
          font-size: 20px;
          margin-bottom: 5px;
          line-height: 1.3;
        }

        .google-description {
          color: #4b5563;
          font-size: 14px;
          line-height: 1.5;
        }

        /* Modal */

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background:
            rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          box-sizing: border-box;
        }

        .modal {
          background: #fff;
          padding: 30px;
          border-radius: 8px;
          max-width: 700px;
          width: 100%;
          max-height: 85vh;
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
          gap: 10px;
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
          border-radius: 5px;
          min-height: 200px;
          max-height: 400px;
          overflow: auto;
          margin-bottom: 15px;
        }

        .google-preview {
          margin: 20px 0;
          padding: 25px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .autosave-indicator {
          margin-top: 10px;
          font-size: 12px;
          color: #6b7280;
        }

        @media (max-width: 768px) {

          .stats-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .seo-header {
            flex-direction: column;
            align-items: flex-start;
          }

        }

      `}</style>

    </div>
  );
}