import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProblemService } from '../../service/problem.service';

@Component({
  selector: 'app-problem',
  standalone: true,
  template: ''
})
export class ProblemComponent {
  constructor(private route: ActivatedRoute, private problemService: ProblemService) {
    this.route.params.subscribe(params => this.problemService.loadProblem(Number(params['id'])));
  }
}
