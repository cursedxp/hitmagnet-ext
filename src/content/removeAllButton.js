export const createRemoveAllButton = () => {
  const button = document.createElement("button");
  button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
    `;
  button.className = "remove-all-btn";
  button.style.cssText = `
      padding: 8px 8px;
      background: white;
      color: black;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      display: none;
      align-items: center;
      gap: 8px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.2);
      
      &:hover {
        background: #ff4444;
        color: white;
      }
  
      svg {
        width: 16px;
        height: 16px;
      }
    `;

  const handleRemoveAll = () => {
    const previewCards = document.querySelectorAll(
      "#panel-content .thumbnail-preview"
    );
    previewCards.forEach((card) => card.remove());
  };

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

  button.addEventListener("click", handleRemoveAll);
  return button;
};
