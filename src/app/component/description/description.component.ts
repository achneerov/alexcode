import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Problem, TestCase } from "../../interface/problem.interface";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

@Component({
  selector: "app-description",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./description.component.html",
  styleUrl: "./description.component.scss",
})
export class DescriptionComponent implements OnChanges {
  @Input() problemData: Problem | undefined;
  sanitizedDescription: SafeHtml = "";
  sanitizedSolution: SafeHtml = "";
  activeTab: "description" | "solution" = "description";

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.problemData) {
      // Sanitize description HTML
      if (this.problemData.description) {
        this.sanitizedDescription = this.sanitizer.bypassSecurityTrustHtml(
          this.problemData.description,
        );
      }

      // Sanitize solution HTML if available
      if (this.problemData.solution) {
        this.sanitizedSolution = this.sanitizer.bypassSecurityTrustHtml(
          this.problemData.solution,
        );
      }
    }
  }
}
