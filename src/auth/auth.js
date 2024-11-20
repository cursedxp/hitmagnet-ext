import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export const initializeGoogleAuth = () => {
  const sendMessageToTabs = async (message) => {
    try {
      const tabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" });
      for (const tab of tabs) {
        try {
          await new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(tab.id, message, (response) => {
              if (chrome.runtime.lastError) {
                // Ignore the error and resolve anyway
                resolve();
              } else {
                resolve(response);
              }
            });
          });
        } catch (err) {
          console.log(`Error sending message to tab ${tab.id}:`, err);
        }
      }
    } catch (err) {
      console.error("Error querying tabs:", err);
    }
  };

  return {
    signIn: async () => {
      try {
        if (!chrome.identity) {
          throw new Error("chrome.identity is not available");
        }
        const auth = await chrome.identity.getAuthToken({
          interactive: true,
        });

        if (auth.token) {
          const response = await fetch(
            `https://www.googleapis.com/oauth2/v3/userinfo`,
            {
              headers: {
                Authorization: `Bearer ${auth.token}`,
              },
            }
          );
          const userInfo = await response.json();

          // Use sub as the unique identifier from Google OAuth
          const userData = {
            ...userInfo,
            id: userInfo.sub, // Google's unique identifier
          };

          console.log("Setting auth state:", userData);

          await chrome.storage.local.set({
            isAuthenticated: true,
            user: userData,
          });

          // Send message to all YouTube tabs
          await sendMessageToTabs({
            type: "authStateChanged",
            isAuthenticated: true,
            user: userData,
          });

          return {
            success: true,
            user: userData,
            token: auth.token,
          };
        }
      } catch (error) {
        console.error("Sign in error:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    },

    signOut: async () => {
      try {
        const auth = await chrome.identity.getAuthToken({
          interactive: false,
        });

        await chrome.storage.local.set({
          isAuthenticated: false,
          user: null,
        });

        // Send message to all YouTube tabs
        await sendMessageToTabs({
          type: "authStateChanged",
          isAuthenticated: false,
          user: null,
        });

        if (auth.token) {
          await chrome.identity.removeCachedAuthToken({ token: auth.token });
        }

        return { success: true };
      } catch (error) {
        console.error("Sign out error:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    },

    checkAuthState: async () => {
      return new Promise((resolve) => {
        chrome.storage.local.get(["isAuthenticated", "user"], (result) => {
          resolve(result);
        });
      });
    },
  };
};

export const getUserSubscriptionStatus = async (userId) => {
  try {
    const userDoc = doc(db, "users", userId);
    const userSnapshot = await getDoc(userDoc);

    if (userSnapshot.exists()) {
      const userData = userSnapshot.data();
      return userData.subscriptionStatus || "inactive";
    } else {
      console.log("No such document for user:", userId);
      return "inactive";
    }
  } catch (error) {
    console.error("Error getting subscription status:", error);
    throw error;
  }
};
