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

// Get subscription status
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "getSubscriptionStatus") {
    const userId = sender.tab ? sender.tab.userId : null;
    const subscriptionStatus = await getUserSubscriptionStatus(userId);
    sendResponse({ subscriptionStatus });
  }
  return true;
});

// Check authentication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "checkAuth") {
    chrome.storage.local.get(["isAuthenticated", "user"], (result) => {
      sendResponse(result);
    });
    return true;
  }
});

// Add this message handler for videos
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "addVideo") {
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
          sendResponse({ success: true });
        }
      });
    });

    return true; // Keep message channel open for async response
  }
});

// Get inspirations
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getUserInspirations") {
    (async () => {
      try {
        const { user } = await chrome.storage.local.get(["user"]);
        const userId = user?.id;

        if (!userId) {
          sendResponse({ inspirations: [] });
          return;
        }

        const inspirations = await getUserInspirations(userId);
        sendResponse({ inspirations: inspirations || [] });
      } catch (error) {
        console.error("Error getting inspirations:", error);
        sendResponse({ inspirations: [], error: error.message });
      }
    })();
    return true; // Keep the message channel open for async response
  }
});

// Create new inspiration collection
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "createNewInspirationCollection") {
    (async () => {
      try {
        const { user } = await chrome.storage.local.get(["user"]);
        const userId = user?.id;
        if (!userId) {
          sendResponse({ success: false, error: "User not authenticated" });
          return;
        }
        const newCollection = await createNewInspirationCollection(
          userId,
          message.collectionName
        );
        sendResponse({ success: true, newCollection });
      } catch (error) {
        console.error("Error creating collection:", error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep the message channel open for async response
  }
});

// Update inspiration collection
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "updateInspirationCollection") {
    (async () => {
      try {
        const { user } = await chrome.storage.local.get(["user"]);
        const userId = user?.id;
        if (!userId) {
          sendResponse({ success: false, error: "User not authenticated" });
          return;
        }
        const success = await updateInspirationCollection(
          userId,
          message.collectionId,
          message.thumbnails
        );
        sendResponse({ success });
      } catch (error) {
        console.error("Error updating collection:", error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep the message channel open for async response
  }
});

// Add this function to handle auth state updates
const updateAuthState = async (authState) => {
  const { isAuthenticated, user } = authState;

  // Update local storage
  await chrome.storage.local.set({
    isAuthenticated,
    user,
  });

  // Get subscription status if user is authenticated
  let subscriptionStatus = null;
  if (isAuthenticated && user) {
    subscriptionStatus = await getUserSubscriptionStatus(user.id);
    await chrome.storage.local.set({ subscriptionStatus });
  }

  // Notify all YouTube tabs about the auth state change
  const tabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" });
  for (const tab of tabs) {
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: "authStateChanged",
        isAuthenticated,
        user,
        subscriptionStatus,
      });
    } catch (error) {
      console.log(`Error sending message to tab ${tab.id}:`, error);
    }
  }
};

// Update the existing updateAuthState message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "updateAuthState") {
    (async () => {
      try {
        await updateAuthState(message.authState);
        sendResponse({ success: true });
      } catch (error) {
        console.error("Error updating auth state:", error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }
});

// Add this at the beginning of the file after imports
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "authStateChanged") {
    (async () => {
      try {
        const { isAuthenticated, user } = message;

        // Update local storage
        await chrome.storage.local.set({
          isAuthenticated,
          user,
        });

        // Get subscription status if user is authenticated
        if (isAuthenticated && user) {
          const subscriptionStatus = await getUserSubscriptionStatus(user.id);
          await chrome.storage.local.set({ subscriptionStatus });
        }

        // Notify all YouTube tabs
        const tabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" });
        for (const tab of tabs) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              type: "authStateChanged",
              isAuthenticated,
              user,
            });
          } catch (error) {
            console.log(`Error sending message to tab ${tab.id}:`, error);
          }
        }

        sendResponse({ success: true });
      } catch (error) {
        console.error("Error handling auth state change:", error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep the message channel open for async response
  }
});
