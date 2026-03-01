import { Routes } from '@angular/router';

export default [
    { path: 'reportss', loadComponent: () => import('./reports.component').then(m => m.ReportsComponent) }
] as Routes;
