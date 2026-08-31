import { useEffect, useState } from "react";

export default function Index() {
  const [posts, setPosts] = useState([]);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);

  const [lastPage, setLastPage] = useState(1);

  const [total, setTotal] = useState(0);

  const [statuses, setStatuses] = useState({});

  const [loading, setLoading] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);

  const [sortBy, setSortBy] = useState("id");

  const [sortOrder, setSortOrder] = useState("desc");

  const [showTrash, setShowTrash] = useState(false);

  const [trashPosts, setTrashPosts] = useState([]);

  const [trashPage, setTrashPage] = useState(1);

  const [trashLastPage, setTrashLastPage] = useState(1);

  const [trashTotal, setTrashTotal] = useState(0);

  const [trashSearch, setTrashSearch] = useState("");

  const [trashLoading, setTrashLoading] = useState(false);

  const [selectedTrashIds, setSelectedTrashIds] = useState([]);

  // =========================================================
  // LOAD STATUSES
  // =========================================================

  useEffect(() => {
    fetch("/api/posts/statuses")
      .then((res) => res.json())
      .then((data) => {
        setStatuses(data);
      })
      .catch(() => {});
  }, []);

  // =========================================================
  // LOAD ACTIVE POSTS
  // =========================================================

  useEffect(() => {
    if (showTrash) {
      return;
    }

    const params = new URLSearchParams();

    if (search) {
      params.set("search", search);
    }

    if (status) {
      params.set("status", status);
    }

    params.set("page", page);

    params.set("per_page", "5");

    params.set("sort_by", sortBy);

    params.set("sort_order", sortOrder);

    setLoading(true);

    fetch(`/api/posts?${params.toString()}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load posts");
        }

        return res.json();
      })
      .then((data) => {
        setPosts(data.data || []);

        setLastPage(data.last_page || 1);

        setTotal(data.total || 0);

        setSelectedIds([]);
      })
      .catch((error) => {
        console.error(
          "Failed to load posts:",
          error
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [
    search,
    status,
    page,
    sortBy,
    sortOrder,
    showTrash,
  ]);

  // =========================================================
  // LOAD TRASH
  // =========================================================

  useEffect(() => {
    if (!showTrash) {
      return;
    }

    const params = new URLSearchParams();

    if (trashSearch) {
      params.set(
        "search",
        trashSearch
      );
    }

    params.set(
      "page",
      trashPage
    );

    params.set(
      "per_page",
      "5"
    );

    setTrashLoading(true);

    fetch(
      `/api/posts/trash?${params.toString()}`
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            "Failed to load trash"
          );
        }

        return res.json();
      })
      .then((data) => {
        setTrashPosts(
          data.data || []
        );

        setTrashLastPage(
          data.last_page || 1
        );

        setTrashTotal(
          data.total || 0
        );

        setSelectedTrashIds([]);
      })
      .catch((error) => {
        console.error(
          "Failed to load trash:",
          error
        );
      })
      .finally(() => {
        setTrashLoading(false);
      });
  }, [
    showTrash,
    trashSearch,
    trashPage,
  ]);

  // =========================================================
  // HTML TEXT
  // =========================================================

  const getText = (html) => {
    if (!html) return "";

    const div =
      document.createElement(
        "div"
      );

    div.innerHTML = html;

    return (
      div.textContent ||
      div.innerText ||
      ""
    )
      .replace(/\s+/g, " ")
      .trim();
  };

  // =========================================================
  // CONTENT STATS
  // =========================================================

  const getStats = (post) => {
    const text = getText(
      post.description
    );

    const words = text
      ? text
          .split(/\s+/)
          .filter(Boolean)
          .length
      : 0;

    const readingTime =
      words > 0
        ? Math.max(
            1,
            Math.ceil(words / 200)
          )
        : 0;

    return {
      words,
      readingTime,
    };
  };

  // =========================================================
  // SELECT ALL ACTIVE POSTS
  // =========================================================

  const allActiveSelected =
    posts.length > 0 &&
    posts.every((post) =>
      selectedIds.includes(post.id)
    );

  const toggleSelectAll = () => {
    if (allActiveSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(
        posts.map((post) => post.id)
      );
    }
  };

  // =========================================================
  // SELECT SINGLE ACTIVE POST
  // =========================================================

  const toggleSelect = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter(
            (item) => item !== id
          )
        : [...current, id]
    );
  };

  // =========================================================
  // SELECT ALL TRASH POSTS
  // =========================================================

  const allTrashSelected =
    trashPosts.length > 0 &&
    trashPosts.every((post) =>
      selectedTrashIds.includes(
        post.id
      )
    );

  const toggleTrashSelectAll = () => {
    if (allTrashSelected) {
      setSelectedTrashIds([]);
    } else {
      setSelectedTrashIds(
        trashPosts.map(
          (post) => post.id
        )
      );
    }
  };

  // =========================================================
  // SELECT TRASH POST
  // =========================================================

  const toggleTrashSelect = (id) => {
    setSelectedTrashIds(
      (current) =>
        current.includes(id)
          ? current.filter(
              (item) => item !== id
            )
          : [...current, id]
    );
  };

  // =========================================================
  // DELETE SINGLE POST
  // =========================================================

  const handleDelete = async (id) => {
    const confirmed =
      window.confirm(
        "Move this post to trash?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/posts/${id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete post."
        );
      }

      alert(
        "Post moved to trash successfully."
      );

      loadCurrentPageAfterDelete();
    } catch (error) {
      alert(
        error.message ||
          "Failed to delete post."
      );
    }
  };

  // =========================================================
  // AFTER DELETE
  // =========================================================

  const loadCurrentPageAfterDelete = () => {
    if (
      posts.length === 1 &&
      page > 1
    ) {
      setPage(
        (current) =>
          current - 1
      );
    } else {
      setPage(
        (current) => current
      );
    }

    // Trigger reload by changing sort temporarily
    setSortOrder(
      (current) =>
        current === "asc"
          ? "desc"
          : "asc"
    );
  };

  // =========================================================
  // BULK DELETE
  // =========================================================

  const handleBulkDelete = async () => {
    if (
      selectedIds.length === 0
    ) {
      alert(
        "Please select at least one post."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Move ${selectedIds.length} selected post(s) to trash?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          "/api/posts/bulk-delete",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              ids: selectedIds,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Bulk delete failed."
        );
      }

      alert(
        data.message ||
          "Posts moved to trash."
      );

      setSelectedIds([]);

      setSortOrder(
        (current) =>
          current === "asc"
            ? "desc"
            : "asc"
      );
    } catch (error) {
      alert(
        error.message ||
          "Bulk delete failed."
      );
    }
  };

  // =========================================================
  // RESTORE SINGLE
  // =========================================================

  const handleRestore = async (
    id
  ) => {
    try {
      const response =
        await fetch(
          `/api/posts/${id}/restore`,
          {
            method: "POST",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Restore failed."
        );
      }

      alert(
        "Post restored successfully."
      );

      setTrashPage(
        (current) => current
      );

      setTrashSearch(
        (current) => current
      );

      // Reload trash
      setTrashLoading(true);

      const res =
        await fetch(
          `/api/posts/trash?page=${trashPage}&per_page=5`
        );

      const result =
        await res.json();

      setTrashPosts(
        result.data || []
      );

      setTrashLastPage(
        result.last_page || 1
      );

      setTrashTotal(
        result.total || 0
      );
    } catch (error) {
      alert(
        error.message ||
          "Restore failed."
      );
    }
  };

  // =========================================================
  // PERMANENT DELETE
  // =========================================================

  const handleForceDelete =
    async (id) => {
      const confirmed =
        window.confirm(
          "This will permanently delete the post and its images. This action cannot be undone. Continue?"
        );

      if (!confirmed) {
        return;
      }

      try {
        const response =
          await fetch(
            `/api/posts/${id}/force`,
            {
              method: "DELETE",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Permanent delete failed."
          );
        }

        alert(
          "Post permanently deleted."
        );

        setTrashPosts(
          (current) =>
            current.filter(
              (post) =>
                post.id !== id
            )
        );

        setTrashTotal(
          (current) =>
            Math.max(
              0,
              current - 1
            )
        );
      } catch (error) {
        alert(
          error.message ||
            "Permanent delete failed."
        );
      }
    };

  // =========================================================
  // BULK RESTORE
  // =========================================================

  const handleBulkRestore =
    async () => {
      if (
        selectedTrashIds.length ===
        0
      ) {
        alert(
          "Please select at least one trashed post."
        );

        return;
      }

      try {
        const response =
          await fetch(
            "/api/posts/bulk-restore",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                ids: selectedTrashIds,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Bulk restore failed."
          );
        }

        alert(
          data.message ||
            "Posts restored successfully."
        );

        setSelectedTrashIds([]);

        setTrashPosts(
          (current) =>
            current.filter(
              (post) =>
                !selectedTrashIds.includes(
                  post.id
                )
            )
        );

        setTrashTotal(
          (current) =>
            Math.max(
              0,
              current -
                selectedTrashIds.length
            )
        );
      } catch (error) {
        alert(
          error.message ||
            "Bulk restore failed."
        );
      }
    };

  // =========================================================
  // BULK PERMANENT DELETE
  // =========================================================

  const handleBulkForceDelete =
    async () => {
      if (
        selectedTrashIds.length ===
        0
      ) {
        alert(
          "Please select at least one trashed post."
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Permanently delete ${selectedTrashIds.length} selected post(s)? This cannot be undone.`
        );

      if (!confirmed) {
        return;
      }

      try {
        const response =
          await fetch(
            "/api/posts/bulk-force-delete",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                ids: selectedTrashIds,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Permanent deletion failed."
          );
        }

        alert(
          data.message ||
            "Posts permanently deleted."
        );

        setTrashPosts(
          (current) =>
            current.filter(
              (post) =>
                !selectedTrashIds.includes(
                  post.id
                )
            )
        );

        setTrashTotal(
          (current) =>
            Math.max(
              0,
              current -
                selectedTrashIds.length
            )
        );

        setSelectedTrashIds([]);
      } catch (error) {
        alert(
          error.message ||
            "Permanent deletion failed."
        );
      }
    };

  // =========================================================
  // WORD EXPORT
  // =========================================================

  const handleExportWord = (
    post
  ) => {
    const htmlContent = `
      <html
        xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:w="urn:schemas-microsoft-com:office:word"
        xmlns="http://www.w3.org/TR/REC-html40"
      >
        <head>
          <title>${post.title}</title>
        </head>

        <body>
          <h1>${post.title}</h1>

          <div>
            ${post.description || ""}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob(
      [htmlContent],
      {
        type:
          "application/msword",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement(
        "a"
      );

    a.href = url;

    a.download =
      `${post.title.replace(
        /[^a-zA-Z0-9]+/g,
        "_"
      )}.doc`;

    a.click();

    URL.revokeObjectURL(url);
  };

  // =========================================================
  // PRINT
  // =========================================================

  const handlePrint = (
    post
  ) => {
    const win =
      window.open(
        "",
        "_blank"
      );

    if (!win) {
      return;
    }

    win.document.write(`
      <html>

        <head>

          <title>
            ${post.title}
          </title>

          <style>

            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }

            h1 {
              margin-bottom: 10px;
            }

            .meta {
              color: #666;
              margin-bottom: 20px;
            }

          </style>

        </head>

        <body>

          <h1>
            ${post.title}
          </h1>

          <div class="meta">
            Status:
            ${post.status || "draft"}
          </div>

          <div>
            ${post.description || ""}
          </div>

        </body>

      </html>
    `);

    win.document.close();

    win.print();
  };

  // =========================================================
  // CHANGE SORT
  // =========================================================

  const handleSortChange = (
    value
  ) => {
    if (
      value === "title_asc"
    ) {
      setSortBy("title");
      setSortOrder("asc");
    }

    if (
      value === "title_desc"
    ) {
      setSortBy("title");
      setSortOrder("desc");
    }

    if (
      value === "newest"
    ) {
      setSortBy("created_at");
      setSortOrder("desc");
    }

    if (
      value === "oldest"
    ) {
      setSortBy("created_at");
      setSortOrder("asc");
    }

    if (
      value === "updated"
    ) {
      setSortBy("updated_at");
      setSortOrder("desc");
    }

    if (
      value === "status_asc"
    ) {
      setSortBy("status");
      setSortOrder("asc");
    }

    setPage(1);
  };

  return (
    <div className="container">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="topbar">

        <div>
          <h2 className="heading">
            {showTrash
              ? "Trash"
              : "Posts"}
          </h2>

          <p className="subtitle">
            {showTrash
              ? "Manage deleted posts."
              : "Manage your rich-text content and SEO metadata."}
          </p>
        </div>

        <div className="header-actions">

          {!showTrash && (
            <a
              href="/create"
              className="create-btn"
            >
              + Create New
            </a>
          )}

          <button
            className={
              showTrash
                ? "trash-btn active"
                : "trash-btn"
            }
            onClick={() => {
              setShowTrash(
                (current) =>
                  !current
              );

              setPage(1);
              setTrashPage(1);
              setSelectedIds([]);
              setSelectedTrashIds([]);
            }}
          >
            {showTrash
              ? "← Back to Posts"
              : "🗑 Trash"}
          </button>

        </div>

      </div>

      {/* =====================================================
          TRASH PAGE
      ====================================================== */}

      {showTrash ? (

        <>

          <div className="trash-summary">

            <div>
              <strong>
                {trashTotal}
              </strong>

              <span>
                Trashed Posts
              </span>
            </div>

          </div>

          <div className="toolbar">

            <input
              className="search-input"
              placeholder="Search trash..."
              value={trashSearch}
              onChange={(e) => {
                setTrashSearch(
                  e.target.value
                );

                setTrashPage(1);
              }}
            />

            {selectedTrashIds.length >
              0 && (
              <div className="bulk-actions">

                <button
                  className="restore-btn"
                  onClick={
                    handleBulkRestore
                  }
                >
                  ♻ Restore (
                  {
                    selectedTrashIds.length
                  }
                  )
                </button>

                <button
                  className="danger-btn"
                  onClick={
                    handleBulkForceDelete
                  }
                >
                  Permanently Delete (
                  {
                    selectedTrashIds.length
                  }
                  )
                </button>

              </div>
            )}

          </div>

          <div className="table-wrapper">

            <table className="table">

              <thead>

                <tr>

                  <th
                    style={{
                      width: "50px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        allTrashSelected
                      }
                      onChange={
                        toggleTrashSelectAll
                      }
                    />
                  </th>

                  <th>ID</th>

                  <th>Title</th>

                  <th>Status</th>

                  <th>
                    Deleted At
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {trashLoading && (
                  <tr>
                    <td
                      colSpan="6"
                      className="empty"
                    >
                      Loading trash...
                    </td>
                  </tr>
                )}

                {!trashLoading &&
                  trashPosts.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="empty"
                      >
                        Trash is empty
                      </td>
                    </tr>
                  )}

                {!trashLoading &&
                  trashPosts.map(
                    (post) => (
                      <tr
                        key={post.id}
                        className="trashed-row"
                      >

                        <td>

                          <input
                            type="checkbox"
                            checked={selectedTrashIds.includes(
                              post.id
                            )}
                            onChange={() =>
                              toggleTrashSelect(
                                post.id
                              )
                            }
                          />

                        </td>

                        <td>
                          {post.id}
                        </td>

                        <td>

                          <div className="title-cell">
                            {post.title}
                          </div>

                          <div className="slug">
                            /posts/
                            {post.slug}
                          </div>

                        </td>

                        <td>

                          <span
                            className={`status-badge status-${
                              post.status ||
                              "draft"
                            }`}
                          >
                            {post.status ||
                              "draft"}
                          </span>

                        </td>

                        <td>

                          {post.deleted_at
                            ? new Date(
                                post.deleted_at
                              ).toLocaleString()
                            : "-"}

                        </td>

                        <td>

                          <div className="action-btns">

                            <button
                              className="restore-btn"
                              onClick={() =>
                                handleRestore(
                                  post.id
                                )
                              }
                            >
                              ♻ Restore
                            </button>

                            <button
                              className="danger-btn"
                              onClick={() =>
                                handleForceDelete(
                                  post.id
                                )
                              }
                            >
                              Delete Forever
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )}

              </tbody>

            </table>

          </div>

          <div className="pagination">

            <button
              className="page-btn"
              disabled={
                trashPage <= 1
              }
              onClick={() =>
                setTrashPage(
                  trashPage - 1
                )
              }
            >
              Previous
            </button>

            <span className="page-info">

              Page{" "}
              {trashPage} of{" "}
              {trashLastPage}
              {" "}(
              {trashTotal}
              {" "}total)

            </span>

            <button
              className="page-btn"
              disabled={
                trashPage >=
                trashLastPage
              }
              onClick={() =>
                setTrashPage(
                  trashPage + 1
                )
              }
            >
              Next
            </button>

          </div>

        </>

      ) : (

        <>
          {/* =====================================================
              NORMAL POSTS
          ====================================================== */}

          <div className="toolbar">

            <input
              className="search-input"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => {
                setSearch(
                  e.target.value
                );

                setPage(1);
              }}
            />

            <select
              className="status-select"
              value={status}
              onChange={(e) => {
                setStatus(
                  e.target.value
                );

                setPage(1);
              }}
            >

              <option value="">
                All Statuses
              </option>

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

            <select
              className="sort-select"
              value={
                sortBy === "title"
                  ? sortOrder ===
                    "asc"
                    ? "title_asc"
                    : "title_desc"
                  : sortBy ===
                    "created_at"
                  ? sortOrder ===
                    "asc"
                    ? "oldest"
                    : "newest"
                  : sortBy ===
                    "updated_at"
                  ? "updated"
                  : sortBy ===
                    "status"
                  ? "status_asc"
                  : "newest"
              }
              onChange={(e) =>
                handleSortChange(
                  e.target.value
                )
              }
            >

              <option value="newest">
                Newest First
              </option>

              <option value="oldest">
                Oldest First
              </option>

              <option value="title_asc">
                Title A → Z
              </option>

              <option value="title_desc">
                Title Z → A
              </option>

              <option value="updated">
                Recently Updated
              </option>

              <option value="status_asc">
                Status A → Z
              </option>

            </select>

          </div>

          {/* =====================================================
              BULK BAR
          ====================================================== */}

          {selectedIds.length >
            0 && (
            <div className="bulk-bar">

              <div>

                <strong>
                  {
                    selectedIds.length
                  }
                </strong>

                {" "}post(s) selected

              </div>

              <button
                className="danger-btn"
                onClick={
                  handleBulkDelete
                }
              >
                🗑 Move Selected to Trash
              </button>

            </div>
          )}

          {/* =====================================================
              TABLE
          ====================================================== */}

          <div className="table-wrapper">

            <table className="table">

              <thead>

                <tr>

                  <th
                    style={{
                      width: "45px",
                    }}
                  >

                    <input
                      type="checkbox"
                      checked={
                        allActiveSelected
                      }
                      onChange={
                        toggleSelectAll
                      }
                    />

                  </th>

                  <th
                    style={{
                      width: "55px",
                    }}
                  >
                    ID
                  </th>

                  <th
                    style={{
                      width: "190px",
                    }}
                  >
                    Title
                  </th>

                  <th>
                    Description
                  </th>

                  <th
                    style={{
                      width: "120px",
                    }}
                  >
                    Status
                  </th>

                  <th
                    style={{
                      width: "170px",
                    }}
                  >
                    Content
                  </th>

                  <th
                    style={{
                      width: "300px",
                    }}
                  >
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {loading && (
                  <tr>
                    <td
                      colSpan="7"
                      className="empty"
                    >
                      Loading posts...
                    </td>
                  </tr>
                )}

                {!loading &&
                  posts.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="empty"
                      >
                        No records found
                      </td>
                    </tr>
                  )}

                {!loading &&
                  posts.map(
                    (post) => {

                      const stats =
                        getStats(
                          post
                        );

                      return (
                        <tr
                          key={
                            post.id
                          }
                        >

                          <td>

                            <input
                              type="checkbox"
                              checked={selectedIds.includes(
                                post.id
                              )}
                              onChange={() =>
                                toggleSelect(
                                  post.id
                                )
                              }
                            />

                          </td>

                          <td>
                            {post.id}
                          </td>

                          <td>

                            <div className="title-cell">
                              {
                                post.title
                              }
                            </div>

                            {post.slug && (
                              <div className="slug">
                                /posts/
                                {
                                  post.slug
                                }
                              </div>
                            )}

                          </td>

                          <td>

                            <div
                              className="description"
                              dangerouslySetInnerHTML={{
                                __html:
                                  post.description ||
                                  "",
                              }}
                            />

                          </td>

                          <td>

                            <span
                              className={`status-badge status-${
                                post.status ||
                                "draft"
                              }`}
                            >
                              {
                                post.status ||
                                "draft"
                              }
                            </span>

                          </td>

                          <td>

                            <div className="content-stats">

                              <span>
                                {
                                  stats.words
                                }{" "}
                                words
                              </span>

                              <span>
                                {
                                  stats.readingTime
                                }{" "}
                                min read
                              </span>

                            </div>

                            {post.meta_title && (
                              <div className="seo-ready">
                                SEO ✓
                              </div>
                            )}

                          </td>

                          <td>

                            <div className="action-btns">

                              <a
                                href={`/edit?id=${post.id}`}
                                className="edit-link"
                              >
                                Edit
                              </a>

                              <button
                                className="export-btn"
                                onClick={() =>
                                  handleExportWord(
                                    post
                                  )
                                }
                              >
                                Word
                              </button>

                              <button
                                className="export-btn"
                                onClick={() =>
                                  handlePrint(
                                    post
                                  )
                                }
                              >
                                Print
                              </button>

                              <button
                                className="delete-btn"
                                onClick={() =>
                                  handleDelete(
                                    post.id
                                  )
                                }
                              >
                                Delete
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

              </tbody>

            </table>

          </div>

          {/* =====================================================
              PAGINATION
          ====================================================== */}

          <div className="pagination">

            <button
              className="page-btn"
              disabled={
                page <= 1
              }
              onClick={() =>
                setPage(
                  page - 1
                )
              }
            >
              Previous
            </button>

            <span className="page-info">

              Page {page} of{" "}
              {lastPage}

              {" "}(
              {total}
              {" "}total)

            </span>

            <button
              className="page-btn"
              disabled={
                page >=
                lastPage
              }
              onClick={() =>
                setPage(
                  page + 1
                )
              }
            >
              Next
            </button>

          </div>

        </>
      )}

      {/* =====================================================
          STYLES
      ====================================================== */}

      <style jsx>{`

        .container {
          max-width: 1300px;
          margin: 40px auto;
          font-family: Arial, sans-serif;
          padding: 0 15px 50px;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 20px;
        }

        .heading {
          margin: 0;
        }

        .subtitle {
          margin: 5px 0 0;
          color: #6b7280;
          font-size: 13px;
        }

        .header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .create-btn {
          display: inline-block;
          padding: 10px 16px;
          text-decoration: none;
          color: white;
          background: #2563eb;
          border-radius: 5px;
          font-weight: bold;
        }

        .create-btn:hover {
          background: #1d4ed8;
        }

        .trash-btn {
          padding: 10px 16px;
          border: 1px solid #d1d5db;
          border-radius: 5px;
          background: white;
          cursor: pointer;
          font-weight: 600;
        }

        .trash-btn:hover,
        .trash-btn.active {
          background: #f3f4f6;
        }

        .toolbar {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }

        .search-input {
          padding: 9px 12px;
          border: 1px solid #d1d5db;
          border-radius: 5px;
          width: 300px;
        }

        .status-select,
        .sort-select {
          padding: 9px 12px;
          border: 1px solid #d1d5db;
          border-radius: 5px;
          background: white;
        }

        .bulk-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 12px 15px;
          margin-bottom: 15px;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          border-radius: 7px;
        }

        .bulk-actions {
          display: flex;
          gap: 8px;
          margin-left: auto;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          background: #fff;
        }

        .table th {
          background: #f3f4f6;
          text-align: left;
          padding: 11px;
          border: 1px solid #ddd;
          white-space: nowrap;
        }

        .table td {
          padding: 11px;
          vertical-align: top;
          border: 1px solid #ddd;
        }

        .title-cell {
          font-weight: bold;
          color: #111827;
        }

        .slug {
          margin-top: 5px;
          font-size: 11px;
          color: #15803d;
          word-break: break-all;
        }

        .description {
          color: #374151;
          line-height: 1.5;
          max-height: 100px;
          overflow: hidden;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 9px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .status-draft {
          background: #e5e7eb;
          color: #374151;
        }

        .status-published {
          background: #d1fae5;
          color: #065f46;
        }

        .status-archived {
          background: #fee2e2;
          color: #991b1b;
        }

        .content-stats {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
          color: #4b5563;
        }

        .seo-ready {
          display: inline-block;
          margin-top: 8px;
          font-size: 10px;
          padding: 3px 7px;
          background: #ede9fe;
          color: #6d28d9;
          border-radius: 10px;
          font-weight: bold;
        }

        .action-btns {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }

        .edit-link {
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
          padding: 5px 7px;
        }

        .export-btn,
        .delete-btn,
        .restore-btn,
        .danger-btn {
          padding: 6px 9px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .export-btn {
          border: 1px solid #d1d5db;
          background: white;
        }

        .export-btn:hover {
          background: #f3f4f6;
        }

        .delete-btn {
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #b91c1c;
        }

        .delete-btn:hover,
        .danger-btn:hover {
          background: #fee2e2;
        }

        .restore-btn {
          border: 1px solid #bbf7d0;
          background: #f0fdf4;
          color: #15803d;
          font-weight: 600;
        }

        .restore-btn:hover {
          background: #dcfce7;
        }

        .danger-btn {
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #b91c1c;
          font-weight: 600;
        }

        .trash-summary {
          display: flex;
          margin-bottom: 15px;
        }

        .trash-summary > div {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 8px;
          padding: 15px 25px;
          display: flex;
          flex-direction: column;
        }

        .trash-summary strong {
          font-size: 24px;
          color: #c2410c;
        }

        .trash-summary span {
          font-size: 12px;
          color: #78716c;
        }

        .trashed-row {
          background: #fffbeb;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 20px;
        }

        .page-btn {
          padding: 8px 14px;
          border: 1px solid #d1d5db;
          border-radius: 5px;
          background: #fff;
          cursor: pointer;
        }

        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-info {
          color: #4b5563;
          font-size: 13px;
        }

        .empty {
          text-align: center;
          padding: 30px;
          color: #6b7280;
        }

        @media (max-width: 768px) {

          .topbar {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-actions {
            width: 100%;
            flex-wrap: wrap;
          }

          .toolbar {
            flex-direction: column;
          }

          .search-input {
            width: 100%;
            box-sizing: border-box;
          }

          .bulk-bar {
            flex-direction: column;
            align-items: flex-start;
          }

          .bulk-actions {
            margin-left: 0;
            flex-wrap: wrap;
          }

        }

      `}</style>

    </div>
  );
}