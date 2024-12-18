import { getUserInfo } from "./userUtils";
import { getUserSubscriptionStatus } from "../background/firebaseServices";

export default function authHandlers() {
  const sendMessageToTabs = async (message) => {
    try {
      // Check if chrome API is still available
      if (!chrome?.tabs?.query) {
        console.warn(
          "Chrome API not available - extension context may be invalidated"
        );
        return;
      }

      const tabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" });
      for (const tab of tabs) {
        try {
          // Check if tab still exists
          const tabExists = await chrome.tabs.get(tab.id).catch(() => null);
          if (!tabExists) continue;

          let retries = 3;
          while (retries > 0) {
            try {
              await new Promise((resolve, reject) => {
                // Check for extension context before sending
                if (!chrome?.tabs?.sendMessage) {
                  reject(new Error("Extension context invalidated"));
                  return;
                }

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
                console.warn(
                  `Failed to send message to tab ${tab.id}:`,
                  err.message
                );
              } else {
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }
            }
          }
        } catch (err) {
          console.warn(`Error processing tab ${tab.id}:`, err.message);
        }
      }
    } catch (err) {
      console.warn("Error in sendMessageToTabs:", err.message);
      // Don't throw - just log the error and continue
    }
  };
  return {
    signIn: async () => {
      try {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
          throw new Error("Google Client ID not configured");
        }

        const scopes = ["profile", "email"];

        const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        authUrl.searchParams.append("client_id", clientId);
        authUrl.searchParams.append("response_type", "token");
        authUrl.searchParams.append(
          "redirect_uri",
          chrome.identity.getRedirectURL()
        );
        authUrl.searchParams.append("scope", scopes.join(" "));
        authUrl.searchParams.append("prompt", "select_account");

        console.log("Starting auth flow with URL:", authUrl.toString());

        const responseUrl = await new Promise((resolve, reject) => {
          chrome.identity.launchWebAuthFlow(
            {
              url: authUrl.toString(),
              interactive: true,
            },
            (responseUrl) => {
              console.log("Auth flow response:", responseUrl);
              if (chrome.runtime.lastError) {
                console.error(
                  "Chrome runtime error:",
                  chrome.runtime.lastError
                );
                reject(chrome.runtime.lastError);
              } else if (!responseUrl) {
                console.error("No response URL received");
                reject(new Error("No response URL received"));
              } else {
                resolve(responseUrl);
              }
            }
          );
        });

        // Extract the access token from the response URL
        const url = new URL(responseUrl);
        const hashParams = new URLSearchParams(url.hash.substring(1));
        const accessToken = hashParams.get("access_token");

        if (!accessToken) {
          console.error("No access token found in response");
          throw new Error("No access token found in response");
        }

        console.log("Access token obtained, fetching user info...");

        // Get user info using the access token
        const userInfo = await getUserInfo(accessToken);
        if (!userInfo) {
          throw new Error("Failed to fetch user info");
        }

        console.log("User info obtained:", userInfo);

        // Update local storage with auth state
        const authState = {
          isAuthenticated: true,
          user: {
            id: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
          },
        };

        await chrome.storage.local.set(authState);

        // Make sure we return the auth state
        return authState;
      } catch (error) {
        console.error("Detailed sign-in error:", error);
        throw error;
      }
    },
    signOut: async () => {
      try {
        // Clear storage first to ensure user sees logged out state
        await chrome.storage.local.set({
          isAuthenticated: false,
          user: null,
          subscriptionStatus: null,
        });

        // Attempt to notify tabs of logout
        try {
          await sendMessageToTabs({
            type: "authStateChanged",
            isAuthenticated: false,
            user: null,
            subscriptionStatus: null,
          });
        } catch (err) {
          console.warn("Error notifying tabs:", err);
          // Continue with logout even if notification fails
        }

        // Clear remaining auth state
        try {
          await chrome.identity.clearAllCachedAuthTokens();
        } catch (err) {
          console.warn("Error clearing auth tokens:", err);
          // Continue with logout even if token clearing fails
        }

        return { success: true };
      } catch (error) {
        console.error("Error during sign out:", error);
        return {
          success: false,
          error: error.message || "An unknown error occurred during sign out",
        };
      }
    },

    checkAuthState: async () => {
      return await chrome.storage.local.get(["isAuthenticated", "user"]);
    },
  };
}
