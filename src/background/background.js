import {
  getUserInspirations,
  getUserSubscriptionStatus,
} from "./firebaseServices";

// Set default values for storage before authentication
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    isAuthenticated: false,
    user: null,
  });
});

// Get subscription status
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "getSubscriptionStatus") {
    const userId = sender.tab ? sender.tab.userId : null;
    const subscriptionStatus = await getUserSubscriptionStatus(userId);
    sendResponse({ subscriptionStatus });
  }
  return true;
});

// Get inspirations
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "getUserInspirations") {
    const { user } = await chrome.storage.local.get(["user"]);
    const userId = user?.id;
    console.log("userId", userId);
    if (!userId) {
      sendResponse({ inspirations: [] });
      return;
    }
    const inspirations = await getUserInspirations(userId);
    sendResponse({ inspirations });
  }
  return true;
});

// Check authentication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "checkAuth") {
    chrome.storage.local.get(["isAuthenticated", "user"], (result) => {
      console.log("Auth check result:", result);
      sendResponse(result);
    });
    return true;
  }
});

// Add this message handler for videos
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "addVideo") {
    console.log("Received addVideo message:", message);

    // Get existing videos from storage
    chrome.storage.local.get(["videos"], (result) => {
      const videos = result.videos || [];
      videos.push(message.videoData);

      // Save updated videos back to storage
      chrome.storage.local.set({ videos }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error saving video:", chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError });
        } else {
          console.log("Video saved successfully");
          sendResponse({ success: true });
        }
      });
    });

    return true; // Keep message channel open for async response
  }
});
