// ============================================================
// PASTE YOUR CLOUDINARY DETAILS HERE
// Get these from https://cloudinary.com (free, no card required):
//   1. Sign up → your Cloud Name is shown on the dashboard.
//   2. Settings → Upload → "Add upload preset" → set Signing Mode
//      to "Unsigned" → Save → copy the preset name it gives you.
// ============================================================
const CLOUDINARY_CLOUD_NAME = "hjetepns";
const CLOUDINARY_UPLOAD_PRESET = "ujfvh8oi";
// ============================================================

/**
 * Uploads an image Blob to Cloudinary using an unsigned upload preset.
 * No API key/secret ever touches the browser — the unsigned preset is
 * scoped (e.g. image-only, size-capped) entirely from the Cloudinary dashboard.
 *
 * @param {Blob} blob - the image to upload (already resized/compressed client-side).
 * @param {(percent: number) => void} [onProgress] - called with 0-100 as the upload proceeds.
 * @returns {Promise<string>} resolves to the https secure_url of the uploaded image.
 */
export function uploadToCloudinary(blob, onProgress) {
  return new Promise((resolve, reject) => {
    if (CLOUDINARY_CLOUD_NAME === "YOUR_CLOUD_NAME") {
      reject(new Error("Cloudinary isn't configured yet — paste your Cloud Name and upload preset into js/cloudinary-config.js"));
      return;
    }
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const formData = new FormData();
    formData.append("file", blob);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url);
        } catch (err) {
          reject(new Error("Cloudinary returned an unexpected response."));
        }
      } else {
        reject(new Error(`Cloudinary upload failed (status ${xhr.status}). Check your cloud name and upload preset.`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error while uploading. Check your connection."));
    xhr.send(formData);
  });
}
