import { useEffect, useState } from "react";

export default function Index() {
  const [posts, setPosts] = useState([]);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [lastPage, setLastPage] =
    useState(1);

  const [total, setTotal] =
    useState(0);

  const [statuses, setStatuses] =
    useState({});

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    fetch("/api/posts/statuses")
      .then((res) => res.json())
      .then((data) =>
        setStatuses(data)
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params =
      new URLSearchParams();

    if (search) {
      params.set(
        "search",
        search
      );
    }

    if (status) {
      params.set(
        "status",
        status
      );
    }

    params.set(
      "page",
      page
    );

    params.set(
      "per_page",
      "10"
    );

    setLoading(true);

    fetch(
      `/api/posts?${params.toString()}`
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            "Failed to load posts"
          );
        }

        return res.json();
      })
      .then((data) => {
        setPosts(
          data.data || []
        );

        setLastPage(
          data.last_page || 1
        );

        setTotal(
          data.total || 0
        );
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
  ]);

  /*
  |--------------------------------------------------------------------------
  | Extract text from HTML
  |--------------------------------------------------------------------------
  */
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

  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */
  const getStats = (post) => {
    const text =
      getText(
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
            Math.ceil(
              words / 200
            )
          )
        : 0;

    return {
      words,
      readingTime,
    };
  };

  /*
  |--------------------------------------------------------------------------
  | Word Export
  |--------------------------------------------------------------------------
  */
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

          <h1>
            ${post.title}
          </h1>

          <div>
            ${post.description || ""}
          </div>

        </body>

      </html>
    `;

    const blob =
      new Blob(
        [htmlContent],
        {
          type:
            "application/msword",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

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

    URL.revokeObjectURL(
      url
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Print
  |--------------------------------------------------------------------------
  */
  const handlePrint = (
    post
  ) => {
    const win =
      window.open(
        "",
        "_blank"
      );

    if (!win) return;

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

  return (
    <div className="container">

      <div className="topbar">

        <div>
          <h2 className="heading">
            Posts
          </h2>

          <p className="subtitle">
            Manage your rich-text
            content and SEO metadata.
          </p>
        </div>

        <a
          href="/create"
          className="create-btn"
        >
          + Create New
        </a>

      </div>

      {/* =====================================================
          FILTERS
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

      </div>

      {/* =====================================================
          TABLE
      ====================================================== */}

      <div className="table-wrapper">

        <table className="table">

          <thead>

            <tr>

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
                  width: "230px",
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
                  colSpan="6"
                  className="empty"
                >
                  Loading posts...
                </td>
              </tr>
            )}

            {!loading &&
              posts.length === 0 && (
                <tr>

                  <td
                    colSpan="6"
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
                    getStats(post);

                  return (
                    <tr
                      key={post.id}
                    >

                      <td>
                        {post.id}
                      </td>

                      <td>

                        <div className="title-cell">
                          {post.title}
                        </div>

                        {post.slug && (
                          <div className="slug">
                            /posts/
                            {post.slug}
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
                          className={
                            `status-badge status-${
                              post.status ||
                              "draft"
                            }`
                          }
                        >
                          {post.status ||
                            "draft"}
                        </span>

                      </td>

                      <td>

                        <div className="content-stats">

                          <span>
                            {stats.words}
                            {" "}
                            words
                          </span>

                          <span>
                            {stats.readingTime}
                            {" "}
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
          {" "}
          total)

        </span>

        <button
          className="page-btn"
          disabled={
            page >= lastPage
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

      <style jsx>{`

        .container {
          max-width: 1200px;
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

        .toolbar {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .search-input {
          padding: 9px 12px;
          border: 1px solid #d1d5db;
          border-radius: 5px;
          width: 300px;
        }

        .status-select {
          padding: 9px 12px;
          border: 1px solid #d1d5db;
          border-radius: 5px;
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
          padding: 4px 7px;
        }

        .edit-link:hover {
          text-decoration: underline;
        }

        .export-btn {
          padding: 5px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: #fff;
          cursor: pointer;
          font-size: 12px;
        }

        .export-btn:hover {
          background: #f3f4f6;
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

          .toolbar {
            flex-direction: column;
          }

          .search-input {
            width: 100%;
            box-sizing: border-box;
          }

        }

      `}</style>

    </div>
  );
}