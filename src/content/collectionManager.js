export const createCollectionManager = () => {
  const collectionManager = document.createElement("div");
  collectionManager.style.cssText = `
    display: flex;
    width: 100%;
    gap: 8px;
    align-items: center;
  `;

  // Create collection selector
  const selectors = document.createElement("select");
  selectors.id = "collection-selectors";
  selectors.style.cssText = `
    padding: 8px;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
    background: white;
    flex: 1;
    cursor: pointer;
  `;

  // Add default options
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select Collection";
  defaultOption.disabled = true;
  defaultOption.selected = true;

  const newCollectionOption = document.createElement("option");
  newCollectionOption.value = "new";
  newCollectionOption.textContent = "+ New Collection";

  selectors.appendChild(defaultOption);
  selectors.appendChild(newCollectionOption);

  // Create upload button
  const uploadButton = document.createElement("button");
  uploadButton.style.cssText = `
    padding: 8px;
    background: white;
    color: black;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.2);
    opacity: 0.5;
    pointer-events: none;
  `;
  uploadButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-upload"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
    Upload
  `;
  uploadButton.id = "upload-button";

  // Event Handlers
  selectors.addEventListener("change", () => {
    if (selectors.value === "new") {
      const collectionName = prompt("Enter collection name:");
      if (collectionName) {
        const option = document.createElement("option");
        option.value = collectionName.toLowerCase().replace(/\s+/g, "-");
        option.textContent = collectionName;

        // Insert the new option before the "Create New Collection" option
        selectors.insertBefore(option, newCollectionOption);
        selectors.value = option.value;

        // Save to chrome.storage
        chrome.storage.local.get(["collections"], (result) => {
          const collections = result.collections || [];
          collections.push({
            id: option.value,
            name: collectionName,
            items: [],
          });
          chrome.storage.local.set({ collections });
        });

        uploadButton.style.opacity = "1";
        uploadButton.style.pointerEvents = "auto";
      } else {
        selectors.value = ""; // Reset to default if user cancels
        uploadButton.style.opacity = "0.5";
        uploadButton.style.pointerEvents = "none";
      }
    } else if (selectors.value) {
      uploadButton.style.opacity = "1";
      uploadButton.style.pointerEvents = "auto";
    } else {
      uploadButton.style.opacity = "0.5";
      uploadButton.style.pointerEvents = "none";
    }
  });

  // Load existing collections
  chrome.storage.local.get(["collections"], (result) => {
    const collections = result.collections || [];
    collections.forEach((collection) => {
      const option = document.createElement("option");
      option.value = collection.id;
      option.textContent = collection.name;
      // Insert before the "Create New Collection" option
      selectors.insertBefore(option, newCollectionOption);
    });
  });

  // Append elements
  collectionManager.appendChild(selectors);
  collectionManager.appendChild(uploadButton);
  collectionManager.id = "collection-manager";

  return collectionManager;
};
