/**
 * imageToBase64.js  —  Groq / Llama 4 Scout edition
 * ─────────────────────────────────────────────────
 * Groq vision expects images as a full data-URL string:
 *   "data:image/jpeg;base64,<base64data>"
 *
 * This is DIFFERENT from Anthropic, which wants the prefix stripped.
 * Every function here returns { dataUrl, mediaType } ready for Groq.
 *
 * Usage:
 *   import { fileToGroqImage, toGroqImageBlock } from "./imageToBase64";
 */


// ─────────────────────────────────────────────────
// 1. Detect media type
// ─────────────────────────────────────────────────

export function getMediaType(fileOrName) {
  const name = typeof fileOrName === "string" ? fileOrName : fileOrName?.name ?? "";
  const ext  = name.split(".").pop().toLowerCase();
  if (fileOrName?.type?.startsWith("image/")) return fileOrName.type;
  return { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
           gif: "image/gif", webp: "image/webp" }[ext] ?? "image/jpeg";
}


// ─────────────────────────────────────────────────
// 2. Resize helper (reduces tokens, keeps quality)
// ─────────────────────────────────────────────────

function resizeDataUrl(dataUrl, maxPx, mediaType = "image/jpeg") {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error("Failed to load image for resizing."));
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      if (w <= maxPx && h <= maxPx) { resolve(dataUrl); return; }
      const scale  = maxPx / Math.max(w, h);
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL(mediaType, mediaType === "image/png" ? 1 : 0.92));
    };
    img.src = dataUrl;
  });
}


// ─────────────────────────────────────────────────
// 3. File → Groq image object
// ─────────────────────────────────────────────────

/**
 * Converts a File (from <input> or drag-and-drop) to a Groq-ready object.
 * @param {File}   file
 * @param {number} [maxPx=1024]  Groq recommends keeping images under 1024px
 * @returns {Promise<{ dataUrl: string, mediaType: string }>}
 */
export function fileToGroqImage(file, maxPx = 1024) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("FileReader failed."));
    reader.onload  = async (e) => {
      try {
        const mediaType = getMediaType(file);
        const dataUrl   = maxPx > 0
          ? await resizeDataUrl(e.target.result, maxPx, mediaType)
          : e.target.result;
        resolve({ dataUrl, mediaType });
      } catch (err) { reject(err); }
    };
    reader.readAsDataURL(file);
  });
}


// ─────────────────────────────────────────────────
// 4. Blob → Groq image object
// ─────────────────────────────────────────────────

export function blobToGroqImage(blob, filename = "capture.jpg", maxPx = 1024) {
  const file = new File([blob], filename, { type: blob.type || "image/jpeg" });
  return fileToGroqImage(file, maxPx);
}


// ─────────────────────────────────────────────────
// 5. URL → Groq image object
// ─────────────────────────────────────────────────

export async function urlToGroqImage(url, maxPx = 1024) {
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const blob = await res.blob();
  return blobToGroqImage(blob, url.split("/").pop() || "image.jpg", maxPx);
}


// ─────────────────────────────────────────────────
// 6. Build the Groq message content block
//    This is what goes inside messages[].content[]
// ─────────────────────────────────────────────────

/**
 * Returns the image_url content block Groq/OpenAI-compatible APIs expect.
 *
 * Groq format (different from Anthropic!):
 * {
 *   type: "image_url",
 *   image_url: { url: "data:image/jpeg;base64,..." }
 * }
 *
 * @param {File|Blob|string} source
 * @param {number} [maxPx=1024]
 * @returns {Promise<object>}
 *
 * @example
 * const block = await toGroqImageBlock(file);
 * // Use in API call:
 * content: [ block, { type: "text", text: "Analyse my skin." } ]
 */
export async function toGroqImageBlock(source, maxPx = 1024) {
  let dataUrl;

  if (typeof source === "string" && source.startsWith("data:")) {
    dataUrl = source;                          // already a data-URL
  } else if (typeof source === "string") {
    ({ dataUrl } = await urlToGroqImage(source, maxPx));
  } else if (source instanceof File) {
    ({ dataUrl } = await fileToGroqImage(source, maxPx));
  } else if (source instanceof Blob) {
    ({ dataUrl } = await blobToGroqImage(source, "image.jpg", maxPx));
  } else {
    throw new TypeError("source must be a File, Blob, data-URL string, or remote URL");
  }

  return {
    type: "image_url",
    image_url: { url: dataUrl },   // Groq reads the full data:image/...;base64,... string
  };
}


// ─────────────────────────────────────────────────
// Usage examples
// ─────────────────────────────────────────────────
//
// import { toGroqImageBlock } from "./imageToBase64";
//
// const imageBlock = await toGroqImageBlock(file);
//
// const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//     "Authorization": `Bearer ${GROQ_API_KEY}`,
//   },
//   body: JSON.stringify({
//     model: "meta-llama/llama-4-scout-17b-16e-instruct",
//     messages: [{
//       role: "user",
//       content: [
//         imageBlock,
//         { type: "text", text: "Analyse my skin type." }
//       ]
//     }],
//     response_format: { type: "json_object" },  // ← Groq supports this natively!
//   })
// });