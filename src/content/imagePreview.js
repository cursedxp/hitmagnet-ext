const createThumbnailPreview = (videoData) => {
  const previewContainer = document.createElement("div");
  previewContainer.className = "thumbnail-preview";
  previewContainer.style.cssText = `
    flex: 0 0 auto;
    width: 200px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
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

  const infoContainer = document.createElement("div");
  infoContainer.style.cssText = `
    flex: 1;
    overflow: hidden;
  `;

  const title = document.createElement("div");
  title.textContent = videoData.title;
  title.style.cssText = `
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 4px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.2;
  `;

  const duration = document.createElement("div");
  duration.textContent = videoData.duration;
  duration.style.cssText = `
    font-size: 12px;
    color: #606060;
  `;

  infoContainer.appendChild(title);
  infoContainer.appendChild(duration);
  previewContainer.appendChild(thumbnail);
  previewContainer.appendChild(infoContainer);

  return previewContainer;
};

export { createThumbnailPreview };
