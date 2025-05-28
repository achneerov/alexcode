import { Component, Input, OnInit } from "@angular/core";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { Problem } from "../../interface/problem.interface";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-ide",
  standalone: true,
  imports: [MatInputModule, MatFormFieldModule, CommonModule],
  templateUrl: "./ide.component.html",
  styleUrl: "./ide.component.scss",
})
export class IdeComponent implements OnInit {
  @Input() problemData: Problem | undefined;
  functionTemplate: string = "";

  ngOnInit(): void {
    this.generateFunctionTemplate();
  }

  generateFunctionTemplate(): string {
    if (this.problemData && this.problemData.function_params_names) {
      const paramList = this.problemData.function_params_names.join(", ");
      return `def function(${paramList}):`;
    }
    return "";
  }
}
