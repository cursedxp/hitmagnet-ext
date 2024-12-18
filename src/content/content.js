import { setupVideoButtonObserver } from "./addButton";
import { createDownloadAllButton } from "./downloadAllButton";
import { createRemoveAllButton } from "./removeAllButton";
import { createCollectionManager } from "./collectionManager";
import { createPricingRedirect } from "./pricingRedirect";

let isContentScriptReady = false;

const checkAuthAndInitialize = async () => {
  if (document.getElementById("youtube-panel")) return;

  try {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "checkAuth" }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });

    console.log("Auth check response:", response);

    if (response?.isAuthenticated && response?.user) {
      await chrome.storage.local.set({
        isAuthenticated: true,
        user: response.user,
        subscriptionStatus: response.subscriptionStatus,
      });

      console.log("Setting up video button observer...");
      await setupVideoButtonObserver();
      console.log("Creating panel...");
      await createPanel(response.user);
    }

    isContentScriptReady = true;
    console.log("Content script is ready");
  } catch (error) {
    console.error("Error in checkAuthAndInitialize:", error);
    isContentScriptReady = true;
  }
};

const initializeContentScript = async () => {
  try {
    await checkAuthAndInitialize();
    isContentScriptReady = true;
    console.log("Content script fully initialized");
  } catch (error) {
    console.error("Error during initialization:", error);
    isContentScriptReady = true;
  }
};

// Document ready handler
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    if (window.location.hostname === "www.youtube.com") {
      initializeContentScript();
    }
  });
} else {
  if (window.location.hostname === "www.youtube.com") {
    initializeContentScript();
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "authStateChanged") {
    console.log("Auth state changed, reinitializing...");

    // Remove existing elements
    const panel = document.getElementById("youtube-panel");
    const buttons = document.querySelectorAll(".custom-button");

    if (panel) panel.remove();
    buttons.forEach((btn) => btn.remove());

    if (message.isAuthenticated && message.user) {
      // Update storage and reinitialize
      chrome.storage.local.set(
        {
          isAuthenticated: true,
          user: message.user,
          subscriptionStatus: message.subscriptionStatus,
        },
        async () => {
          // Disconnect existing observer
          if (window.videoButtonObserver) {
            window.videoButtonObserver.disconnect();
            window.videoButtonObserver = null;
          }

          // Reinitialize components
          await setupVideoButtonObserver();
          await createPanel(message.user);

          console.log("Components reinitialized after auth change");
        }
      );
    } else {
      // Handle logout
      chrome.storage.local.set(
        {
          isAuthenticated: false,
          user: null,
          subscriptionStatus: null,
        },
        () => {
          if (window.videoButtonObserver) {
            window.videoButtonObserver.disconnect();
            window.videoButtonObserver = null;
          }
        }
      );
    }
  }
  sendResponse({ success: true });
  return true;
});

const createPanel = (user) => {
  // Get subscription status from storage
  chrome.storage.local.get(["subscriptionStatus"], async (result) => {
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
      border-radius: 16px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      color: black;
      max-height: 280px;
      display: none;
    `;

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
      align-items: center;
      width: 100%;
      margin-bottom: 16px;
      gap: 8px;
    `;

    const buttonsContainer = document.createElement("div");
    buttonsContainer.id = "buttons-container";
    buttonsContainer.style.cssText = `
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-left: auto;
    `;

    const downloadAllBtn = createDownloadAllButton();
    const removeAllBtn = createRemoveAllButton();

    // Set initial visibility based on content
    const hasItems =
      document.querySelectorAll("#panel-content .thumbnail-preview").length > 0;
    downloadAllBtn.style.display = hasItems ? "flex" : "none";
    removeAllBtn.style.display = hasItems ? "flex" : "none";

    buttonsContainer.appendChild(downloadAllBtn);
    buttonsContainer.appendChild(removeAllBtn);

    // First append buttonsContainer
    navigationContainer.appendChild(buttonsContainer);

    // Then append collection manager if subscription is active, otherwise show pricing redirect
    if (result.subscriptionStatus !== "inactive") {
      try {
        const collectionManager = await createCollectionManager();
        if (collectionManager) {
          navigationContainer.insertBefore(collectionManager, buttonsContainer);
        }
      } catch (error) {
        console.error("Error creating collection manager:", error);
      }
    } else {
      const pricingRedirect = createPricingRedirect();
      navigationContainer.insertBefore(pricingRedirect, buttonsContainer);
    }

    panel.appendChild(navigationContainer);
    panel.appendChild(content);

    document.body.appendChild(panel);

    // Add this observer to handle panel visibility
    const observer = new MutationObserver(() => {
      const hasItems =
        document.querySelectorAll("#panel-content .thumbnail-preview").length >
        0;
      panel.style.display = hasItems ? "block" : "none";
      console.log("Panel visibility updated:", hasItems ? "showing" : "hidden");
    });

    // Start observing the panel content
    observer.observe(content, {
      childList: true,
      subtree: true,
    });

    // Add observer for buttons visibility
    const buttonsObserver = new MutationObserver(() => {
      const hasItems =
        document.querySelectorAll("#panel-content .thumbnail-preview").length >
        0;
      const downloadBtn = document.querySelector(".download-all-btn");
      const removeBtn = document.querySelector(".remove-all-btn");

      if (downloadBtn) downloadBtn.style.display = hasItems ? "flex" : "none";
      if (removeBtn) removeBtn.style.display = hasItems ? "flex" : "none";
    });

    // Start observing the panel content
    const panelContent = document.querySelector("#panel-content");
    if (panelContent) {
      buttonsObserver.observe(panelContent, {
        childList: true,
        subtree: true,
      });
    }

    return panel;
  });
};

// Add this message listener to reinitialize when auth state changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "authStateChanged") {
    checkAuthAndInitialize();
  }
});

// Add ping handler for readiness check
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ping") {
    sendResponse({ success: true, ready: isContentScriptReady });
    return true;
  }
});

// Initialize content script
if (window.location.hostname === "www.youtube.com") {
  checkAuthAndInitialize().then(() => {
    isContentScriptReady = true;
  });
}
