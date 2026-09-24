const CLOUD_NAME =
  process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || "dibv4yamb";
const UPLOAD_PRESET =
  process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || "ChatApp";

export const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file selected."));
    if (!file.type.startsWith("image/")) {
      return reject(new Error("Please select a valid image file."));
    }
    if (file.size > 5 * 1024 * 1024) {
      return reject(new Error("Image must be smaller than 5MB."));
    }

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);
    data.append("cloud_name", CLOUD_NAME);

    fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "post",
      body: data,
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.url) reject(new Error("Upload failed. Check your Cloudinary preset."));
        else resolve({ url: data.url.toString(), name: file.name });
      })
      .catch((err) => reject(err));
  });
};