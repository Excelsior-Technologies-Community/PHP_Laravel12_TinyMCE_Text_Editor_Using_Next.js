import { useEffect, useRef } from "react";

export default function TinyEditor({ value = "", onChange, postId }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tinymce@6/tinymce.min.js";

    script.onload = () => {
      const imagesListUrl = postId
        ? `/api/posts/images?post_id=${postId}`
        : "/api/posts/images";

      window.tinymce.init({
        selector: "#editor",
        height: 400,
        menubar: true,
        plugins:
          "lists link code codesample image media table preview anchor searchreplace visualblocks fullscreen",
        toolbar:
          "undo redo | formatselect | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table codesample | preview | code | searchreplace",
        images_upload_url: "/api/posts/images/upload",
        automatic_uploads: true,
        image_upload_handler: (blobInfo, progress) =>
          new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append("file", blobInfo.blob(), blobInfo.filename());
            if (postId) {
              formData.append("post_id", postId);
            }

            fetch("/api/posts/images/upload", {
              method: "POST",
              body: formData,
            })
              .then((res) => {
                if (!res.ok) throw new Error("Upload failed");
                return res.json();
              })
              .then((data) => resolve(data.url))
              .catch((err) => reject(err));
          }),
        images_list: (success) => {
          fetch(imagesListUrl)
            .then((res) => res.json())
            .then((data) => {
              const list = Array.isArray(data)
                ? data.map((img) => ({ title: img.filename, value: img.url }))
                : [];
              success(list);
            })
            .catch(() => success([]));
        },
        paste_data_images: true,
        drag_drop_upload: true,
        setup: (editor) => {
          editorRef.current = editor;

          editor.on("init", () => {
            editor.setContent(value || "");
          });

          editor.on("Change KeyUp NodeChange", () => {
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
  }, [postId]);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getContent()) {
      editorRef.current.setContent(value || "");
    }
  }, [value]);

  return <textarea id="editor"></textarea>;
}
