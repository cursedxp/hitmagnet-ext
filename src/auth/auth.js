export const initializeGoogleAuth = () => {
  const manifest = chrome.runtime.getManifest();
  const clientId = manifest.oauth2.client_id;
  const scopes = manifest.oauth2.scopes;

  return {
    signIn: async () => {
      try {
        if (!chrome.identity) {
          throw new Error("chrome.identity is not available");
        }
        const token = await chrome.identity.getAuthToken({
          interactive: true,
        });

        if (token) {
          const response = await fetch(
            `https://www.googleapis.com/oauth2/v3/userinfo`,
            {
              headers: {
                Authorization: `Bearer ${token.token}`,
              },
            }
          );
          const userInfo = await response.json();
          return {
            success: true,
            user: userInfo,
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
    signOut: async () => {
      try {
        const token = await chrome.identity.getAuthToken({
          interactive: false,
        });
        if (token) {
          await chrome.identity.removeCachedAuthToken({ token });
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
  };
};
