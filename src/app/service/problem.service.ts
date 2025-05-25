import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

export interface Problem {
  title: string;
  description: string;
  function_params_names: string[];
  test_cases: Array<{
    id: number;
    input: any;
    output: any;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class ProblemService {
  private currentProblem = new BehaviorSubject<Problem | null>(null);
  currentProblem$ = this.currentProblem.asObservable();

  constructor(private http: HttpClient) {}

  loadProblem(id: number) {
    this.http.get<Problem>(`/problem/${id}.json`).subscribe(
      problem => this.currentProblem.next(problem)
    );
  }
}
