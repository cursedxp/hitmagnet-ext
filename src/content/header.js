const createHeader = (user) => {
  const header = document.createElement("div");
  header.style.cssText = `
    padding: 8px;
    background: #f0f0f0;
    border-radius: 8px 8px 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: -16px -16px 16px -16px;
  `;

  header.appendChild(document.createTextNode("Hitmagnet"));
  return header;
};

export { createHeader };
