import { createDownloadButton } from "./downloadButton";

const createThumbnailPreview = (videoData) => {
  const previewContainer = document.createElement("div");
  previewContainer.className = "thumbnail-preview";
  previewContainer.style.cssText = `
    position: relative;
    flex: 0 0 auto;
    width: 200px;
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    background: #f8f8f8;
    transition: transform 0.2s;
    cursor: pointer;
    
    &:hover {
      transform: translateY(-2px);
      background: #f0f0f0;
    }
  `;

  const thumbnail = document.createElement("img");
  thumbnail.src = videoData.thumbnail;
  thumbnail.style.cssText = `
    width: 100%;
    aspect-ratio: 16/9;
    object-fit: cover;
    border-radius: 4px;
  `;

  const removeButton = document.createElement("button");
  removeButton.innerHTML = "×";
  removeButton.style.cssText = `
    position: absolute;
    top: 4px;
    right: 4px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: none;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    font-size: 16px;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    z-index: 2;

    &:hover {
      background: rgba(0, 0, 0, 0.9);
    }
  `;

  removeButton.addEventListener("click", (e) => {
    e.stopPropagation();
    previewContainer.remove();

    if (typeof videoData.onRemove === "function") {
      videoData.onRemove(videoData);
    }
  });

  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0);
    transition: background 0.2s;
    border-radius: 8px;
    pointer-events: none;
    z-index: 1;
  `;

  const { downloadButton, handleDownload } = createDownloadButton();

  downloadButton.addEventListener("click", async (e) => {
    e.stopPropagation();
    await handleDownload(videoData.thumbnail);
  });

  previewContainer.addEventListener("mouseenter", () => {
    removeButton.style.display = "flex";
    downloadButton.style.display = "flex";
    overlay.style.background = "rgba(0, 0, 0, 0.3)";
  });

  previewContainer.addEventListener("mouseleave", () => {
    removeButton.style.display = "none";
    downloadButton.style.display = "none";
    overlay.style.background = "rgba(0, 0, 0, 0)";
  });

  const infoContainer = document.createElement("div");
  infoContainer.style.cssText = `
    flex: 1;
    overflow: hidden;
  `;

  previewContainer.appendChild(thumbnail);
  previewContainer.appendChild(overlay);
  previewContainer.appendChild(removeButton);
  previewContainer.appendChild(downloadButton);
  previewContainer.appendChild(infoContainer);

  return previewContainer;
};

export { createThumbnailPreview };
