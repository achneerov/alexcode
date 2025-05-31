import { Component } from "@angular/core";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { CodeExecutionService } from "../../service/code-execution.service";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    FormsModule,
  ],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
})
export class HeaderComponent {
  searchText: string = "";

  constructor(
    private codeExecutionService: CodeExecutionService,
    private router: Router,
  ) {}

  runCode(): void {
    this.codeExecutionService.triggerRunCode();
  }

  goToProblem(): void {
    // Default to problem 0 if searchText is empty
    const problemId = this.searchText ? this.searchText : "0";
    this.router.navigate(["/problem", problemId]);
  }

  // Handle Enter key in search input
  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      this.goToProblem();
    }
  }
}
