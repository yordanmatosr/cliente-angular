import { Routes } from '@angular/router';

export default [
    { path: 'exams', loadComponent: () => import('./exam.component').then(m => m.ExamComponent) }
] as Routes;
