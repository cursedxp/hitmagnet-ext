import { setupVideoButtonObserver } from "./addButton";
import { createHeader } from "./header";
import { createDownloadAllButton } from "./downloadAllButton";
import { createRemoveAllButton } from "./removeAllButton";
import { createCollectionManager } from "./collectionManager";
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
  // Get subscription status from storage
  chrome.storage.local.get(["subscriptionStatus"], (result) => {
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
      max-height: 280px;
      display: none;
    `;

    const header = createHeader(user);
    const content = document.createElement("div");
    content.id = "panel-content";
    content.style.cssText = `
      display: flex;
      flex-direction: row;
      gap: 12px;
      overflow-x: auto;
      overflow-y: hidden;
      padding: 4px;
      scroll-behavior: smooth;
      
      scrollbar-width: thin;
      scrollbar-color: #888 #f1f1f1;
      
      &::-webkit-scrollbar {
        height: 8px;
      }
      &::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }
      &::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;
      }
      &::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
    `;

    const navigationContainer = document.createElement("div");
    navigationContainer.style.cssText = `
      display: flex;
      justify-content: space-between;
      width: 100%;
      margin-bottom: 16px;
    `;
    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.cssText = `
      display: flex;
      justify-content: flex-end;
      width: 100%;
      gap: 8px;
      margin-bottom: 16px;
    `;

    buttonsContainer.appendChild(createDownloadAllButton());
    buttonsContainer.appendChild(createRemoveAllButton());

    // Only show collection manager if subscription is active
    if (result.subscriptionStatus !== "inactive") {
      navigationContainer.appendChild(createCollectionManager());
    }
    navigationContainer.appendChild(buttonsContainer);

    panel.appendChild(header);
    panel.appendChild(navigationContainer);
    panel.appendChild(content);

    document.body.appendChild(panel);

    // Create MutationObserver to watch for changes in panel content
    const observer = new MutationObserver(() => {
      const hasItems =
        document.querySelectorAll("#panel-content .thumbnail-preview").length >
        0;
      panel.style.display = hasItems ? "block" : "none";
    });

    // Start observing the panel content
    observer.observe(content, {
      childList: true,
      subtree: true,
    });

    return panel;
  });
};

if (window.location.hostname === "www.youtube.com") {
  checkAuthAndInitialize();
}
