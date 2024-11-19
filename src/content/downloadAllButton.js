export const createDownloadAllButton = () => {
  const button = document.createElement("button");
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  `;
  button.className = "download-all-btn";
  button.style.cssText = `
    padding: 8px 8px;
    background: white;
    color: black;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    margin-left: auto;
    font-size: 14px;
    display: none;
    align-items: center;
    gap: 8px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.2);
    
    &:hover {
      background: #0056bf;
    }

    svg {
      width: 16px;
      height: 16px;
    }
  `;

  // Create MutationObserver to watch for changes in panel content
  const observer = new MutationObserver(() => {
    const hasItems =
      document.querySelectorAll("#panel-content .thumbnail-preview").length > 0;
    button.style.display = hasItems ? "flex" : "none";
  });

  // Start observing the panel content for changes
  setTimeout(() => {
    const panelContent = document.querySelector("#panel-content");
    if (panelContent) {
      observer.observe(panelContent, {
        childList: true,
        subtree: true,
      });
      // Initial check
      const hasItems =
        document.querySelectorAll("#panel-content .thumbnail-preview").length >
        0;
      button.style.display = hasItems ? "flex" : "none";
    }
  }, 0);

  button.addEventListener("click", handleDownloadAll);
  return button;
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
