import { useEffect, useRef } from "react";

export default function TinyEditor({ value = "", onChange }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tinymce@6/tinymce.min.js";

    script.onload = () => {
      window.tinymce.init({
        selector: "#editor",
        height: 300,
        menubar: false,
        plugins: "lists link code",
        toolbar: "undo redo | bold italic | bullist numlist | code",
        setup: (editor) => {
          editorRef.current = editor;

          editor.on("init", () => {
            editor.setContent(value || "");
          });

          editor.on("Change KeyUp", () => {
            onChange(editor.getContent());
          });
        },
      });
    };

    document.body.appendChild(script);

    return () => {
      if (window.tinymce) {
        window.tinymce.remove();
      }
    };
  }, []);

  // 🔥 THIS FIXES EDIT ISSUE
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getContent()) {
      editorRef.current.setContent(value || "");
    }
  }, [value]);

  return <textarea id="editor"></textarea>;
}
