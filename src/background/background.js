import {
  getUserInspirations,
  getUserSubscriptionStatus,
  createNewInspirationCollection,
  updateInspirationCollection,
} from "./firebaseServices";

// Set default values for storage before authentication
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    isAuthenticated: false,
    user: null,
  });
});

// Message type constants
const MessageTypes = {
  CHECK_AUTH: "checkAuth",
  AUTH_STATE_CHANGED: "authStateChanged",
  UPDATE_AUTH_STATE: "updateAuthState",
  GET_USER_INSPIRATIONS: "getUserInspirations",
  CREATE_NEW_INSPIRATION: "createNewInspirationCollection",
  UPDATE_INSPIRATION: "updateInspirationCollection",
  ADD_VIDEO: "addVideo",
  WEBSITE_AUTH: "websiteAuth",
};

// Add website origin validation
const ALLOWED_ORIGINS = ["https://www.hitmagnet.app"];

// Helper function to check if tab is ready
const isTabReady = async (tabId) => {
  try {
    const response = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { type: "ping" }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
    return response?.ready === true;
  } catch {
    return false;
  }
};

// Helper function to wait for tab to be ready with exponential backoff
const waitForTab = async (tabId, maxAttempts = 5) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (await isTabReady(tabId)) {
      return true;
    }
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    await new Promise((resolve) =>
      setTimeout(resolve, Math.pow(2, attempt) * 1000)
    );
  }
  return false;
};

// Improved notify tabs function
const notifyTabs = async (message) => {
  try {
    const tabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" });

    for (const tab of tabs) {
      // Wait for tab to be ready before sending message
      const isReady = await waitForTab(tab.id);
      if (!isReady) {
        console.log(`Tab ${tab.id} not ready after all attempts`);
        continue; // Skip this tab and move to next
      }

      try {
        await chrome.tabs.sendMessage(tab.id, message);
        console.log(`Message sent successfully to tab ${tab.id}`);
      } catch (error) {
        console.error(`Failed to send message to tab ${tab.id}:`, error);
      }
    }
  } catch (error) {
    console.error("Error in notifyTabs:", error);
  }
};

// Central message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case MessageTypes.AUTH_STATE_CHANGED:
        case MessageTypes.UPDATE_AUTH_STATE:
          await updateAuthState(message.authState || message);
          sendResponse({ success: true });
          break;

        case MessageTypes.CHECK_AUTH:
          const authState = await chrome.storage.local.get([
            "isAuthenticated",
            "user",
            "subscriptionStatus",
          ]);
          sendResponse(authState);
          break;

        case MessageTypes.GET_USER_INSPIRATIONS:
          const userId = await getCurrentUserId();
          const inspirations = await getUserInspirations(userId);
          sendResponse({ inspirations });
          break;

        case MessageTypes.CREATE_NEW_INSPIRATION:
          const { collectionName } = message;
          const currentUserId = await getCurrentUserId();
          const newCollection = await createNewInspirationCollection(
            currentUserId,
            collectionName
          );
          sendResponse({ success: true, newCollection });
          break;

        case MessageTypes.UPDATE_INSPIRATION:
          const { collectionId, thumbnails } = message;
          const uid = await getCurrentUserId();
          await updateInspirationCollection(uid, collectionId, thumbnails);
          sendResponse({ success: true });
          break;

        case MessageTypes.ADD_VIDEO:
          const { videoId, videoData } = message;
          // Handle video addition logic here
          sendResponse({ success: true });
          break;

        default:
          throw new Error(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`Error handling message type ${message.type}:`, error);
      sendResponse({ success: false, error: error.message });
    }
  })();
  return true;
});

// Helper function to get current user ID
async function getCurrentUserId() {
  const { user } = await chrome.storage.local.get(["user"]);
  if (!user?.id) throw new Error("No authenticated user found");
  return user.id;
}

// Add this function to handle auth state updates
const updateAuthState = async (authState) => {
  const { isAuthenticated, user } = authState;

  // Update local storage
  await chrome.storage.local.set({
    isAuthenticated,
    user,
    subscriptionStatus: authState.subscriptionStatus,
  });

  // Get all YouTube tabs
  const tabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" });

  // Send messages to all tabs concurrently
  await Promise.all(
    tabs.map(async (tab) => {
      try {
        // Wait for tab to be ready before sending message
        const isReady = await waitForTab(tab.id);
        if (!isReady) {
          console.log(`Tab ${tab.id} not ready, skipping`);
          return;
        }

        await chrome.tabs.sendMessage(tab.id, {
          type: "authStateChanged",
          isAuthenticated,
          user,
          subscriptionStatus: authState.subscriptionStatus,
        });

        console.log(`Auth state updated for tab ${tab.id}`);
      } catch (error) {
        console.error(`Error updating tab ${tab.id}:`, error);
      }
    })
  );
};

// Listen for messages from the website
chrome.runtime.onMessageExternal.addListener(
  async (message, sender, sendResponse) => {
    console.log("External message received:", message);
    console.log("Sender:", sender);

    // Verify sender origin
    if (!ALLOWED_ORIGINS.includes(sender.origin)) {
      console.error("Unauthorized message origin:", sender.origin);
      sendResponse({ success: false, error: "Unauthorized origin" });
      return;
    }

    if (message.type === MessageTypes.WEBSITE_AUTH) {
      try {
        const { userInfo } = message;
        console.log("Processing auth with userInfo:", userInfo);

        // Validate required user info
        if (!userInfo?.id || !userInfo?.email) {
          throw new Error("Invalid user info received");
        }

        // Create auth state
        const authState = {
          isAuthenticated: true,
          user: {
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name || "",
            image: userInfo.image || "",
          },
          subscriptionStatus: userInfo.subscriptionStatus || "inactive",
        };

        console.log("Setting auth state:", authState);

        // Update storage
        await chrome.storage.local.set(authState);

        // Verify storage was updated
        const storedData = await chrome.storage.local.get(null);
        console.log("Storage after update:", storedData);

        // Notify all tabs about the auth state change
        await notifyTabs({
          type: "authStateChanged",
          ...authState,
        });

        // Reload all YouTube tabs
        const youtubeTabs = await chrome.tabs.query({
          url: "*://*.youtube.com/*",
        });
        for (const tab of youtubeTabs) {
          await chrome.tabs.reload(tab.id);
        }

        sendResponse({ success: true });
      } catch (error) {
        console.error("Website auth error:", error);
        sendResponse({ success: false, error: error.message });
      }
    }
  }
);
