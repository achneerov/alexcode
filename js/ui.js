// js/ui.js
const codeEditor = document.getElementById("code-editor");
const lineNumbersDiv = document.getElementById("line-numbers");
const runCodeBtn = document.getElementById("run-code-btn");
const consoleOutputContainer = document.getElementById(
  "console-output-container",
);
const consoleSummaryEl = document.getElementById("console-summary");
const problemTitleElement = document.getElementById("problem-title");
const problemTextContainer = document.getElementById("problem-text-container");

const problemPane = document.getElementById("problem-pane");
const rightContainer = document.getElementById("right-container");
const editorPane = document.getElementById("editor-pane");
const outputPane = document.getElementById("output-pane");
const verticalSplitter = document.getElementById("vertical-splitter");
const horizontalSplitter = document.getElementById("horizontal-splitter");
const mainContainer = document.getElementById("main-container");

function makeResizable(
  splitterElement,
  firstElement,
  secondElement,
  direction,
) {
  if (
    !splitterElement ||
    !firstElement ||
    !secondElement ||
    !mainContainer ||
    !rightContainer
  ) {
    // console.warn("makeResizable: Missing one or more elements.");
    return;
  }
  let isDragging = false;
  let startX, startY, startFirstFlexBasis, startSecondFlexBasis;

  splitterElement.addEventListener("mousedown", (e) => {
    e.preventDefault();
    isDragging = true;
    document.body.classList.add("no-select");
    startX = e.clientX;
    startY = e.clientY;

    if (!firstElement.style.flexBasis)
      firstElement.style.flexBasis =
        (direction === "vertical"
          ? firstElement.offsetWidth
          : firstElement.offsetHeight) + "px";
    if (!secondElement.style.flexBasis)
      secondElement.style.flexBasis =
        (direction === "vertical"
          ? secondElement.offsetWidth
          : secondElement.offsetHeight) + "px";

    startFirstFlexBasis = parseFloat(firstElement.style.flexBasis);
    startSecondFlexBasis = parseFloat(secondElement.style.flexBasis);

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  function onMouseMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    let newFirstFlexBasis, newSecondFlexBasis;

    const mainContainerPaddingH =
      parseFloat(getComputedStyle(mainContainer).paddingLeft) +
      parseFloat(getComputedStyle(mainContainer).paddingRight);

    if (direction === "vertical") {
      const containerWidth =
        mainContainer.offsetWidth -
        verticalSplitter.offsetWidth -
        mainContainerPaddingH;
      const minBasis = Math.max(100, containerWidth * 0.1);

      newFirstFlexBasis = startFirstFlexBasis + deltaX;
      newSecondFlexBasis = startSecondFlexBasis - deltaX;

      if (newFirstFlexBasis < minBasis) {
        newFirstFlexBasis = minBasis;
        newSecondFlexBasis = containerWidth - newFirstFlexBasis;
      }
      if (newSecondFlexBasis < minBasis) {
        newSecondFlexBasis = minBasis;
        newFirstFlexBasis = containerWidth - newSecondFlexBasis;
      }
    } else {
      // horizontal
      const parentHeight =
        rightContainer.offsetHeight - horizontalSplitter.offsetHeight;
      const minBasis = Math.max(80, parentHeight * 0.15);

      newFirstFlexBasis = startFirstFlexBasis + deltaY;
      newSecondFlexBasis = startSecondFlexBasis - deltaY;

      if (newFirstFlexBasis < minBasis) {
        newFirstFlexBasis = minBasis;
        newSecondFlexBasis = parentHeight - newFirstFlexBasis;
      }
      if (newSecondFlexBasis < minBasis) {
        newSecondFlexBasis = minBasis;
        newFirstFlexBasis = parentHeight - newSecondFlexBasis;
      }
    }
    firstElement.style.flexBasis = `${newFirstFlexBasis}px`;
    secondElement.style.flexBasis = `${newSecondFlexBasis}px`;
    firstElement.style.flexGrow = "0";
    firstElement.style.flexShrink = "0";
    secondElement.style.flexGrow = "0";
    secondElement.style.flexShrink = "0";

    updateLineNumbers();
  }

  function onMouseUp() {
    if (!isDragging) return;
    isDragging = false;
    document.body.classList.remove("no-select");
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    updateLineNumbers();
  }
}

function updateLineNumbers() {
  if (!codeEditor || !lineNumbersDiv) return;
  try {
    const editorStyle = window.getComputedStyle(codeEditor);
    const editorLineHeight = parseFloat(editorStyle.lineHeight);
    const editorFontSize = parseFloat(editorStyle.fontSize);
    const effectiveLineHeight = isNaN(editorLineHeight)
      ? editorFontSize * 1.2
      : editorLineHeight; // This variable is not directly used below, but calculation is kept.
    const lines = codeEditor.value.split("\n");
    const numberOfLines = lines.length;
    lineNumbersDiv.innerHTML = ""; // Clear existing numbers
    for (let i = 1; i <= Math.max(1, numberOfLines); i++) {
      const numberEl = document.createElement("div");
      numberEl.textContent = i;
      lineNumbersDiv.appendChild(numberEl);
    }
    lineNumbersDiv.scrollTop = codeEditor.scrollTop;
  } catch (e) {
    // console.error("Error updating line numbers:", e);
    // Potentially, elements are not fully available yet.
  }
}

function setInitialLayout() {
  requestAnimationFrame(() => {
    if (
      !mainContainer ||
      !verticalSplitter ||
      !problemPane ||
      !rightContainer ||
      !horizontalSplitter ||
      !editorPane ||
      !outputPane
    ) {
      // console.warn("setInitialLayout: One or more layout elements not found yet. Retrying...");
      requestAnimationFrame(setInitialLayout); // Try again on the next frame
      return;
    }
    const totalWidth = mainContainer.offsetWidth;
    if (totalWidth === 0) {
      // if mainContainer not rendered yet with proper width
      // console.warn("setInitialLayout: mainContainer width is 0. Retrying...");
      requestAnimationFrame(setInitialLayout);
      return;
    }

    const mainContainerPaddingLR =
      parseFloat(getComputedStyle(mainContainer).paddingLeft) +
      parseFloat(getComputedStyle(mainContainer).paddingRight);

    const availableWidthForPanes =
      totalWidth - mainContainerPaddingLR - verticalSplitter.offsetWidth;

    if (availableWidthForPanes <= 0) {
      // console.warn("setInitialLayout: availableWidthForPanes is not positive. TotalWidth:", totalWidth, "Padding:", mainContainerPaddingLR, "Splitter:", verticalSplitter.offsetWidth);
      // Don't set invalid flexBasis, wait for resize or next call
      return;
    }

    const problemPaneBasis = availableWidthForPanes * 0.4;
    const rightContainerBasis = availableWidthForPanes - problemPaneBasis;

    problemPane.style.flexBasis = `${problemPaneBasis}px`;
    rightContainer.style.flexBasis = `${rightContainerBasis}px`;
    problemPane.style.flexGrow = "0";
    problemPane.style.flexShrink = "0";
    rightContainer.style.flexGrow = "0";
    rightContainer.style.flexShrink = "0";

    requestAnimationFrame(() => {
      // Nested to ensure rightContainer has its dimensions
      const rightPaneHeight = rightContainer.offsetHeight;
      if (rightPaneHeight === 0) {
        // console.warn("setInitialLayout: rightContainer height is 0. Retrying inner layout...");
        requestAnimationFrame(() => setInitialLayout()); // Retry the whole layout
        return;
      }
      const availableHeightInRightContainer =
        rightPaneHeight - horizontalSplitter.offsetHeight;

      if (availableHeightInRightContainer > 0) {
        const editorPaneBasis = availableHeightInRightContainer * 0.6;
        const outputPaneBasis =
          availableHeightInRightContainer - editorPaneBasis;

        editorPane.style.flexBasis = `${editorPaneBasis}px`;
        outputPane.style.flexBasis = `${outputPaneBasis}px`;
        editorPane.style.flexGrow = "0";
        editorPane.style.flexShrink = "0";
        outputPane.style.flexGrow = "0";
        outputPane.style.flexShrink = "0";
      } else {
        // Fallback if height calculation is problematic
        editorPane.style.flexBasis = `60%`;
        outputPane.style.flexBasis = `40%`;
      }
      updateLineNumbers();
    });
  });
}

function clearConsole() {
  if (consoleOutputContainer) consoleOutputContainer.innerHTML = "";
  if (consoleSummaryEl) consoleSummaryEl.textContent = "";
}

function appendToConsole(htmlMessage) {
  if (!consoleOutputContainer) return;
  const entry = document.createElement("div");
  entry.innerHTML = htmlMessage;
  entry.classList.add("py-0.5"); // Tailwind class for padding
  consoleOutputContainer.appendChild(entry);
  consoleOutputContainer.scrollTop = consoleOutputContainer.scrollHeight;
}

function escapeHTML(text) {
  if (typeof text !== "string") text = String(text);
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
}

// Initialize resizable panes once DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Ensure all elements are present before trying to make them resizable
  if (
    verticalSplitter &&
    problemPane &&
    rightContainer &&
    horizontalSplitter &&
    editorPane &&
    outputPane &&
    mainContainer
  ) {
    makeResizable(verticalSplitter, problemPane, rightContainer, "vertical");
    makeResizable(horizontalSplitter, editorPane, outputPane, "horizontal");
  } else {
    console.error(
      "One or more elements for resizable panes not found on DOMContentLoaded.",
    );
  }
});
