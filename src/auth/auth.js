export const initializeGoogleAuth = () => {
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
          console.log("Setting auth state:", userInfo);
          await chrome.storage.local.set({
            isAuthenticated: true,
            user: userInfo,
          });
          return {
            success: true,
            user: userInfo,
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
        if (auth.token) {
          await chrome.identity.removeCachedAuthToken({ token: auth.token });
          return {
            success: true,
          };
        }
      } catch (error) {
        console.error(error);
        return {
          success: false,
          error: error.message,
        };
      }
    },
    checkAuthState: async () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "checkAuth" }, (response) => {
          resolve(response);
        });
      });
    },
  };
};
