const checkAuthAndCreatePanel = async () => {
  try {
    if (document.getElementById("youtube-panel")) {
      return;
    }

    console.log("Checking auth status...");
    chrome.runtime.sendMessage({ type: "checkAuth" }, (response) => {
      if (chrome.runtime.lastError) {
        console.log("Runtime error:", chrome.runtime.lastError);
        return;
      }

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
  try {
    if (message.type === "authStateChanged") {
      console.log("Auth state changed:", message);
      const existingPanel = document.getElementById("youtube-panel");

      if (message.isAuthenticated && message.user) {
        if (existingPanel) {
          existingPanel.remove();
        }
        createFloatingPanel(message.user);
      } else {
        if (existingPanel) {
          existingPanel.remove();
        }
      }
    }
    // Always send a response
    sendResponse({ success: true });
  } catch (error) {
    console.error("Error in message listener:", error);
    sendResponse({ success: false, error: error.message });
  }
  return true; // Keep the message channel open for async response
});

const createFloatingPanel = (user) => {
  const panel = document.createElement("div");
  panel.id = "youtube-panel";
  panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
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

// Initialize when on YouTube
if (window.location.hostname === "www.youtube.com") {
  console.log("On YouTube, initializing panel...");
  checkAuthAndCreatePanel();
}
