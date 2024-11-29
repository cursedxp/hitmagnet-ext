import { getUserInfo } from "./userUtils";
import { getUserSubscriptionStatus } from "../background/firebaseServices";

export default function authHandlers() {
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

        const authUrl =
          `https://accounts.google.com/o/oauth2/auth?` +
          `client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}&` +
          `response_type=token&` +
          `scope=${encodeURIComponent(
            "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email"
          )}&` +
          `redirect_uri=${encodeURIComponent(
            chrome.identity.getRedirectURL()
          )}`;

        const responseUrl = await new Promise((resolve, reject) => {
          chrome.identity.launchWebAuthFlow(
            {
              url: authUrl,
              interactive: true,
            },
            (responseUrl) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else if (!responseUrl) {
                reject(new Error("No response URL received"));
              } else {
                resolve(responseUrl);
              }
            }
          );
        });

        const accessToken = new URLSearchParams(responseUrl.split("#")[1]).get(
          "access_token"
        );

        if (!accessToken) {
          throw new Error("Failed to obtain access token");
        }

        const userInfo = await getUserInfo(accessToken);

        if (!userInfo || !userInfo.sub) {
          throw new Error("Failed to obtain user information");
        }

        const subscriptionStatus = await getUserSubscriptionStatus(
          userInfo.sub
        );

        const userData = {
          ...userInfo,
          id: userInfo.sub,
        };

        await chrome.runtime.sendMessage({
          type: "authStateChanged",
          isAuthenticated: true,
          user: userData,
        });

        await chrome.storage.local.set({
          isAuthenticated: true,
          user: userData,
        });

        return {
          success: true,
          user: { ...userData, subscriptionStatus: subscriptionStatus },
        };
      } catch (error) {
        console.error("Error signing in:", error);
        return {
          success: false,
          error: error.message || "Authentication failed",
        };
      }
    },
    signOut: async () => {
      try {
        await chrome.runtime.sendMessage({
          type: "authStateChanged",
          isAuthenticated: false,
          user: null,
        });

        await chrome.storage.local.set({
          isAuthenticated: false,
          user: null,
        });

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
      return await chrome.storage.local.get(["isAuthenticated", "user"]);
    },
  };
}
