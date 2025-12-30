import { useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

const TinyEditor = dynamic(() => import("../tinymce"), { ssr: false });

export default function Create() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const save = async () => {
    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });

    router.push("/");
  };

  return (
    <div className="wrapper">
      <h2>Create Post</h2>

      <label>Title</label>
      <input
        className="input"
        placeholder="Enter title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label>Description</label>
      <TinyEditor onChange={setDescription} />

      <button type="button" className="btn" onClick={save}>
        Save
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
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn:hover {
          background: #1d4ed8;
        }
      `}</style>
    </div>
  );
}
