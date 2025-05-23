import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProblemService } from '../../service/problem.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatInputModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  searchText: string = '';

  constructor(
    private router: Router,
    private problemService: ProblemService
  ) {}

  goToProblem() {
    if (this.searchText) {
      this.router.navigate(['/problem', this.searchText]);
      this.problemService.loadProblem(Number(this.searchText));
    }
  }
}
