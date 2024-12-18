import { getUserInfo } from "./userUtils";
import { getUserSubscriptionStatus } from "../background/firebaseServices";

export default function authHandlers() {
  const sendMessageToTabs = async (message) => {
    try {
      const tabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" });
      for (const tab of tabs) {
        try {
          let retries = 3;
          while (retries > 0) {
            try {
              await new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(tab.id, message, (response) => {
                  if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                  } else {
                    resolve(response);
                  }
                });
              });
              break; // Success, exit retry loop
            } catch (err) {
              retries--;
              if (retries === 0) {
                console.log(
                  `Failed to send message to tab ${tab.id} after 3 attempts`
                );
              } else {
                // Wait before retrying
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }
            }
          }
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

        const userData = {
          ...userInfo,
          id: userInfo.sub,
        };

        const subscriptionStatus = await getUserSubscriptionStatus(
          userInfo.sub
        );

        await chrome.storage.local.set({
          isAuthenticated: true,
          user: userData,
          subscriptionStatus: subscriptionStatus,
        });

        await chrome.runtime.sendMessage({
          type: "authStateChanged",
          isAuthenticated: true,
          user: userData,
          subscriptionStatus: subscriptionStatus,
        });

        return {
          success: true,
          user: userData,
          subscriptionStatus: subscriptionStatus,
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
        // Clear cached tokens first
        await new Promise((resolve) => {
          chrome.identity.clearAllCachedAuthTokens(resolve);
        });

        // Clear local storage
        chrome.storage.local.set({
          isAuthenticated: false,
          user: null,
        });

        return true;
      } catch (error) {
        console.error("Error during sign out:", error);
        throw error;
      }
    },

    checkAuthState: async () => {
      return await chrome.storage.local.get(["isAuthenticated", "user"]);
    },
  };
}
