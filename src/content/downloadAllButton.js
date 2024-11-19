export const createDownloadAllButton = () => {
  const navigationContainer = document.createElement("div");
  navigationContainer.style.cssText = `
    display: flex;
    justify-content: flex-end;
    width: 100%;
    `;

  const button = document.createElement("button");
  button.textContent = "Download All";
  button.className = "download-all-btn";
  button.style.cssText = `
    padding: 8px 16px;
    background: #065fd4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-left: auto;
    font-size: 14px;
    
    &:hover {
      background: #0056bf;
    }
  `;

  button.addEventListener("click", handleDownloadAll);
  navigationContainer.appendChild(button);
  return navigationContainer;
};

const handleDownloadAll = async () => {
  const previewCards = document.querySelectorAll(
    "#panel-content .thumbnail-preview img"
  );

  // Process downloads sequentially to avoid overwhelming the browser
  for (const img of previewCards) {
    const thumbnailUrl = img.src;
    if (thumbnailUrl) {
      try {
        const qualities = [
          "maxresdefault",
          "sddefault",
          "hqdefault",
          "mqdefault",
          "default",
        ];

        const videoId = thumbnailUrl.match(/\/vi\/([^/]+)\//)?.[1];
        if (!videoId) continue;

        // Try each quality until we find one that exists
        let response;
        let finalUrl;
        for (const quality of qualities) {
          finalUrl = `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
          response = await fetch(finalUrl);
          if (response.ok) break;
        }

        // If none worked, fall back to original URL
        if (!response?.ok) {
          finalUrl = thumbnailUrl;
          response = await fetch(thumbnailUrl);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `thumbnail-${videoId}-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Add a small delay between downloads to prevent overwhelming the browser
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error("Download failed:", error);
      }
    }
  }
};
