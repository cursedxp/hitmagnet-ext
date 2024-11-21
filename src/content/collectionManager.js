export const createCollectionManager = async () => {
  console.log("Creating collection manager...");
  try {
    const inspirations = await getUserInspirations();
    console.log("Got inspirations:", inspirations);

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
    selectors.addEventListener("change", async () => {
      if (selectors.value && selectors.value !== "new") {
        uploadButton.style.opacity = "1";
        uploadButton.style.pointerEvents = "auto";
      } else if (selectors.value === "") {
        uploadButton.style.opacity = "0.5";
        uploadButton.style.pointerEvents = "none";
      }

      if (selectors.value === "new") {
        const collectionName = prompt("Enter collection name:");
        if (collectionName) {
          const response = await chrome.runtime.sendMessage({
            type: "createNewInspirationCollection",
            collectionName,
          });

          if (response.success && response.newCollection) {
            // Fetch updated inspirations
            const updatedInspirations = await getUserInspirations();

            // Clear existing options except default and "new collection"
            while (selectors.children.length > 2) {
              selectors.removeChild(selectors.children[1]);
            }

            // Add all collections again
            updatedInspirations.forEach((inspiration) => {
              const option = document.createElement("option");
              option.value = inspiration.id;
              option.textContent = inspiration.name;
              selectors.insertBefore(option, newCollectionOption);
            });

            // Select the newly created collection
            selectors.value = response.newCollection.id;
            selectors.dispatchEvent(new Event("change"));
          } else {
            selectors.value = ""; // Reset to default if creation fails
            selectors.dispatchEvent(new Event("change"));
          }
        } else {
          selectors.value = ""; // Reset if user cancels prompt
          selectors.dispatchEvent(new Event("change"));
        }
      }
    });

    // Add upload button click handler
    uploadButton.addEventListener("click", async () => {
      const selectedCollectionId = selectors.value;
      if (!selectedCollectionId) return;

      // Get all thumbnail previews from the panel
      const thumbnailPreviews = document.querySelectorAll(
        "#panel-content .thumbnail-preview"
      );
      const thumbnails = Array.from(thumbnailPreviews).map((preview) => {
        const img = preview.querySelector("img");
        return {
          url: img.src,
          addedAt: new Date(),
        };
      });

      if (thumbnails.length === 0) return;

      try {
        const response = await chrome.runtime.sendMessage({
          type: "updateInspirationCollection",
          collectionId: selectedCollectionId,
          thumbnails,
        });

        if (response.success) {
          // Clear the panel after successful upload
          const panelContent = document.querySelector("#panel-content");
          panelContent.innerHTML = "";

          // Reset the selector and upload button
          selectors.value = "";
          uploadButton.style.opacity = "0.5";
          uploadButton.style.pointerEvents = "none";
        }
      } catch (error) {
        console.error("Error uploading thumbnails:", error);
      }
    });

    // Load existing collections
    inspirations.forEach((inspiration) => {
      const option = document.createElement("option");
      option.value = inspiration.id;
      option.textContent = inspiration.name;
      // Insert before the "Create New Collection" option
      selectors.insertBefore(option, newCollectionOption);
    });

    // Append elements
    collectionManager.appendChild(selectors);
    collectionManager.appendChild(uploadButton);
    collectionManager.id = "collection-manager";

    return collectionManager;
  } catch (error) {
    console.error("Error in createCollectionManager:", error);
    return null;
  }
};

const getUserInspirations = async () => {
  try {
    const result = await chrome.runtime.sendMessage({
      type: "getUserInspirations",
    });
    console.log("inspirations", result.inspirations);
    return result.inspirations || [];
  } catch (error) {
    console.error("Error fetching inspirations:", error);
    return [];
  }
};
