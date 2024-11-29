export const createPricingRedirect = () => {
  const container = document.createElement("div");
  container.style.cssText = `
    display: flex;
    width: 100%;
    gap: 12px;
    align-items: center;
    background: #f8f8f8;
    padding: 12px;
    border-radius: 8px;
  `;

  const icon = document.createElement("div");
  icon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  `;
  icon.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FFD700;
  `;

  const textContainer = document.createElement("div");
  textContainer.style.cssText = `
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  `;

  const title = document.createElement("span");
  title.textContent = "Save to Inspiration Collections";
  title.style.cssText = `
    font-weight: 600;
    color: #1a1a1a;
  `;

  const description = document.createElement("span");
  description.textContent =
    "Upgrade to Pro to save inspiring thumbnails to your collections and access them anytime";
  description.style.cssText = `
    font-size: 0.9em;
    color: #666;
  `;

  const upgradeButton = document.createElement("a");
  upgradeButton.href = "https://www.hitmagnet.app/";
  upgradeButton.target = "_blank";
  upgradeButton.textContent = "Upgrade to Pro";
  upgradeButton.style.cssText = `
    padding: 8px 16px;
    background: #FFD700;
    color: #000;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 1em;
    white-space: nowrap;
    transition: all 0.2s ease;

    &:hover {
      background: #FFED4A;
      transform: translateY(-1px);
    }
  `;

  textContainer.appendChild(title);
  textContainer.appendChild(description);
  container.appendChild(icon);
  container.appendChild(textContainer);
  container.appendChild(upgradeButton);

  return container;
};
