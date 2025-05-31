import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class CodeExecutionService {
  private runCodeSubject = new Subject<void>();

  // Observable that components can subscribe to
  runCode$ = this.runCodeSubject.asObservable();

  // Method to trigger code execution
  triggerRunCode(): void {
    this.runCodeSubject.next();
  }
}
