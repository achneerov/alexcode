import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { HeaderComponent } from "./component/header/header.component";
import { BodyComponent } from "./component/body/body.component";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, HeaderComponent, BodyComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  title = "alexcode";
}
