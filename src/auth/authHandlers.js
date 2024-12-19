import { getUserInfo } from "./userUtils";
import { getUserSubscriptionStatus } from "../background/firebaseServices";

export default function authHandlers() {
  const sendMessageToTabs = async (message) => {
    try {
      if (!chrome?.tabs?.query) {
        console.warn("Chrome API not available");
        return;
      }

      const tabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" });
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch (err) {
          console.warn(`Error sending message to tab ${tab.id}:`, err.message);
        }
      }
    } catch (err) {
      console.warn("Error in sendMessageToTabs:", err.message);
    }
  };

  return {
    signOut: async () => {
      await chrome.storage.local.set({
        isAuthenticated: false,
        user: null,
        subscriptionStatus: null,
      });

      await sendMessageToTabs({
        type: "authStateChanged",
        isAuthenticated: false,
      });
    },
  };
}
