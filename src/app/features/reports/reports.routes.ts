import { Routes } from '@angular/router';

export default [
    { path: '', loadComponent: () => import('./reports.component').then(m => m.ReportsComponent) }
] as Routes;
