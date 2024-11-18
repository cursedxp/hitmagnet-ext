const checkAuthAndCreatePanel = async () => {
  try {
    // Skip if panel already exists
    if (document.getElementById("youtube-panel")) {
      return;
    }

    console.log("Checking auth status...");
    chrome.runtime.sendMessage({ type: "checkAuth" }, (response) => {
      if (chrome.runtime.lastError) {
        console.log("Runtime error:", chrome.runtime.lastError);
        return;
      }

      console.log("Auth response:", response);
      if (response && response.isAuthenticated && response.user) {
        console.log("User is authenticated, creating panel...");
        createFloatingPanel(response.user);
      }
    });
  } catch (error) {
    console.log("Error checking auth:", error);
  }
};

// Listen for auth state changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "authStateChanged") {
    console.log("Auth state changed:", message);
    const existingPanel = document.getElementById("youtube-panel");

    if (message.isAuthenticated && message.user) {
      // Remove existing panel if it exists
      if (existingPanel) {
        existingPanel.remove();
      }
      createFloatingPanel(message.user);
    } else {
      // Remove panel when signed out
      if (existingPanel) {
        existingPanel.remove();
      }
    }
  }
});

const createFloatingPanel = (user) => {
  const panel = document.createElement("div");
  panel.id = "youtube-panel";
  panel.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 680px;
    background: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    color: black;
  `;

  const header = document.createElement("div");
  header.style.cssText = `
    padding: 8px;
    background: #f0f0f0;
    border-radius: 8px 8px 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: -16px -16px 16px -16px;
  `;

  const title = document.createTextNode("Hitmagnet");
  header.appendChild(title);

  // Add user info to header
  const userInfo = document.createElement("div");
  userInfo.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: 8px;
  `;

  if (user.picture) {
    const userPic = document.createElement("img");
    userPic.src = user.picture;
    userPic.style.cssText = `
      width: 24px;
      height: 24px;
      border-radius: 50%;
    `;
    userInfo.appendChild(userPic);
  }

  const userName = document.createTextNode(user.name || user.email);
  userInfo.appendChild(userName);
  header.appendChild(userInfo);

  const content = document.createElement("div");
  content.innerHTML = `
    <p>Welcome ${user.name || user.email}</p>
  `;

  panel.appendChild(header);
  panel.appendChild(content);
  document.body.appendChild(panel);
};

// Initialize panel when on YouTube
if (window.location.hostname === "www.youtube.com") {
  console.log("On YouTube, initializing panel...");

  let observer = null;
  let lastUrl = location.href;

  const initializePanel = () => {
    try {
      checkAuthAndCreatePanel();

      // Setup observer to only check when URL changes
      if (!observer) {
        observer = new MutationObserver(() => {
          if (location.href !== lastUrl) {
            lastUrl = location.href;
            checkAuthAndCreatePanel();
          }
        });

        observer.observe(document.documentElement, {
          childList: true,
          subtree: true,
        });
      }
    } catch (error) {
      console.log("Initialization error:", error);
      cleanup();
    }
  };

  // Cleanup function
  const cleanup = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    const panel = document.getElementById("youtube-panel");
    if (panel) {
      panel.remove();
    }
  };

  // Handle extension unload
  chrome.runtime.onConnect.addListener((port) => {
    port.onDisconnect.addListener(() => {
      cleanup();
    });
  });

  // Initial load
  if (document.readyState === "complete") {
    initializePanel();
  } else {
    window.addEventListener("load", initializePanel);
  }
}
