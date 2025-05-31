import { Component, OnInit, OnDestroy } from "@angular/core";
import {
  PyodideService,
  ConsoleOutputLine,
} from "../../service/pyodide.service";
import { Subscription } from "rxjs";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-console",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./console.component.html",
  styleUrl: "./console.component.scss",
})
export class ConsoleComponent implements OnInit, OnDestroy {
  consoleOutput: ConsoleOutputLine[] = [];
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
}
