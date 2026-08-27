import { useEffect, useRef } from "react";

export default function TinyEditor({
  value = "",
  onChange,
  postId,
  onStatsChange,
}) {
  const editorRef = useRef(null);
  const containerId = useRef(
    `tiny-editor-${Math.random().toString(36).substring(2, 10)}`
  );

  const calculateStats = (html) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html || "";

    const text = tempDiv.textContent || tempDiv.innerText || "";

    const cleanText = text.replace(/\s+/g, " ").trim();

    const words = cleanText
      ? cleanText.split(/\s+/).filter(Boolean).length
      : 0;

    const characters = cleanText.length;

    const charactersWithoutSpaces = cleanText.replace(/\s/g, "").length;

    const paragraphs = tempDiv.querySelectorAll("p").length;

    const lineBreaks = tempDiv.querySelectorAll("br").length;

    const calculatedParagraphs =
      paragraphs > 0
        ? paragraphs
        : cleanText
        ? Math.max(1, lineBreaks + 1)
        : 0;

    const readingTime =
      words > 0
        ? Math.max(1, Math.ceil(words / 200))
        : 0;

    return {
      words,
      characters,
      charactersWithoutSpaces,
      paragraphs: calculatedParagraphs,
      readingTime,
    };
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const script = document.createElement("script");

    script.src =
      "https://cdn.jsdelivr.net/npm/tinymce@6/tinymce.min.js";

    script.onload = () => {
      const imagesListUrl = postId
        ? `/api/posts/images?post_id=${postId}`
        : "/api/posts/images";

      window.tinymce.init({
        selector: `#${containerId.current}`,

        height: 400,

        menubar: true,

        plugins:
          "lists link code codesample image media table preview anchor searchreplace visualblocks fullscreen wordcount",

        toolbar:
          "undo redo | formatselect | bold italic underline strikethrough | " +
          "forecolor backcolor | alignleft aligncenter alignright alignjustify | " +
          "bullist numlist outdent indent | link image media table codesample | " +
          "preview | code | searchreplace | fullscreen",

        images_upload_url:
          "/api/posts/images/upload",

        automatic_uploads: true,

        image_upload_handler: (blobInfo, progress) =>
          new Promise((resolve, reject) => {
            const formData = new FormData();

            formData.append(
              "file",
              blobInfo.blob(),
              blobInfo.filename()
            );

            if (postId) {
              formData.append("post_id", postId);
            }

            fetch("/api/posts/images/upload", {
              method: "POST",
              body: formData,
            })
              .then((res) => {
                if (!res.ok) {
                  throw new Error("Upload failed");
                }

                return res.json();
              })
              .then((data) => {
                resolve(data.url);
              })
              .catch((err) => {
                reject(err);
              });
          }),

        images_list: (success) => {
          fetch(imagesListUrl)
            .then((res) => res.json())
            .then((data) => {
              const list = Array.isArray(data)
                ? data.map((img) => ({
                    title: img.filename,
                    value: img.url,
                  }))
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

            if (onStatsChange) {
              onStatsChange(
                calculateStats(value || "")
              );
            }
          });

          editor.on(
            "Change KeyUp NodeChange",
            () => {
              const content = editor.getContent();

              onChange(content);

              if (onStatsChange) {
                onStatsChange(
                  calculateStats(content)
                );
              }
            }
          );
        },
      });
    };

    document.body.appendChild(script);

    return () => {
      if (window.tinymce) {
        const editor = window.tinymce.get(
          containerId.current
        );

        if (editor) {
          editor.remove();
        }
      }

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [postId]);

  useEffect(() => {
    if (
      editorRef.current &&
      value !== editorRef.current.getContent()
    ) {
      editorRef.current.setContent(value || "");

      if (onStatsChange) {
        const tempDiv = document.createElement("div");

        tempDiv.innerHTML = value || "";

        const text =
          tempDiv.textContent ||
          tempDiv.innerText ||
          "";

        const cleanText =
          text.replace(/\s+/g, " ").trim();

        const words = cleanText
          ? cleanText
              .split(/\s+/)
              .filter(Boolean).length
          : 0;

        const characters = cleanText.length;

        const charactersWithoutSpaces =
          cleanText.replace(/\s/g, "").length;

        const paragraphs =
          tempDiv.querySelectorAll("p").length;

        const readingTime =
          words > 0
            ? Math.max(1, Math.ceil(words / 200))
            : 0;

        onStatsChange({
          words,
          characters,
          charactersWithoutSpaces,
          paragraphs,
          readingTime,
        });
      }
    }
  }, [value]);

  return (
    <textarea
      id={containerId.current}
      defaultValue=""
    />
  );
}