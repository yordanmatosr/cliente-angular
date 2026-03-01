import { Routes } from '@angular/router';

export default [
    { path: 'departments', loadComponent: () => import('./department.component').then(m => m.DepartmentComponent) }
] as Routes;
