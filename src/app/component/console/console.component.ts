import { Component, OnInit, OnDestroy } from "@angular/core";
import { PyodideService } from "../../service/pyodide.service";
import { Subscription } from "rxjs";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: "app-console",
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: "./console.component.html",
  styleUrl: "./console.component.scss",
})
export class ConsoleComponent implements OnInit, OnDestroy {
  consoleOutput: string[] = [];
  private subscription: Subscription | null = null;

  constructor(private pyodideService: PyodideService) {}

  ngOnInit(): void {
    this.subscription = this.pyodideService
      .getConsoleOutput()
      .subscribe((output) => (this.consoleOutput = output));
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  clearConsole(): void {
    this.pyodideService.clearConsoleOutput();
  }
}
