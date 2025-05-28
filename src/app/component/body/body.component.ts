import { Component, OnInit } from "@angular/core";
import { ConsoleComponent } from "../console/console.component";
import { DescriptionComponent } from "../description/description.component";
import { IdeComponent } from "../ide/ide.component";
import { AngularSplitModule } from "angular-split";
import { ActivatedRoute } from "@angular/router";
import { ProblemDataService } from "../../service/problem-data.service";

@Component({
  selector: "app-body",
  imports: [
    ConsoleComponent,
    DescriptionComponent,
    IdeComponent,
    AngularSplitModule,
  ],
  templateUrl: "./body.component.html",
  styleUrl: "./body.component.scss",
})
export class BodyComponent implements OnInit {
  problemData: any;

  constructor(
    private route: ActivatedRoute,
    private problemDataService: ProblemDataService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const problemId = params.get("id");
      if (problemId) {
        this.problemDataService.getProblemData(problemId).subscribe({
          next: (data) => {
            this.problemData = data;
          },
          error: (err) => {
            console.error(
              "Error loading problem data for body component:",
              err,
            );
          },
        });
      }
    });
  }
}
