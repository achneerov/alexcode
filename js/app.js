// js/app.js

// Pyodide and Problem state variables are global in this script's scope
let pyodide = null;
let pyodideReady = false; // Accessed by editor.js
let pyodideStdoutForTest = null;
let pyodideStderrForTest = null;

let currentTestCases = [];
let currentQuestionData = null;

async function initializePyodide() {
  if (
    !runCodeBtn ||
    typeof appendToConsole !== "function" ||
    typeof escapeHTML !== "function"
  ) {
    // console.warn("initializePyodide: Missing dependencies (runCodeBtn, appendToConsole, escapeHTML).");
    return;
  }
  runCodeBtn.disabled = true;
  appendToConsole(
    `<span class="text-blue-700">Initializing Python environment...</span>`,
  );
  try {
    pyodide = await loadPyodide({
      // loadPyodide is from the CDN script
      stdout: (text) => {
        const message = text.replace(/\n$/, "");
        if (pyodideStdoutForTest) {
          pyodideStdoutForTest(message);
        } else {
          appendToConsole(
            `<span class="text-gray-700">${escapeHTML(message)}</span>`,
          );
        }
      },
      stderr: (text) => {
        const message = text.replace(/\n$/, "");
        if (pyodideStderrForTest) {
          pyodideStderrForTest(message);
        } else {
          appendToConsole(
            `<span class="text-red-600">${escapeHTML(message)}</span>`,
          );
        }
      },
    });
    appendToConsole(
      `<span class="text-blue-700">Python environment ready.</span>`,
    );
    pyodideReady = true;
    if (currentQuestionData && runCodeBtn) {
      runCodeBtn.disabled = false;
    } else if (runCodeBtn) {
      runCodeBtn.disabled = true;
    }
  } catch (error) {
    console.error("Failed to load Pyodide:", error);
    appendToConsole(
      `<span class="text-red-700">Error loading Pyodide: ${escapeHTML(error.message)}</span>`,
    );
    if (runCodeBtn) runCodeBtn.disabled = true;
    pyodideReady = false;
  }
}

function parseDescriptionToHtml(description) {
  if (typeof escapeHTML !== "function") {
    // console.warn("parseDescriptionToHtml: escapeHTML function not found.");
    return "<p>Error: escapeHTML utility not available.</p>";
  }
  if (!description) return "<p>No description provided.</p>";

  description = description.replace(
    /```([a-zA-Z]*)\n([\s\S]*?)\n```/g,
    (match, lang, code) => {
      const escapedCode = escapeHTML(code.trim());
      return `<pre class="bg-gray-100 p-2 rounded my-2 overflow-x-auto text-sm"><code class="language-${lang || ""}">${escapedCode}</code></pre>`;
    },
  );

  description = description.replace(
    /`([^`]+)`/g,
    '<code class="problem-description-code">$1</code>', // Ensure .problem-description-code styles exist
  );

  let finalHtml = "";
  let inList = false;
  const lines = description.split("\n");

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.trim().startsWith("<pre")) {
      // If we already have a pre block from ```
      finalHtml += line;
      while (i + 1 < lines.length && !lines[i].trim().endsWith("</pre>")) {
        i++;
        finalHtml += "\n" + lines[i];
      }
      continue;
    }

    if (line.trim().startsWith("- ")) {
      if (!inList) {
        finalHtml += '<ul class="list-disc list-inside ml-4 space-y-1 my-2">';
        inList = true;
      }
      finalHtml += `<li>${line.trim().substring(2)}</li>`;
    } else {
      if (inList) {
        finalHtml += "</ul>";
        inList = false;
      }
      if (line.trim() !== "") {
        if (
          line.toLowerCase().includes("<strong>example") ||
          line.toLowerCase().includes("<strong>constraints:") ||
          line.toLowerCase().includes("<em>follow-up:")
        ) {
          // Attempt to style these sections better
          finalHtml += `<div class="mt-3 mb-1 font-semibold text-gray-700">${line.replace(/<strong>(.*?)<\/strong>/gi, "$1").replace(/<em>(.*?)<\/em>/gi, "$1")}</div>`;
        } else {
          finalHtml += `<p>${line}</p>`;
        }
      } else if (
        finalHtml.length > 0 &&
        !finalHtml.endsWith("</p>") &&
        !finalHtml.endsWith("</ul>") &&
        !finalHtml.endsWith("</div>") &&
        !finalHtml.endsWith("</pre>")
      ) {
        // Add <br> for empty lines that are not after a block element, to preserve paragraph breaks
        if (
          !lines[i - 1]?.trim().startsWith("<pre") &&
          !lines[i - 1]?.trim().endsWith("</pre>")
        ) {
          finalHtml += "<br>";
        }
      }
    }
  }
  if (inList) finalHtml += "</ul>";
  return (
    finalHtml.replace(/<br>\s*<br>/g, "<br>") ||
    "<p>Error parsing description or description is empty.</p>"
  );
}

async function loadQuestionData(questionId) {
  if (
    !runCodeBtn ||
    !problemTitleElement ||
    !problemTextContainer ||
    !codeEditor ||
    typeof updateLineNumbers !== "function" ||
    typeof parseDescriptionToHtml !== "function" ||
    typeof updateEditorWithPythonBoilerplate !== "function" ||
    typeof clearConsole !== "function" ||
    typeof appendToConsole !== "function" ||
    typeof escapeHTML !== "function"
  ) {
    // console.warn("loadQuestionData: Missing one or more dependencies.");
    return;
  }

  runCodeBtn.disabled = true;
  problemTitleElement.textContent = `Loading Question ${questionId}...`;
  problemTextContainer.innerHTML = "<p>Fetching question details...</p>";
  currentTestCases = [];
  currentQuestionData = null;
  if (codeEditor) codeEditor.value = ""; // Clear editor
  updateLineNumbers();

  try {
    const response = await fetch(`${questionId}.json`); // Assumes JSON files are in the root
    if (!response.ok) {
      throw new Error(
        `Failed to load ${questionId}.json. Status: ${response.status}`,
      );
    }
    const data = await response.json();
    currentQuestionData = data;

    document.title = `Q${questionId}: ${data.title || "Coding Challenge"} - AlexCode`;
    problemTitleElement.textContent = data.title
      ? `Q${questionId}: ${data.title}`
      : `Question ${questionId}`;
    problemTextContainer.innerHTML = parseDescriptionToHtml(data.description);

    currentTestCases = data.test_cases || [];
    updateEditorWithPythonBoilerplate(data.function_params_names); // from editor.js

    if (pyodideReady && runCodeBtn) {
      runCodeBtn.disabled = false;
    }
    clearConsole();
    appendToConsole(
      `<span class="text-blue-700">Successfully loaded Question ${questionId}.</span>`,
    );
  } catch (error) {
    console.error("Error loading question data:", error);
    problemTitleElement.textContent = `Error Loading Question ${questionId}`;
    problemTextContainer.innerHTML = `<p class="text-red-600">Could not load question data for ID ${questionId}. Please check if '${questionId}.json' exists and is accessible. Details: ${escapeHTML(error.message)}</p>`;
    updateEditorWithPythonBoilerplate(); // Reset editor
    if (runCodeBtn) runCodeBtn.disabled = true;
    appendToConsole(
      `<span class="text-red-700">Error loading question: ${escapeHTML(error.message)}</span>`,
    );
  }
}

function compareArrays(arr1, arr2) {
  // currentQuestionData is accessed here
  if (!Array.isArray(arr1) && !Array.isArray(arr2)) {
    // Handle non-array types (numbers, strings, booleans, null, objects)
    if (
      typeof arr1 === "number" &&
      typeof arr2 === "number" &&
      isNaN(arr1) &&
      isNaN(arr2)
    )
      return true; // NaN === NaN
    return JSON.stringify(arr1) === JSON.stringify(arr2); // General case for primitives and objects
  }
  if (Array.isArray(arr1) !== Array.isArray(arr2)) return false; // One is array, other is not
  if (arr1 === null && arr2 === null) return true;
  if (arr1 === null || arr2 === null) return false;
  if (arr1.length !== arr2.length) return false;

  const orderDoesNotMatter =
    currentQuestionData?.output_order_matters === false;

  if (orderDoesNotMatter) {
    // Create stringified, sorted copies for comparison if order doesn't matter
    const sortedStrArr1 = arr1.map((el) => JSON.stringify(el)).sort();
    const sortedStrArr2 = arr2.map((el) => JSON.stringify(el)).sort();
    return JSON.stringify(sortedStrArr1) === JSON.stringify(sortedStrArr2);
  } else {
    // Order matters, direct stringify comparison of arrays
    return JSON.stringify(arr1) === JSON.stringify(arr2);
  }
}

if (
  runCodeBtn &&
  codeEditor &&
  typeof clearConsole === "function" &&
  typeof appendToConsole === "function" &&
  typeof escapeHTML === "function" &&
  typeof compareArrays === "function"
) {
  runCodeBtn.addEventListener("click", async () => {
    if (!currentQuestionData) {
      appendToConsole(
        `<span class="text-red-600">No question loaded. Cannot run tests.</span>`,
      );
      return;
    }
    clearConsole();
    const userCode = codeEditor.value;
    let passedCount = 0;
    const startTime = performance.now();

    appendToConsole(
      `<span class="text-blue-700">Running Python tests for Question ${currentQuestionData.id || "Current"}...</span>`,
    );

    if (!currentTestCases || currentTestCases.length === 0) {
      appendToConsole(
        `<span class="text-yellow-500">No test cases found for this question.</span>`,
      );
      if (consoleSummaryEl)
        consoleSummaryEl.textContent = `(0/0 passed) - 0.00 ms`;
      return;
    }

    for (let i = 0; i < currentTestCases.length; i++) {
      const testCase = currentTestCases[i];
      let currentTestLogEntries = []; // To store logs (stdout/stderr) for this specific test case
      let result;
      let currentTestPassed = false;
      let actualOutputStr = "Execution did not return a result.";
      let executionErrorOccurred = false;

      const inputParamsDisplay = Object.entries(testCase.input)
        .map(([key, value]) => `${key}=${escapeHTML(JSON.stringify(value))}`)
        .join(", ");
      appendToConsole(
        `<span class="text-gray-500">Test Case ${testCase.id || i + 1}: Input: ${inputParamsDisplay}</span>`,
      );

      try {
        if (!pyodideReady || !pyodide) {
          currentTestLogEntries.push({
            type: "error",
            text: "Python environment not ready.",
          });
          executionErrorOccurred = true;
        } else {
          // Set up per-test stdout/stderr handlers
          pyodideStdoutForTest = (text) =>
            currentTestLogEntries.push({ type: "log", text: text });
          pyodideStderrForTest = (text) =>
            currentTestLogEntries.push({ type: "error", text: text });

          await pyodide.runPythonAsync(userCode); // Run the user's entire script
          const solutionFunc = pyodide.globals.get("function"); // Get the target function

          if (typeof solutionFunc !== "function") {
            throw new Error("Main 'function' not defined in Python code.");
          }

          // Prepare arguments for the Python function
          const pyFuncArgs = currentQuestionData.function_params_names.map(
            (paramName) => {
              if (testCase.input.hasOwnProperty(paramName)) {
                return pyodide.toPy(testCase.input[paramName]); // Convert JS arg to Py
              }
              // console.warn(`Parameter '${paramName}' not found in test case input for test ${testCase.id}. Passing None.`);
              return pyodide.globals.get("None"); // Python's None
            },
          );

          const pyResult = await solutionFunc(...pyFuncArgs); // Call the Python function
          result =
            pyResult && typeof pyResult.toJs === "function"
              ? pyResult.toJs({ create_proxies: false })
              : pyResult; // Convert result back to JS

          // Clean up Pyodide proxies if they were created
          if (pyResult && typeof pyResult.destroy === "function")
            pyResult.destroy();
          pyFuncArgs.forEach((arg) => {
            if (arg && typeof arg.destroy === "function") arg.destroy();
          });
        }

        if (!executionErrorOccurred) {
          actualOutputStr = JSON.stringify(result);
          currentTestPassed = compareArrays(result, testCase.output);
        } else {
          currentTestPassed = false; // Already set by error
          actualOutputStr = "Error during execution";
        }
      } catch (error) {
        currentTestLogEntries.push({
          type: "error",
          text: `Runtime Error: ${error.message}${error.stack ? `\nStack: ${error.stack.split("\n").slice(0, 5).join("\n")}` : ""}`,
        });
        actualOutputStr = `Error: ${error.message}`;
        currentTestPassed = false;
        executionErrorOccurred = true;
      } finally {
        // Reset per-test stdout/stderr handlers
        pyodideStdoutForTest = null;
        pyodideStderrForTest = null;
      }

      // Display logs captured during this test case execution
      currentTestLogEntries.forEach((log) => {
        const logColorClass =
          log.type === "error" ? "text-red-600" : "text-gray-700";
        appendToConsole(
          `<span class="${logColorClass}">${escapeHTML(log.text)}</span>`,
        );
      });

      const expectedOutputStr = JSON.stringify(testCase.output);
      const statusText = currentTestPassed ? "PASSED" : "FAILED";
      const resultLineColorClass = currentTestPassed
        ? "text-green-600"
        : "text-red-600";
      appendToConsole(
        `<span class="${resultLineColorClass}">` +
          `Expected: <code class="problem-description-code"><span class="${resultLineColorClass}">${escapeHTML(expectedOutputStr)}</span></code> | ` +
          `Got: <code class="problem-description-code"><span class="${resultLineColorClass}">${escapeHTML(actualOutputStr)}</span></code> - ` +
          `<strong class="font-semibold ${resultLineColorClass}">${statusText}</strong>` +
          `</span>`,
      );

      if (currentTestPassed && !executionErrorOccurred) passedCount++;
      if (i < currentTestCases.length - 1)
        appendToConsole(`<span class="text-gray-400">---</span>`);
    }

    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    if (consoleSummaryEl)
      consoleSummaryEl.textContent = `(${passedCount}/${currentTestCases.length} passed) - ${duration} ms`;

    const allPassed =
      passedCount === currentTestCases.length && currentTestCases.length > 0;
    const finalStatusColor = allPassed
      ? "text-green-600"
      : currentTestCases.length > 0
        ? "text-red-600"
        : "text-blue-700";
    if (allPassed) {
      appendToConsole(
        `<span class="${finalStatusColor} font-semibold">All tests passed!</span>`,
      );
    } else if (
      currentTestCases.length > 0 &&
      passedCount < currentTestCases.length
    ) {
      appendToConsole(
        `<span class="${finalStatusColor} font-semibold">Some tests failed.</span>`,
      );
    } else if (currentTestCases.length === 0) {
      appendToConsole(
        `<span class="text-blue-700">No test cases were run.</span>`,
      );
    }
  });
} else {
  console.error(
    "Run Code Button or its dependencies not found. Test running might not work.",
  );
}

// Main initialization logic on window load
window.addEventListener("load", () => {
  if (
    typeof setInitialLayout !== "function" ||
    typeof loadQuestionData !== "function" ||
    typeof initializePyodide !== "function" ||
    typeof updateLineNumbers !== "function"
  ) {
    console.error(
      "Critical functions for app initialization are missing. App may not work correctly.",
    );
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  let questionId = urlParams.get("q");

  if (
    questionId === null ||
    questionId.trim() === "" ||
    isNaN(parseInt(questionId))
  ) {
    questionId = "0"; // Default question
    const newUrl = `${window.location.pathname}?q=${questionId}${window.location.hash}`;
    window.history.replaceState({ path: newUrl }, "", newUrl);
  }

  setInitialLayout(); // from ui.js
  loadQuestionData(questionId); // Defined in this file
  initializePyodide(); // Defined in this file

  window.addEventListener("resize", () => {
    setInitialLayout(); // from ui.js
  });
  setTimeout(updateLineNumbers, 100); // from ui.js, give a bit of time for layout
});

window.addEventListener("popstate", (event) => {
  if (typeof loadQuestionData !== "function") return;
  const urlParams = new URLSearchParams(window.location.search);
  let questionId = urlParams.get("q") || "0";
  loadQuestionData(questionId);
});
