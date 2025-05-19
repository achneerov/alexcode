// js/editor.js

// This function will be called from app.js, which defines pyodideReady
function updateEditorWithPythonBoilerplate(paramNames = []) {
  if (!codeEditor || !runCodeBtn) {
    // console.warn("updateEditorWithPythonBoilerplate: codeEditor or runCodeBtn not found.");
    return;
  }

  const functionSignature = `def function(${paramNames.join(", ")}):`;
  const pythonBoilerplate = `${functionSignature}\n${" ".repeat(4)}`; // 4 spaces for indent
  codeEditor.value = pythonBoilerplate;

  const cursorPos = functionSignature.length + 1 + 4; // After newline and indent
  codeEditor.focus();
  codeEditor.selectionStart = cursorPos;
  codeEditor.selectionEnd = cursorPos;

  updateLineNumbers(); // from ui.js

  // pyodideReady is defined in app.js.
  // This function is typically called after pyodide might be ready or its state is known.
  if (typeof pyodideReady !== "undefined") {
    runCodeBtn.disabled = !pyodideReady;
  } else {
    // Fallback, though app.js should manage pyodideReady state before this becomes critical
    runCodeBtn.disabled = true;
  }
}

if (codeEditor && typeof updateLineNumbers === "function" && runCodeBtn) {
  codeEditor.addEventListener("input", updateLineNumbers);

  codeEditor.addEventListener("scroll", () => {
    if (lineNumbersDiv) {
      lineNumbersDiv.scrollTop = codeEditor.scrollTop;
    }
  });

  codeEditor.addEventListener("keydown", function (e) {
    const tabSpaces = "    "; // 4 spaces

    // Ctrl+Enter or Cmd+Enter to run code
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (runCodeBtn && !runCodeBtn.disabled) {
        runCodeBtn.click(); // runCodeBtn is from ui.js, click handled in app.js
      }
      return;
    }

    // Ctrl+/ or Cmd+/ to toggle comment
    if ((e.metaKey || e.ctrlKey) && e.key === "/") {
      e.preventDefault();
      const start = this.selectionStart;
      const end = this.selectionEnd;

      let textLines = this.value.split("\n");

      let selectionStartLine =
        this.value.substring(0, start).split("\n").length - 1;
      let selectionEndLine =
        this.value.substring(0, end > 0 ? end - 1 : 0).split("\n").length - 1;
      if (start === end) selectionEndLine = selectionStartLine;

      let allLinesCommented = true;
      for (let i = selectionStartLine; i <= selectionEndLine; i++) {
        if (
          textLines[i] &&
          textLines[i].trim() !== "" &&
          !textLines[i].trim().startsWith("#")
        ) {
          allLinesCommented = false;
          break;
        }
      }

      let newCursorPos = start; // Used if start === end
      let linesModified = 0;

      if (allLinesCommented) {
        // UNCOMMENT
        for (let i = selectionStartLine; i <= selectionEndLine; i++) {
          if (textLines[i] && textLines[i].startsWith("# ")) {
            textLines[i] = textLines[i].substring(2);
            if (i === selectionStartLine && start === end) newCursorPos -= 2;
            linesModified++;
          } else if (textLines[i] && textLines[i].startsWith("#")) {
            textLines[i] = textLines[i].substring(1);
            if (i === selectionStartLine && start === end) newCursorPos -= 1;
            linesModified++;
          }
        }
      } else {
        // COMMENT
        for (let i = selectionStartLine; i <= selectionEndLine; i++) {
          if (textLines[i] && textLines[i].trim() !== "") {
            textLines[i] = "# " + textLines[i];
            if (i === selectionStartLine && start === end) newCursorPos += 2;
            linesModified++;
          }
        }
      }

      if (linesModified > 0) {
        this.value = textLines.join("\n");
        if (start === end) {
          this.selectionStart = this.selectionEnd = Math.max(0, newCursorPos);
        } else {
          // Recalculate selection for multi-line to cover the changed lines fully
          let newSelStart = 0;
          for (let i = 0; i < selectionStartLine; i++) {
            newSelStart += textLines[i].length + 1;
          }
          let newSelEnd = 0;
          for (let i = 0; i <= selectionEndLine; i++) {
            newSelEnd += textLines[i].length + 1;
          }
          newSelEnd -= 1; // Adjust for the last newline

          this.selectionStart = newSelStart;
          this.selectionEnd = Math.max(newSelStart, newSelEnd); // Ensure end is not before start
        }
      }
      setTimeout(updateLineNumbers, 0);
      return;
    }

    // Enter key for auto-indent
    if (e.key === "Enter") {
      e.preventDefault();
      const cursorPos = this.selectionStart;
      const textBeforeCursor = this.value.substring(0, cursorPos);
      const textAfterCursor = this.value.substring(cursorPos);
      const lines = textBeforeCursor.split("\n");
      const currentLine = lines[lines.length - 1];
      const indentMatch = currentLine.match(/^(\s*)/);
      let currentIndent = indentMatch ? indentMatch[0] : "";
      let newText = "\n";

      if (currentLine.trim().endsWith(":")) {
        newText += currentIndent + tabSpaces;
      } else {
        newText += currentIndent;
      }

      this.value = textBeforeCursor + newText + textAfterCursor;
      this.selectionStart = this.selectionEnd = cursorPos + newText.length;
      setTimeout(updateLineNumbers, 0);
      return;
    }

    // Tab key for spaces
    if (e.key === "Tab") {
      e.preventDefault();
      // TODO: Handle tabbing for multi-line selections (indent/unindent)
      const start = this.selectionStart;
      const end = this.selectionEnd;
      this.value =
        this.value.substring(0, start) + tabSpaces + this.value.substring(end);
      this.selectionStart = this.selectionEnd = start + tabSpaces.length;
      setTimeout(updateLineNumbers, 0);
    }
  });

  codeEditor.addEventListener("cut", () => setTimeout(updateLineNumbers, 0));
  codeEditor.addEventListener("paste", () => setTimeout(updateLineNumbers, 0));
} else {
  console.error(
    "Code editor or its dependencies not found. Editor features might not work.",
  );
}
