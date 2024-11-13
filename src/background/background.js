chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    isAuthenticated: false,
    user: null,
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "checkAuth") {
    chrome.storage.local.get(["isAuthenticated", "user"], (result) => {
      sendResponse(result);
    });
    return true;
  }
});
