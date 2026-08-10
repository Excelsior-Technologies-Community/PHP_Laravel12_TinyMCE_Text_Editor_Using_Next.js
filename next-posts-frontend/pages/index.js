import { useEffect, useState } from "react";

export default function Index() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    fetch("/api/posts/statuses")
      .then((res) => res.json())
      .then((data) => setStatuses(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    params.set("page", page);
    params.set("per_page", "10");

    fetch(`/api/posts?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.data || []);
        setLastPage(data.last_page || 1);
        setTotal(data.total || 0);
      });
  }, [search, status, page]);

  const handleExportWord = (post) => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>${post.title}</title></head>
      <body><h1>${post.title}</h1><div>${post.description}</div></body></html>
    `;
    const blob = new Blob([htmlContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${post.title.replace(/[^a-zA-Z0-9]+/g, "_")}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = (post) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
      <head><title>${post.title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        h1 { margin-bottom: 10px; }
        .meta { color: #666; margin-bottom: 20px; }
      </style>
      </head>
      <body>
        <h1>${post.title}</h1>
        <div class="meta">Status: ${post.status}</div>
        <div>${post.description}</div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="container">
      <h2 className="heading">Posts</h2>

      <a href="/create" className="create-btn">
        + Create New
      </a>

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Search posts..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="status-select"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          {Object.entries(statuses).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th style={{ width: "60px" }}>ID</th>
            <th style={{ width: "200px" }}>Title</th>
            <th>Description</th>
            <th style={{ width: "100px" }}>Status</th>
            <th style={{ width: "180px" }}>Action</th>
          </tr>
        </thead>

        <tbody>
          {posts.length === 0 && (
            <tr>
              <td colSpan="5" className="empty">
                No records found
              </td>
            </tr>
          )}

          {posts.map((post) => (
            <tr key={post.id}>
              <td>{post.id}</td>
              <td className="title-cell">{post.title}</td>
              <td>
                <div
                  className="description"
                  dangerouslySetInnerHTML={{ __html: post.description }}
                />
              </td>
              <td>
                <span className={`status-badge status-${post.status || "draft"}`}>
                  {post.status || "draft"}
                </span>
              </td>
              <td>
                <div className="action-btns">
                  <a href={`/edit?id=${post.id}`} className="edit-link">
                    Edit
                  </a>
                  <button
                    className="export-btn"
                    onClick={() => handleExportWord(post)}
                    title="Export Word"
                  >
                    Word
                  </button>
                  <button
                    className="export-btn"
                    onClick={() => handlePrint(post)}
                    title="Print Preview"
                  >
                    Print
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button
          className="page-btn"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span className="page-info">
          Page {page} of {lastPage} ({total} total)
        </span>
        <button
          className="page-btn"
          disabled={page >= lastPage}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>

      <style jsx>{`
        .container {
          max-width: 1100px;
          margin: 40px auto;
          font-family: Arial, sans-serif;
        }

        .heading {
          margin-bottom: 10px;
        }

        .create-btn {
          display: inline-block;
          margin-bottom: 15px;
          text-decoration: none;
          color: #2563eb;
          font-weight: bold;
        }

        .toolbar {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .search-input {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          width: 300px;
        }

        .status-select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          background: #fff;
        }

        .table th {
          background: #f3f4f6;
          text-align: left;
          padding: 10px;
          border: 1px solid #ddd;
        }

        .table td {
          padding: 10px;
          vertical-align: top;
          border: 1px solid #ddd;
        }

        .title-cell {
          font-weight: bold;
          color: #111827;
        }

        .description {
          color: #374151;
          line-height: 1.5;
        }

        .status-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 12px;
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

        .edit-link {
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
          margin-right: 8px;
        }

        .edit-link:hover {
          text-decoration: underline;
        }

        .action-btns {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }

        .export-btn {
          padding: 4px 8px;
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
          gap: 10px;
          margin-top: 15px;
        }

        .page-btn {
          padding: 8px 14px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: #fff;
          cursor: pointer;
        }

        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-info {
          color: #4b5563;
        }

        .empty {
          text-align: center;
          padding: 20px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
