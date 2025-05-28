import { Routes } from "@angular/router";
import { BodyComponent } from "./component/body/body.component";

export const routes: Routes = [
  { path: "", redirectTo: "problem/0", pathMatch: "full" },
  { path: "problem/:id", component: BodyComponent },
];
