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
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    z-index: 1;

    &:hover {
      background: rgba(0, 0, 0, 0.9);
    }
  `;

  removeButton.addEventListener("click", (e) => {
    e.stopPropagation();
    previewContainer.remove();
  });

  const infoContainer = document.createElement("div");
  infoContainer.style.cssText = `
    flex: 1;
    overflow: hidden;
  `;

  previewContainer.appendChild(removeButton);
  previewContainer.appendChild(thumbnail);
  previewContainer.appendChild(infoContainer);

  return previewContainer;
};

export { createThumbnailPreview };
