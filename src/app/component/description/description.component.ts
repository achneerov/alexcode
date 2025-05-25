import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProblemService } from '../../service/problem.service';
import { Observable } from 'rxjs';
import { Problem } from '../../service/problem.service';

@Component({
  selector: 'app-description',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="description-container" *ngIf="problem$ | async as problem">
      <h2>{{ problem.title }}</h2>
      <div class="description">{{ problem.description }}</div>
    </div>
  `,
  styles: [`
    .description-container { padding: 16px; }
    .description { white-space: pre-line; }
  `]
})
export class DescriptionComponent {
  problem$: Observable<Problem | null>;

  constructor(private problemService: ProblemService) {
    this.problem$ = this.problemService.currentProblem$;
  }
}
