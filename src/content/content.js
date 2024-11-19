import { setupVideoButtonObserver } from "./addButton";
import { createHeader } from "./header";

const checkAuthAndInitialize = async () => {
  if (document.getElementById("youtube-panel")) return;

  chrome.runtime.sendMessage({ type: "checkAuth" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Runtime error:", chrome.runtime.lastError);
      return;
    }

    if (response?.isAuthenticated && response?.user) {
      createPanel(response.user);
      setupVideoButtonObserver(); // Only setup buttons when authenticated
    }
  });
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "authStateChanged") {
    const panel = document.getElementById("youtube-panel");

    if (message.isAuthenticated && message.user) {
      if (panel) panel.remove();
      createPanel(message.user);
      setupVideoButtonObserver();
    } else {
      if (panel) panel.remove();
      // Remove buttons when logged out
      document
        .querySelectorAll(".custom-button")
        .forEach((btn) => btn.remove());
    }
  }
  sendResponse({ success: true });
  return true;
});

const createPanel = (user) => {
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

  const header = createHeader(user);
  const content = document.createElement("div");
  content.innerHTML = `<p>Welcome ${user.name || user.email}</p>`;

  panel.appendChild(header);
  panel.appendChild(content);
  document.body.appendChild(panel);
};

if (window.location.hostname === "www.youtube.com") {
  checkAuthAndInitialize();
}
