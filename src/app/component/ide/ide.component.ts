import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Renderer2,
} from "@angular/core";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { Problem } from "../../interface/problem.interface";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { PyodideService } from "../../service/pyodide.service";
import { CodeExecutionService } from "../../service/code-execution.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-ide",
  standalone: true,
  imports: [MatInputModule, MatFormFieldModule, CommonModule, FormsModule],
  templateUrl: "./ide.component.html",
  styleUrl: "./ide.component.scss",
})
export class IdeComponent
  implements OnInit, OnDestroy, OnChanges, AfterViewInit
{
  @Input() problemData: Problem | undefined;
  code: string = "";
  lineNumbersArray: number[] = [];
  private subscription: Subscription | null = null;

  @ViewChild("codeTextarea") codeTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild("lineNumbers") lineNumbers!: ElementRef<HTMLDivElement>;

  constructor(
    private pyodideService: PyodideService,
    private codeExecutionService: CodeExecutionService,
    private renderer: Renderer2,
  ) {}

  ngOnInit(): void {
    // Initialize code with the function template
    this.code = this.generateFunctionTemplate();
    this.updateLineNumbers();

    // Subscribe to run code events
    this.subscription = this.codeExecutionService.runCode$.subscribe(() => {
      this.runCode();
    });
  }

  ngAfterViewInit() {
    // Initialize line numbers after view is initialized
    this.updateLineNumbers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Update code when problemData changes
    if (changes["problemData"] && changes["problemData"].currentValue) {
      this.code = this.generateFunctionTemplate();
      this.updateLineNumbers();
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  // Focus handlers to synchronize border colors
  onFocus(): void {
    const container = this.codeTextarea.nativeElement.closest(".ide-container");
    if (container) {
      this.renderer.addClass(container, "focused");
    }
  }

  onBlur(): void {
    const container = this.codeTextarea.nativeElement.closest(".ide-container");
    if (container) {
      this.renderer.removeClass(container, "focused");
    }
  }

  updateLineNumbers(): void {
    // Count the number of lines in the code
    const lineCount = (this.code.match(/\n/g) || []).length + 1;
    this.lineNumbersArray = Array.from({ length: lineCount }, (_, i) => i + 1);

    // Update in the next cycle to ensure DOM is updated
    setTimeout(() => {
      if (this.codeTextarea && this.lineNumbers) {
        this.syncScroll({ target: this.codeTextarea.nativeElement });
      }
    }, 0);
  }

  syncScroll(event: any): void {
    if (this.lineNumbers && this.codeTextarea) {
      this.lineNumbers.nativeElement.scrollTop =
        this.codeTextarea.nativeElement.scrollTop;
    }
  }

  generateFunctionTemplate(): string {
    if (this.problemData && this.problemData.function_params_names) {
      const paramList = this.problemData.function_params_names.join(", ");
      return `def function(${paramList}):`;
    }
    return "";
  }

  runCode(): void {
    if (this.problemData && this.problemData.test_cases) {
      // Clear the console first
      this.pyodideService.clearConsoleOutput();

      // Run the code with test cases
      this.pyodideService
        .runCode(this.code, "function", this.problemData.test_cases)
        .subscribe((results) => {
          console.log("Test results:", results);
        });
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    // Handle Tab key for simple indentation
    if (event.key === "Tab") {
      event.preventDefault();

      const textarea = this.codeTextarea.nativeElement;
      const selectionStart = textarea.selectionStart;
      const selectionEnd = textarea.selectionEnd;
      const indentSize = 4; // Number of spaces for indentation

      // Insert 4 spaces at cursor position
      const indent = " ".repeat(indentSize);
      this.code =
        this.code.substring(0, selectionStart) +
        indent +
        this.code.substring(selectionEnd);

      // Move cursor after inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd =
          selectionStart + indentSize;
      });

      return;
    }

    // Rest of your existing key handlers...
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      this.runCode();
      return;
    }

    // Handle intelligent indentation when Enter is pressed
    if (event.key === "Enter") {
      this.handleEnterKey(event);
      this.updateLineNumbers();
      return;
    }

    // Handle Cmd+? (or Cmd+/) for comment toggling
    if (
      (event.key === "?" || event.key === "/") &&
      (event.metaKey || event.ctrlKey)
    ) {
      event.preventDefault();
      this.toggleComments();
      return;
    }
  }

  private handleEnterKey(event: KeyboardEvent): void {
    event.preventDefault();

    const textarea = event.target as HTMLTextAreaElement;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;

    // Get current line up to cursor position
    const textBeforeCursor = this.code.substring(0, selectionStart);
    const textAfterCursor = this.code.substring(selectionEnd);
    const currentLine = textBeforeCursor.split("\n").pop() || "";

    // Calculate indentation
    const currentIndentation = this.getIndentation(currentLine);
    let newIndentation = currentIndentation;

    // Increase indentation if line ends with ':'
    if (currentLine.trimEnd().endsWith(":")) {
      newIndentation += "    "; // Add 4 spaces for new indentation level
    }

    // Insert new line with proper indentation
    this.code = textBeforeCursor + "\n" + newIndentation + textAfterCursor;

    // Update line numbers
    this.updateLineNumbers();

    // Set cursor position after the indentation
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd =
        selectionStart + 1 + newIndentation.length;
    });
  }

  private getIndentation(line: string): string {
    const match = line.match(/^(\s*)/);
    return match ? match[1] : "";
  }

  private toggleComments(): void {
    // Implementation unchanged from original
    // ...existing implementation...
    const textarea = this.codeTextarea.nativeElement;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;

    // Split into lines
    const lines = this.code.split("\n");

    // Determine line range to affect
    let startLine =
      this.code.substring(0, selectionStart).split("\n").length - 1;
    let endLine = this.code.substring(0, selectionEnd).split("\n").length - 1;

    // Check if all selected lines are commented
    const allCommented = lines
      .slice(startLine, endLine + 1)
      .every((line) => line.trimStart().startsWith("#"));

    // Toggle comments for each line
    const newLines = [...lines];
    for (let i = startLine; i <= endLine; i++) {
      if (allCommented) {
        // Remove comment
        const firstHashIndex = newLines[i].indexOf("#");
        if (firstHashIndex !== -1) {
          newLines[i] =
            newLines[i].substring(0, firstHashIndex) +
            newLines[i].substring(firstHashIndex + 1);
        }
      } else {
        // Add comment
        newLines[i] = "# " + newLines[i];
      }
    }

    // Update code
    this.code = newLines.join("\n");
    this.updateLineNumbers();
  }
}
