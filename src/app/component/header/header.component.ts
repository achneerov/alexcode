import { Component } from "@angular/core";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { CodeExecutionService } from "../../service/code-execution.service";
import { CommonModule } from "@angular/common";
import { ProblemDataService } from "../../service/problem-data.service";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    FormsModule,
    CommonModule,
  ],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
})
export class HeaderComponent {
  searchText: string = "";
  showErrorMessage: boolean = false;

  constructor(
    private codeExecutionService: CodeExecutionService,
    private router: Router,
    private problemDataService: ProblemDataService,
  ) {}

  runCode(): void {
    this.codeExecutionService.triggerRunCode();
  }

  goToProblem(): void {
    // Default to problem 0 if searchText is empty
    const problemId = this.searchText ? this.searchText : "0";

    // Check if problem exists
    this.problemDataService.getProblemData(problemId).subscribe({
      next: () => {
        // Problem exists, navigate to it
        this.router.navigate(["/problem", problemId]);
      },
      error: () => {
        // Problem doesn't exist, show error message
        this.showErrorMessage = true;
        setTimeout(() => {
          this.showErrorMessage = false;
        }, 1000); // Hide after 1 second
      },
    });
  }

  // Handle Enter key in search input
  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      this.goToProblem();
    }
  }
}
