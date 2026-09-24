const SCRIPT_ID = "google-gsi-script";
let loaded = false;
let loadingPromise = null;

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

export const getGoogleClientId = () => clientId;

export const loadGoogleScript = () => {
  if (loaded) return Promise.resolve();
  if (loadingPromise) return loadingPromise;
  if (document.getElementById(SCRIPT_ID)) {
    loaded = true;
    return Promise.resolve();
  }

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      loaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Google sign-in."));
    document.body.appendChild(script);
  });
  return loadingPromise;
};

// Renders the Google "Sign in with Google" button into a container element id.
export const renderGoogleButton = async (containerId, onCredential) => {
  if (!clientId) {
    console.warn("REACT_APP_GOOGLE_CLIENT_ID is not set. Google login disabled.");
    return false;
  }
  await loadGoogleScript();
  if (!window.google || !window.google.accounts) return false;

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      if (response && response.credential) onCredential(response.credential);
    },
    auto_select: false,
  });

  const container = document.getElementById(containerId);
  if (!container) return false;

  window.google.accounts.id.renderButton(container, {
    theme: "outline",
    size: "large",
    width: container.offsetWidth || 320,
    text: "continue_with",
    shape: "rectangular",
  });
  return true;
};