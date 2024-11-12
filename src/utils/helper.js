function createButton(id, text, onClick, className, children) {
  const button = document.createElement("button");
  button.id = id;
  button.className = `btn ${className}`.trim();
  if (children) {
    button.appendChild(children);
  }
  const textNode = document.createTextNode(text);
  button.appendChild(textNode);
  button.addEventListener("click", onClick);

  return button;
}

function createImage(src, className) {
  const img = document.createElement("img");
  img.src = src;
  img.className = className;
  return img;
}

export { createButton, createImage };
