import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, from, of } from "rxjs";
import { catchError, switchMap } from "rxjs/operators";

// Add TypeScript declaration for Pyodide
declare global {
  interface Window {
    loadPyodide: any;
  }
}

@Injectable({
  providedIn: "root",
})
export class PyodideService {
  private pyodide: any;
  private pyodideLoading: Promise<any> | null = null;
  private consoleOutput = new BehaviorSubject<string[]>([]);

  constructor() {
    // Start loading Pyodide immediately when service is created
    this.loadPyodide();
  }

  // Get the console output as an observable
  getConsoleOutput(): Observable<string[]> {
    return this.consoleOutput.asObservable();
  }

  // Clear the console output
  clearConsoleOutput(): void {
    this.consoleOutput.next([]);
  }

  // Add a line to the console output
  private addConsoleOutput(text: string): void {
    const current = this.consoleOutput.value;
    this.consoleOutput.next([...current, text]);
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
            this.addConsoleOutput("Loading Pyodide...");
            this.pyodide = await window.loadPyodide({
              indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
            });
            this.setupPyodideEnvironment();
            this.addConsoleOutput("Pyodide loaded successfully!");
            resolve(this.pyodide);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            this.addConsoleOutput(`Error loading Pyodide: ${errorMessage}`);
            reject(error);
          }
        };
        script.onerror = (error) => {
          this.addConsoleOutput("Failed to load Pyodide script.");
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
          js_add_console_output(output.rstrip('\\n'))

      sys.stdout.write = custom_print
      sys.stderr.write = custom_print
      __builtins__.print = custom_print
    `);

    // Create a JavaScript function to add output to our console
    const addConsoleOutputProxy = this.pyodide.toPy((text: string) => {
      this.addConsoleOutput(text);
    });

    // Make it available to Python
    this.pyodide.globals.set("js_add_console_output", addConsoleOutputProxy);
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

          // Run each test case
          for (const testCase of testCases) {
            try {
              // Convert input to a format Python can use
              const inputArgs = this.convertInputToArgs(testCase.input);

              // Create the function call
              const functionCall = `${functionName}(${inputArgs})`;
              this.addConsoleOutput(`Running: ${functionCall}`);

              // Execute the function
              const result = this.pyodide.runPython(functionCall);

              // Convert to JavaScript value
              const jsResult = result.toJs();

              // Add to results
              results.push({
                input: testCase.input,
                expected: testCase.output,
                result: jsResult,
                passed: this.compareResults(jsResult, testCase.output),
              });

              this.addConsoleOutput(`Result: ${JSON.stringify(jsResult)}`);
            } catch (testErr) {
              // Fix: Properly handle the unknown type
              const testError =
                testErr instanceof Error ? testErr.message : String(testErr);
              this.addConsoleOutput(`Error in test case: ${testError}`);
              results.push({
                input: testCase.input,
                expected: testCase.output,
                error: testError,
                passed: false,
              });
            }
          }

          return of(results);
        } catch (err) {
          // Fix: Properly handle the unknown type
          const error = err instanceof Error ? err.message : String(err);
          this.addConsoleOutput(`Error executing code: ${error}`);
          return of([{ error: error, passed: false }]);
        }
      }),
      catchError((err) => {
        // Fix: Properly handle the unknown type
        const error = err instanceof Error ? err.message : String(err);
        this.addConsoleOutput(`Service error: ${error}`);
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
