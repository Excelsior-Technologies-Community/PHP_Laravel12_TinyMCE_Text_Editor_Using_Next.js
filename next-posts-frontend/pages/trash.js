```jsx
import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = "http://127.0.0.1:8000/api";

export default function Trash() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);

    const perPage = 5;

    /*
    |--------------------------------------------------------------------------
    | Load Trash
    |--------------------------------------------------------------------------
    */
    const loadTrash = async (page = 1) => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/posts/trashed?page=${page}&per_page=${perPage}`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            const text = await response.text();

            let data;

            try {
                data = JSON.parse(text);
            } catch {
                console.error("Laravel response:", text);

                throw new Error(
                    "Laravel returned an invalid response."
                );
            }

            if (!response.ok) {
                console.error("Trash API Error:", data);

                throw new Error(
                    data.message ||
                    data.error ||
                    `Failed to load trash. HTTP ${response.status}`
                );
            }

            setPosts(data.data || []);
            setCurrentPage(data.current_page || 1);
            setLastPage(data.last_page || 1);
            setTotal(data.total || 0);
        } catch (err) {
            console.error("Failed to load trash:", err);

            setError(
                err.message || "Failed to load trash."
            );

            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Initial Load
    |--------------------------------------------------------------------------
    */
    useEffect(() => {
        loadTrash(1);
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Restore Post
    |--------------------------------------------------------------------------
    */
    const restorePost = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to restore this post?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/posts/${id}/restore`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to restore post."
                );
            }

            alert(
                data.message ||
                "Post restored successfully."
            );

            loadTrash(currentPage);
        } catch (err) {
            console.error(err);

            alert(
                err.message ||
                "Failed to restore post."
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Permanent Delete
    |--------------------------------------------------------------------------
    */
    const permanentlyDelete = async (id) => {
        const confirmed = window.confirm(
            "This will permanently delete the post. This action cannot be undone. Continue?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/posts/${id}/force-delete`,
                {
                    method: "DELETE",
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to permanently delete post."
                );
            }

            alert(
                data.message ||
                "Post permanently deleted."
            );

            /*
            |--------------------------------------------------------------
            | If last item on page was deleted, go to previous page
            |--------------------------------------------------------------
            */

            if (
                posts.length === 1 &&
                currentPage > 1
            ) {
                loadTrash(currentPage - 1);
            } else {
                loadTrash(currentPage);
            }
        } catch (err) {
            console.error(err);

            alert(
                err.message ||
                "Failed to permanently delete post."
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Previous Page
    |--------------------------------------------------------------------------
    */
    const previousPage = () => {
        if (currentPage > 1) {
            loadTrash(currentPage - 1);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Next Page
    |--------------------------------------------------------------------------
    */
    const nextPage = () => {
        if (currentPage < lastPage) {
            loadTrash(currentPage + 1);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Format Date
    |--------------------------------------------------------------------------
    */
    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleString();
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f8fafc",
                padding: "30px",
            }}
        >
            <div
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "25px",
                        gap: "20px",
                        flexWrap: "wrap",
                    }}
                >
                    <div>
                        <h1
                            style={{
                                margin: 0,
                                fontSize: "30px",
                                fontWeight: "700",
                                color: "#111827",
                            }}
                        >
                            Trash
                        </h1>

                        <p
                            style={{
                                marginTop: "7px",
                                marginBottom: 0,
                                color: "#6b7280",
                            }}
                        >
                            Manage deleted posts.
                        </p>
                    </div>

                    <Link
                        href="/"
                        style={{
                            textDecoration: "none",
                            background: "#111827",
                            color: "#ffffff",
                            padding: "11px 18px",
                            borderRadius: "8px",
                            fontWeight: "600",
                            display: "inline-block",
                        }}
                    >
                        ← Back to Posts
                    </Link>
                </div>

                {/* Statistics */}
                <div
                    style={{
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        padding: "20px",
                        marginBottom: "20px",
                    }}
                >
                    <div
                        style={{
                            fontSize: "13px",
                            color: "#6b7280",
                            marginBottom: "5px",
                        }}
                    >
                        TRASHED POSTS
                    </div>

                    <div
                        style={{
                            fontSize: "30px",
                            fontWeight: "700",
                            color: "#111827",
                        }}
                    >
                        {total}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div
                        style={{
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            color: "#991b1b",
                            padding: "15px",
                            borderRadius: "8px",
                            marginBottom: "20px",
                        }}
                    >
                        <strong>Error:</strong> {error}

                        <div style={{ marginTop: "10px" }}>
                            <button
                                onClick={() =>
                                    loadTrash(currentPage)
                                }
                                style={{
                                    border: "none",
                                    background: "#dc2626",
                                    color: "#ffffff",
                                    padding: "8px 14px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                }}
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div
                        style={{
                            background: "#ffffff",
                            borderRadius: "12px",
                            padding: "50px",
                            textAlign: "center",
                            border: "1px solid #e5e7eb",
                            color: "#6b7280",
                        }}
                    >
                        Loading trash...
                    </div>
                ) : (
                    <>
                        {/* Table */}
                        <div
                            style={{
                                background: "#ffffff",
                                borderRadius: "12px",
                                border: "1px solid #e5e7eb",
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    overflowX: "auto",
                                }}
                            >
                                <table
                                    style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                        minWidth: "750px",
                                    }}
                                >
                                    <thead>
                                        <tr
                                            style={{
                                                background: "#f9fafb",
                                            }}
                                        >
                                            <th style={thStyle}>
                                                ID
                                            </th>

                                            <th style={thStyle}>
                                                Title
                                            </th>

                                            <th style={thStyle}>
                                                Status
                                            </th>

                                            <th style={thStyle}>
                                                Deleted At
                                            </th>

                                            <th style={thStyle}>
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {posts.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="5"
                                                    style={{
                                                        padding:
                                                            "50px 20px",
                                                        textAlign:
                                                            "center",
                                                        color:
                                                            "#6b7280",
                                                    }}
                                                >
                                                    Trash is empty
                                                </td>
                                            </tr>
                                        ) : (
                                            posts.map((post) => (
                                                <tr
                                                    key={
                                                        post.id
                                                    }
                                                    style={{
                                                        borderTop:
                                                            "1px solid #f1f5f9",
                                                    }}
                                                >
                                                    <td
                                                        style={
                                                            tdStyle
                                                        }
                                                    >
                                                        {post.id}
                                                    </td>

                                                    <td
                                                        style={{
                                                            ...tdStyle,
                                                            fontWeight:
                                                                "600",
                                                            color:
                                                                "#111827",
                                                        }}
                                                    >
                                                        {post.title}
                                                    </td>

                                                    <td
                                                        style={
                                                            tdStyle
                                                        }
                                                    >
                                                        <span
                                                            style={{
                                                                background:
                                                                    "#fee2e2",
                                                                color:
                                                                    "#991b1b",
                                                                padding:
                                                                    "5px 10px",
                                                                borderRadius:
                                                                    "20px",
                                                                fontSize:
                                                                    "12px",
                                                                fontWeight:
                                                                    "600",
                                                            }}
                                                        >
                                                            Trashed
                                                        </span>
                                                    </td>

                                                    <td
                                                        style={
                                                            tdStyle
                                                        }
                                                    >
                                                        {formatDate(
                                                            post.deleted_at
                                                        )}
                                                    </td>

                                                    <td
                                                        style={
                                                            tdStyle
                                                        }
                                                    >
                                                        <div
                                                            style={{
                                                                display:
                                                                    "flex",
                                                                gap: "8px",
                                                                flexWrap:
                                                                    "wrap",
                                                            }}
                                                        >
                                                            <button
                                                                onClick={() =>
                                                                    restorePost(
                                                                        post.id
                                                                    )
                                                                }
                                                                style={{
                                                                    border:
                                                                        "none",
                                                                    background:
                                                                        "#16a34a",
                                                                    color:
                                                                        "#ffffff",
                                                                    padding:
                                                                        "8px 12px",
                                                                    borderRadius:
                                                                        "6px",
                                                                    cursor:
                                                                        "pointer",
                                                                    fontWeight:
                                                                        "600",
                                                                }}
                                                            >
                                                                Restore
                                                            </button>

                                                            <button
                                                                onClick={() =>
                                                                    permanentlyDelete(
                                                                        post.id
                                                                    )
                                                                }
                                                                style={{
                                                                    border:
                                                                        "none",
                                                                    background:
                                                                        "#dc2626",
                                                                    color:
                                                                        "#ffffff",
                                                                    padding:
                                                                        "8px 12px",
                                                                    borderRadius:
                                                                        "6px",
                                                                    cursor:
                                                                        "pointer",
                                                                    fontWeight:
                                                                        "600",
                                                                }}
                                                            >
                                                                Delete Forever
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        <div
                            style={{
                                marginTop: "20px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "15px",
                            }}
                        >
                            <button
                                onClick={previousPage}
                                disabled={
                                    currentPage <= 1
                                }
                                style={{
                                    padding: "9px 16px",
                                    borderRadius: "7px",
                                    border: "1px solid #d1d5db",
                                    background:
                                        currentPage <= 1
                                            ? "#f3f4f6"
                                            : "#ffffff",
                                    color:
                                        currentPage <= 1
                                            ? "#9ca3af"
                                            : "#111827",
                                    cursor:
                                        currentPage <= 1
                                            ? "not-allowed"
                                            : "pointer",
                                    fontWeight: "600",
                                }}
                            >
                                Previous
                            </button>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    color: "#4b5563",
                                    fontWeight: "600",
                                }}
                            >
                                Page {currentPage} of{" "}
                                {lastPage} ({total} total)
                            </div>

                            <button
                                onClick={nextPage}
                                disabled={
                                    currentPage >=
                                    lastPage
                                }
                                style={{
                                    padding: "9px 16px",
                                    borderRadius: "7px",
                                    border: "1px solid #d1d5db",
                                    background:
                                        currentPage >=
                                        lastPage
                                            ? "#f3f4f6"
                                            : "#ffffff",
                                    color:
                                        currentPage >=
                                        lastPage
                                            ? "#9ca3af"
                                            : "#111827",
                                    cursor:
                                        currentPage >=
                                        lastPage
                                            ? "not-allowed"
                                            : "pointer",
                                    fontWeight: "600",
                                }}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

const thStyle = {
    textAlign: "left",
    padding: "14px 16px",
    fontSize: "13px",
    fontWeight: "700",
    color: "#374151",
    whiteSpace: "nowrap",
};

const tdStyle = {
    padding: "15px 16px",
    fontSize: "14px",
    color: "#4b5563",
    verticalAlign: "middle",
};
```
