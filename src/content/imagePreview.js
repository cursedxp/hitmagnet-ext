function createImagePreview(thumbnail) {
  const imagePreview = document.createElement("div");
  imagePreview.id = "youtube-image-preview";
  imagePreview.style.cssText = `
    width: 100%;
    height: 100%;
    background-color: #f0f0f0;
  `;
  const image = document.createElement("img");
  image.src = thumbnail;
  imagePreview.appendChild(image);
  return imagePreview;
}
