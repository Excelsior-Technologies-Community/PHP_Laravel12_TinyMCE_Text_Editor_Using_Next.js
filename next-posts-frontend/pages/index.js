import { useEffect, useState } from "react";

export default function Index() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => setPosts(data));
  }, []);

  return (
    <div className="container">
      <h2 className="heading">Posts</h2>

      <a href="/create" className="create-btn">
        + Create New
      </a>

      <table className="table">
        <thead>
          <tr>
            <th style={{ width: "60px" }}>ID</th>
            <th style={{ width: "200px" }}>Title</th>
            <th>Description</th>
            <th style={{ width: "100px" }}>Action</th>
          </tr>
        </thead>

        <tbody>
          {posts.length === 0 && (
            <tr>
              <td colSpan="4" className="empty">
                No records found
              </td>
            </tr>
          )}

          {posts.map((post) => (
            <tr key={post.id}>
              <td>{post.id}</td>

              <td className="title-cell">
                {post.title}
              </td>

              <td>
                <div
                  className="description"
                  dangerouslySetInnerHTML={{ __html: post.description }}
                />
              </td>

              <td>
                <a href={`/edit?id=${post.id}`} className="edit-link">
                  Edit
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Inline CSS */}
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

        .edit-link {
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
        }

        .edit-link:hover {
          text-decoration: underline;
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
