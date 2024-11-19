const createDownloadButton = () => {
  const downloadButton = document.createElement("button");
  downloadButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
    `;

  downloadButton.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: none;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      cursor: pointer;
      display: none;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      z-index: 2;
      padding: 12px;

      &:hover {
        background: rgba(0, 0, 0, 0.9);
        transform: translate(-50%, -50%) scale(1.1);
      }

      svg {
        width: 100%;
        height: 100%;
      }
    `;

  const handleDownload = async (thumbnailUrl) => {
    try {
      // Try different thumbnail qualities in order of highest to lowest
      const qualities = [
        "maxresdefault",
        "sddefault",
        "hqdefault",
        "mqdefault",
        "default",
      ];

      // Extract the video ID from the thumbnail URL
      const videoId = thumbnailUrl.match(/\/vi\/([^/]+)\//)?.[1];
      if (!videoId) throw new Error("Couldn't extract video ID");

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
      link.download = `thumbnail-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return { downloadButton, handleDownload };
};

export { createDownloadButton };
