import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
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
export class IdeComponent implements OnInit, OnDestroy, OnChanges {
  @Input() problemData: Problem | undefined;
  code: string = "";
  private subscription: Subscription | null = null;

  constructor(
    private pyodideService: PyodideService,
    private codeExecutionService: CodeExecutionService,
  ) {}

  ngOnInit(): void {
    // Initialize code with the function template
    this.code = this.generateFunctionTemplate();

    // Subscribe to run code events
    this.subscription = this.codeExecutionService.runCode$.subscribe(() => {
      this.runCode();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Update code when problemData changes
    if (changes["problemData"] && changes["problemData"].currentValue) {
      this.code = this.generateFunctionTemplate();
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
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
}
