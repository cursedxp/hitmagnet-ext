const addButtonsToVideos = () => {
  const metadataRows = document.querySelectorAll(
    ".yt-content-metadata-view-model-wiz__metadata-row"
  );
  console.log("Found metadata rows:", metadataRows.length);

  metadataRows.forEach((row) => {
    if (row.querySelector(".custom-button")) return;

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
    button.onclick = () => {
      console.log("Button clicked");
    };

    // Add button to the second metadata row (the one with views and time)
    const isViewsRow = row.textContent.includes("views");
    if (isViewsRow) {
      row.appendChild(button);
    }
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
