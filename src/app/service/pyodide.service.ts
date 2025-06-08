import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, from, of } from "rxjs";
import { catchError, switchMap } from "rxjs/operators";

// Add TypeScript declaration for Pyodide
declare global {
  interface Window {
    loadPyodide: any;
  }
}

export interface ConsoleOutputLine {
  text: string;
  type: "info" | "success" | "error" | "print" | "header";
}

@Injectable({
  providedIn: "root",
})
export class PyodideService {
  private pyodide: any;
  private pyodideLoading: Promise<any> | null = null;
  private consoleOutput = new BehaviorSubject<ConsoleOutputLine[]>([]);
  private printBuffer: string[] = [];
  private currentTestCase: number = -1;

  constructor() {
    // Start loading Pyodide immediately when service is created
    this.loadPyodide();
  }

  // Get the console output as an observable
  getConsoleOutput(): Observable<ConsoleOutputLine[]> {
    return this.consoleOutput.asObservable();
  }

  // Clear the console output
  clearConsoleOutput(): void {
    this.consoleOutput.next([]);
    this.printBuffer = [];
    this.currentTestCase = -1;
  }

  // Add a line to the console output
  private addConsoleOutput(
    text: string,
    type: "info" | "success" | "error" | "print" | "header" = "info",
  ): void {
    const current = this.consoleOutput.value;
    this.consoleOutput.next([...current, { text, type }]);
  }

  // Buffer print statements until a test case is completed
  private bufferPrint(text: string): void {
    this.printBuffer.push(text);
  }

  // Flush print buffer to console
  private flushPrintBuffer(): void {
    if (this.printBuffer.length > 0) {
      for (const line of this.printBuffer) {
        this.addConsoleOutput(line, "print");
      }
      this.printBuffer = [];
    }
  }

  // Load Pyodide once
  private loadPyodide(): Promise<any> {
    if (!this.pyodideLoading) {
      // Create a script element to load Pyodide
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js";
      document.head.appendChild(script);

      this.pyodideLoading = new Promise((resolve, reject) => {
        script.onload = async () => {
          try {
            this.addConsoleOutput("Loading Pyodide...", "info");
            this.pyodide = await window.loadPyodide({
              indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
            });
            this.setupPyodideEnvironment();
            this.addConsoleOutput("Pyodide loaded successfully!", "info");
            resolve(this.pyodide);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            this.addConsoleOutput(
              `Error loading Pyodide: ${errorMessage}`,
              "error",
            );
            reject(error);
          }
        };
        script.onerror = (error) => {
          this.addConsoleOutput("Failed to load Pyodide script.", "error");
          reject(error);
        };
      });
    }
    return this.pyodideLoading;
  }

  // Set up the Pyodide environment with our custom print function
  private setupPyodideEnvironment(): void {
    // Redirect Python's print function to our console output
    this.pyodide.runPython(`
      import sys
      from pyodide.ffi import create_proxy

      def custom_print(*args, **kwargs):
          # Convert all arguments to strings and join them
          sep = kwargs.get('sep', ' ')
          end = kwargs.get('end', '\\n')
          output = sep.join(str(arg) for arg in args) + end
          # Send to JavaScript
          js_buffer_print(output.rstrip('\\n'))

      sys.stdout.write = lambda x: js_buffer_print(x)
      sys.stderr.write = lambda x: js_buffer_print(x)
      __builtins__.print = custom_print
    `);

    // Create a JavaScript function to buffer output
    const bufferPrintProxy = this.pyodide.toPy((text: string) => {
      this.bufferPrint(text);
    });

    // Make it available to Python
    this.pyodide.globals.set("js_buffer_print", bufferPrintProxy);
  }

  // Run a Python function with test cases
  runCode(
    code: string,
    functionName: string,
    testCases: any[],
  ): Observable<any[]> {
    return from(this.loadPyodide()).pipe(
      switchMap(() => {
        try {
          // Run the user's code to define the function
          this.pyodide.runPython(code);

          const results = [];
          let passedTests = 0;
          const totalTests = testCases.length;

          // Start timing the test execution
          const startTime = performance.now();

          // Run each test case
          for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            this.currentTestCase = i;

            try {
              // Reset print buffer for this test case
              this.printBuffer = [];

              // Add test case header
              this.addConsoleOutput(`----- Test Case ${i + 1} -----`, "header");

              // Convert input to a format Python can use
              const inputArgs = this.convertInputToArgs(testCase.input);

              // Create the function call
              const functionCall = `${functionName}(${inputArgs})`;

              // Execute the function
              const result = this.pyodide.runPython(functionCall);

              // Convert to JavaScript value
              let jsResult;
              if (
                result &&
                typeof result === "object" &&
                typeof result.toJs === "function"
              ) {
                // It's a Pyodide object with a toJs method
                jsResult = result.toJs();
              } else {
                // It's already a JavaScript primitive or doesn't have toJs
                jsResult = result;
              }

              // First flush any print statements
              this.flushPrintBuffer();

              // Now add the function call details
              this.addConsoleOutput(`Input: ${functionCall}`, "info");
              this.addConsoleOutput(
                `Expected: ${JSON.stringify(testCase.output)}`,
                "info",
              );

              const passed = this.compareResults(jsResult, testCase.output);
              // Add the result with appropriate styling
              if (passed) {
                this.addConsoleOutput(
                  `Output: ${JSON.stringify(jsResult)} ✅`,
                  "success",
                );
                passedTests++;
              } else {
                this.addConsoleOutput(
                  `Output: ${JSON.stringify(jsResult)} ❌`,
                  "error",
                );
              }

              // Add to results
              results.push({
                input: testCase.input,
                expected: testCase.output,
                result: jsResult,
                passed,
              });
            } catch (testErr) {
              // Fix: Properly handle the unknown type
              const testError =
                testErr instanceof Error ? testErr.message : String(testErr);

              // Flush any print statements first
              this.flushPrintBuffer();

              // Add the error information
              this.addConsoleOutput(
                `Error in test case: ${testError}`,
                "error",
              );

              results.push({
                input: testCase.input,
                expected: testCase.output,
                error: testError,
                passed: false,
              });
            }
          }

          // End timing after all test cases have been run
          const endTime = performance.now();
          const executionTime = (endTime - startTime).toFixed(2);

          this.currentTestCase = -1;

          // Get current console output
          const currentOutput = this.consoleOutput.value;

          // Create summary messages
          const executionTimeLine: ConsoleOutputLine = {
            text: `⏱️ Test execution time: ${executionTime}ms`,
            type: "header",
          };

          const resultsLine: ConsoleOutputLine = {
            text: `📊 Test Results: ${passedTests}/${totalTests} tests passed`,
            type: "header",
          };

          // Insert summary at the beginning of the console output
          const updatedOutput = [
            executionTimeLine,
            resultsLine,
            ...currentOutput,
          ];
          this.consoleOutput.next(updatedOutput);

          return of(results);
        } catch (err) {
          // Fix: Properly handle the unknown type
          const error = err instanceof Error ? err.message : String(err);
          this.addConsoleOutput(`Error executing code: ${error}`, "error");
          return of([{ error: error, passed: false }]);
        }
      }),
      catchError((err) => {
        // Fix: Properly handle the unknown type
        const error = err instanceof Error ? err.message : String(err);
        this.addConsoleOutput(`Service error: ${error}`, "error");
        return of([{ error: error, passed: false }]);
      }),
    );
  }

  // Convert JavaScript test case input to Python argument string
  private convertInputToArgs(input: any): string {
    if (typeof input === "object" && !Array.isArray(input)) {
      // If input is an object with named parameters
      return Object.entries(input)
        .map(([key, value]) => `${key}=${this.valueToString(value)}`)
        .join(", ");
    } else if (Array.isArray(input)) {
      // If input is an array of positional arguments
      return input.map((val) => this.valueToString(val)).join(", ");
    } else {
      // Single value
      return this.valueToString(input);
    }
  }

  // Convert a JavaScript value to a Python string representation
  private valueToString(value: any): string {
    if (value === null) {
      return "None";
    } else if (typeof value === "string") {
      return `"${value}"`;
    } else if (Array.isArray(value)) {
      return `[${value.map((v) => this.valueToString(v)).join(", ")}]`;
    } else if (typeof value === "object") {
      // Handle dictionary-like objects
      const entries = Object.entries(value).map(
        ([k, v]) => `"${k}": ${this.valueToString(v)}`,
      );
      return `{${entries.join(", ")}}`;
    } else {
      return String(value);
    }
  }

  // Compare the Python function result with the expected output
  private compareResults(actual: any, expected: any): boolean {
    if (Array.isArray(actual) && Array.isArray(expected)) {
      if (actual.length !== expected.length) return false;
      return actual.every((val, idx) =>
        this.compareResults(val, expected[idx]),
      );
    } else if (
      typeof actual === "object" &&
      actual !== null &&
      typeof expected === "object" &&
      expected !== null
    ) {
      const actualKeys = Object.keys(actual);
      const expectedKeys = Object.keys(expected);
      if (actualKeys.length !== expectedKeys.length) return false;
      return actualKeys.every(
        (key) =>
          expectedKeys.includes(key) &&
          this.compareResults(actual[key], expected[key]),
      );
    } else {
      return actual === expected;
    }
  }
}
