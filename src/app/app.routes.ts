import { Routes } from '@angular/router';
import { ProblemComponent } from './component/problem/problem.component';

export const routes: Routes = [
  { path: '', redirectTo: 'problem/0', pathMatch: 'full' },
  {
    path: 'problem/:id',
    component: ProblemComponent,
    data: {
      renderMode: 'dynamic'
    }
  }
];
