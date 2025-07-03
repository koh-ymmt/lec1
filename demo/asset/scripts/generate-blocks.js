import generateColor from "./generate-color.js";

const numberOfBlocks = 24;
const colorThemeIndex = 220;
const colorDynamic = 15;

export default function generateBlocks() {
  const blockArea = document.getElementById("block-area");

  for (let i = 0; i < numberOfBlocks; i++) {
    const block = document.createElement("div");
    block.className = "block";
    blockArea.appendChild(block);
    block.style.backgroundColor = generateColor(
      -(Math.floor(i / 8) % 8) * colorDynamic + colorThemeIndex
    );
  }
}
