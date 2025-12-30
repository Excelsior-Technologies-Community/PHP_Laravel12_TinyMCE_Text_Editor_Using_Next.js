import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const TinyEditor = dynamic(() => import("../tinymce"), { ssr: false });

export default function Edit() {
  const router = useRouter();
  const { id } = router.query;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!id) return;

    fetch(`/api/posts/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTitle(data.title);
        setDescription(data.description);
      });
  }, [id]);

  const update = async () => {
    await fetch(`/api/posts/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });

    router.push("/");
  };

  return (
    <div className="wrapper">
      <h2>Edit Post</h2>

      <label>Title</label>
      <input
        className="input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label>Description</label>

      {/* 🔥 key={id} = NO refresh while typing */}
      <TinyEditor
        key={id}
        value={description}
        onChange={setDescription}
      />

      <button type="button" className="btn" onClick={update}>
        Update
      </button>

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
          margin-top: 15px;
          padding: 10px 18px;
          background: #16a34a;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn:hover {
          background: #15803d;
        }
      `}</style>
    </div>
  );
}
