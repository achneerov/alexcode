import { Component } from "@angular/core";
import { ConsoleComponent } from "../console/console.component";
import { DescriptionComponent } from "../description/description.component";
import { IdeComponent } from "../ide/ide.component";
import { AngularSplitModule } from 'angular-split';

@Component({
  selector: "app-body",
  imports: [ConsoleComponent, DescriptionComponent, IdeComponent, AngularSplitModule],
  templateUrl: "./body.component.html",
  styleUrl: "./body.component.scss",
})
export class BodyComponent {}
