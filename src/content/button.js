const addButtonsToVideos = () => {
  // For video metadata rows (avoid channel metadata)
  const metadataSelectors = [
    'ytd-video-meta-block[class*="style-scope"] #metadata-line', // Search/channel pages
    'ytd-rich-grid-media[class*="style-scope"] #metadata-line', // Home page
    'ytd-grid-video-renderer[class*="style-scope"] #metadata-line', // Channel videos
    'ytd-compact-video-renderer[class*="style-scope"] #metadata-line', // Sidebar videos
    'ytd-playlist-video-renderer[class*="style-scope"] #metadata-line', // Playlist videos
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
        const videoId = videoLink?.href?.split("v=")[1]?.split("&")[0];

        if (videoId) {
          chrome.runtime.sendMessage({
            type: "addVideo",
            videoId,
            videoData: {
              title: videoContainer
                .querySelector("#video-title")
                ?.textContent?.trim(),
              thumbnail: videoContainer.querySelector("#img")?.src,
              duration: videoContainer
                .querySelector("ytd-thumbnail-overlay-time-status-renderer")
                ?.textContent?.trim(),
            },
          });
        }
      });

      element.appendChild(button);
    });
  });
};

const setupVideoButtonObserver = () => {
  const observer = new MutationObserver(() =>
    requestAnimationFrame(addButtonsToVideos)
  );
  observer.observe(document.body, { childList: true, subtree: true });
  addButtonsToVideos();
};

export { setupVideoButtonObserver };
