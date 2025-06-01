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

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    // When problemData changes, sanitize the HTML description
    if (this.problemData && this.problemData.description) {
      this.sanitizedDescription = this.sanitizer.bypassSecurityTrustHtml(
        this.problemData.description,
      );
    }
  }
}
