import { setupVideoButtonObserver } from "./addButton";

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

  header.appendChild(document.createTextNode("Hitmagnet"));

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

  userInfo.appendChild(document.createTextNode(user.name || user.email));
  header.appendChild(userInfo);

  const content = document.createElement("div");
  content.innerHTML = `<p>Welcome ${user.name || user.email}</p>`;

  panel.appendChild(header);
  panel.appendChild(content);
  document.body.appendChild(panel);
};

if (window.location.hostname === "www.youtube.com") {
  checkAuthAndInitialize();
}
