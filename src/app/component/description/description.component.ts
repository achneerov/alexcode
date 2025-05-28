import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Problem, TestCase } from "../../interface/problem.interface";

@Component({
  selector: "app-description",
  imports: [CommonModule],
  templateUrl: "./description.component.html",
  styleUrl: "./description.component.scss",
})
export class DescriptionComponent {
  @Input() problemData: Problem | undefined;
}
