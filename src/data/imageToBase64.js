/**
 * imageToBase64.js
 * ─────────────────────────────────────────────
 * Utilities to convert images → base64 for the
 * Anthropic Vision API (claude-sonnet-4-20250514)
 *
 * Three sources supported:
 *   1. File object  (from <input type="file"> or drag-and-drop)
 *   2. Blob object  (from camera capture / canvas.toBlob)
 *   3. URL string   (remote image or local object URL)
 *
 * Usage:
 *   import { fileToBase64, blobToBase64, urlToBase64, getMediaType } from "./imageToBase64";
 */


// ─────────────────────────────────────────────
// 1. Detect media type from a File or filename
// ─────────────────────────────────────────────

/**
 * Returns the Anthropic-compatible media_type string for a file.
 * Anthropic accepts: image/jpeg, image/png, image/gif, image/webp
 *
 * @param {File|string} fileOrName  - A File object or a filename string
 * @returns {string}                - e.g. "image/jpeg"
 */
export function getMediaType(fileOrName) {
  const name = typeof fileOrName === "string" ? fileOrName : fileOrName?.name ?? "";
  const ext  = name.split(".").pop().toLowerCase();

  const map = {
    jpg:  "image/jpeg",
    jpeg: "image/jpeg",
    png:  "image/png",
    gif:  "image/gif",
    webp: "image/webp",
  };

  // Prefer the MIME type already on the File object when available
  if (fileOrName?.type && fileOrName.type.startsWith("image/")) {
    return fileOrName.type;
  }

  return map[ext] ?? "image/jpeg"; // safe default
}


// ─────────────────────────────────────────────
// 2. File → base64
// ─────────────────────────────────────────────

/**
 * Converts a File (from <input type="file"> or drag-and-drop) to a
 * base64-encoded string WITHOUT the data-URL prefix.
 *
 * @param {File}    file        - The image file to convert
 * @param {number}  [maxPx=1200] - Resize longest edge to this many pixels
 *                                 before encoding (reduces token cost).
 *                                 Pass 0 to skip resizing.
 * @returns {Promise<{ data: string, media_type: string }>}
 */
export function fileToBase64(file, maxPx = 1200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("FileReader failed to read the file."));

    reader.onload = async (e) => {
      try {
        const dataUrl    = e.target.result;           // "data:image/jpeg;base64,..."
        const media_type = getMediaType(file);

        if (maxPx > 0) {
          const resized = await resizeDataUrl(dataUrl, maxPx, media_type);
          const data    = resized.split(",")[1];       // strip prefix
          resolve({ data, media_type });
        } else {
          const data = dataUrl.split(",")[1];
          resolve({ data, media_type });
        }
      } catch (err) {
        reject(err);
      }
    };

    reader.readAsDataURL(file);
  });
}


// ─────────────────────────────────────────────
// 3. Blob → base64
// ─────────────────────────────────────────────

/**
 * Converts a Blob (e.g. from canvas.toBlob or fetch response)
 * to base64. Internally wraps it as a File and calls fileToBase64.
 *
 * @param {Blob}    blob
 * @param {string}  [filename="capture.jpg"]
 * @param {number}  [maxPx=1200]
 * @returns {Promise<{ data: string, media_type: string }>}
 */
export function blobToBase64(blob, filename = "capture.jpg", maxPx = 1200) {
  const file = new File([blob], filename, { type: blob.type || "image/jpeg" });
  return fileToBase64(file, maxPx);
}


// ─────────────────────────────────────────────
// 4. URL → base64
// ─────────────────────────────────────────────

/**
 * Fetches an image from a URL (remote or local object URL) and
 * returns it as base64.
 *
 * Note: remote URLs must either be same-origin OR have permissive
 * CORS headers. For cross-origin images, proxy through your server.
 *
 * @param {string}  url
 * @param {number}  [maxPx=1200]
 * @returns {Promise<{ data: string, media_type: string }>}
 */
export async function urlToBase64(url, maxPx = 1200) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  const blob     = await response.blob();
  const filename = url.split("/").pop().split("?")[0] || "image.jpg";
  return blobToBase64(blob, filename, maxPx);
}


// ─────────────────────────────────────────────
// 5. Resize helper (internal)
// ─────────────────────────────────────────────

/**
 * Resizes an image data-URL so its longest edge is ≤ maxPx.
 * Skips resize if the image is already small enough.
 * Returns a new data-URL.
 *
 * Why resize? Anthropic charges per token; a 4K selfie uses ~1600
 * tokens just for the image. Resizing to 1200px cuts that to ~450
 * tokens with no loss of skin-analysis accuracy.
 *
 * @param {string}  dataUrl
 * @param {number}  maxPx
 * @param {string}  media_type  - used as canvas output format
 * @returns {Promise<string>}   - resized data-URL
 */
function resizeDataUrl(dataUrl, maxPx, media_type = "image/jpeg") {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error("Failed to load image for resizing."));

    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;

      // Already small enough — skip canvas round-trip
      if (w <= maxPx && h <= maxPx) {
        resolve(dataUrl);
        return;
      }

      // Scale down, preserving aspect ratio
      const scale  = maxPx / Math.max(w, h);
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(w * scale);
      canvas.height = Math.round(h * scale);

      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled  = true;
      ctx.imageSmoothingQuality  = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // JPEG at 0.92 quality gives excellent skin detail at ~60% the size
      const quality = media_type === "image/png" ? 1 : 0.92;
      resolve(canvas.toDataURL(media_type, quality));
    };

    img.src = dataUrl;
  });
}


// ─────────────────────────────────────────────
// 6. Build the Anthropic image content block
// ─────────────────────────────────────────────

/**
 * Converts any image source (File, Blob, or URL string) into the
 * exact content block shape the Anthropic Messages API expects.
 *
 * @param {File|Blob|string} source
 * @param {number} [maxPx=1200]
 * @returns {Promise<object>}  - Ready to spread into messages[].content[]
 *
 * @example
 * const imageBlock = await toAnthropicImageBlock(file);
 * const response = await fetch("https://api.anthropic.com/v1/messages", {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify({
 *     model: "claude-sonnet-4-20250514",
 *     max_tokens: 1000,
 *     messages: [{
 *       role: "user",
 *       content: [
 *         imageBlock,
 *         { type: "text", text: "Analyse my skin type." }
 *       ]
 *     }]
 *   })
 * });
 */
export async function toAnthropicImageBlock(source, maxPx = 1200) {
  let data, media_type;

  if (typeof source === "string") {
    ({ data, media_type } = await urlToBase64(source, maxPx));
  } else if (source instanceof File) {
    ({ data, media_type } = await fileToBase64(source, maxPx));
  } else if (source instanceof Blob) {
    ({ data, media_type } = await blobToBase64(source, "image.jpg", maxPx));
  } else {
    throw new TypeError("source must be a File, Blob, or URL string");
  }

  return {
    type: "image",
    source: {
      type:       "base64",
      media_type,
      data,
    },
  };
}


// ─────────────────────────────────────────────
// Usage examples (not executed — reference only)
// ─────────────────────────────────────────────
//
// ── From a file input ──────────────────────────────────────────
// const input = document.querySelector('input[type="file"]');
// input.addEventListener("change", async (e) => {
//   const file  = e.target.files[0];
//   const block = await toAnthropicImageBlock(file);
//   // block = { type: "image", source: { type: "base64", media_type: "image/jpeg", data: "..." } }
// });
//
//
// ── From a drag-and-drop event ─────────────────────────────────
// dropzone.addEventListener("drop", async (e) => {
//   e.preventDefault();
//   const file  = e.dataTransfer.files[0];
//   const block = await toAnthropicImageBlock(file);
// });
//
//
// ── From a camera capture (canvas.toBlob) ──────────────────────
// canvas.toBlob(async (blob) => {
//   const block = await toAnthropicImageBlock(blob);
// }, "image/jpeg", 0.92);
//
//
// ── From a remote URL ──────────────────────────────────────────
// const block = await toAnthropicImageBlock("https://example.com/face.jpg");
//
//
// ── Full API call example ──────────────────────────────────────
// async function analyseSkin(file) {
//   const imageBlock = await toAnthropicImageBlock(file);
//
//   const res = await fetch("https://api.anthropic.com/v1/messages", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       model: "claude-sonnet-4-20250514",
//       max_tokens: 1000,
//       messages: [{
//         role: "user",
//         content: [
//           imageBlock,
//           { type: "text", text: "What is this person's skin type?" }
//         ]
//       }]
//     })
//   });
//
//   const data = await res.json();
//   return data.content[0].text;
// }