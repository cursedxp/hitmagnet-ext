import { createThumbnailPreview } from "./imagePreview";

const addButtonsToVideos = () => {
  // First check if user is authenticated
  chrome.storage.local.get(["isAuthenticated"], (result) => {
    if (!result.isAuthenticated) {
      // Remove existing buttons if user is not authenticated
      document
        .querySelectorAll(".custom-button")
        .forEach((btn) => btn.remove());
      return;
    }

    // Rest of your existing button adding logic
    const metadataSelectors = [
      'ytd-video-meta-block[class*="style-scope"] #metadata-line',
      'ytd-rich-grid-media[class*="style-scope"] #metadata-line',
      'ytd-grid-video-renderer[class*="style-scope"] #metadata-line',
      'ytd-compact-video-renderer[class*="style-scope"] #metadata-line',
      'ytd-playlist-video-renderer[class*="style-scope"] #metadata-line',
    ];

    metadataSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        if (element.querySelector(".custom-button")) return;

        const button = document.createElement("button");
        button.textContent = "+ Add";
        button.className = "custom-button";
        button.style.cssText = `
          margin-left: 8px;
          padding: 4px 8px;
          background: #065fd4;
          color: white;
          border: none;
          border-radius: 2px;
          font-size: 12px;
          cursor: pointer;
        `;

        button.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          const videoContainer = element.closest(
            "ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-playlist-video-renderer, ytd-compact-video-renderer"
          );
          const videoLink = videoContainer?.querySelector("a#thumbnail");
          const videoId = videoLink?.href?.split("v=")?.[1]?.split("&")?.[0];

          if (videoId) {
            const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
            const videoData = {
              title: videoContainer
                .querySelector("#video-title")
                ?.textContent?.trim(),
              thumbnail: thumbnailUrl,
              duration: videoContainer
                .querySelector("ytd-thumbnail-overlay-time-status-renderer")
                ?.textContent?.trim(),
            };

            console.log("Adding video:", videoData);

            const panelContent = document.querySelector("#panel-content");
            if (panelContent) {
              const thumbnailPreview = createThumbnailPreview(videoData);
              panelContent.appendChild(thumbnailPreview);

              // Explicitly show the panel
              const panel = document.getElementById("youtube-panel");
              if (panel) {
                panel.style.display = "block";
                console.log("Panel should be visible now");
              } else {
                console.error("Panel element not found");
              }

              // Scroll the new item into view
              thumbnailPreview.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "end",
              });
            } else {
              console.error("Panel content element not found");
            }

            try {
              chrome.runtime.sendMessage(
                {
                  type: "addVideo",
                  videoId,
                  videoData,
                },
                (response) => {
                  if (chrome.runtime.lastError) {
                    console.error(
                      "Error sending message:",
                      chrome.runtime.lastError
                    );
                    return;
                  }
                  console.log("Video added successfully:", response);
                }
              );
            } catch (error) {
              console.error("Error in add button click handler:", error);
            }
          }
        });

        element.appendChild(button);
      });
    });
  });
};

const setupVideoButtonObserver = () => {
  // Disconnect existing observer if it exists
  if (window.videoButtonObserver) {
    window.videoButtonObserver.disconnect();
  }

  window.videoButtonObserver = new MutationObserver(() =>
    requestAnimationFrame(addButtonsToVideos)
  );

  window.videoButtonObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial call to add buttons
  addButtonsToVideos();
};

export { setupVideoButtonObserver };

const createAddButton = () => {
  const button = document.createElement("button");
  button.className = "add-to-collection-btn";
  button.innerHTML = "+";

  // Add this to verify button creation
  console.log("Add button created");

  return button;
};
