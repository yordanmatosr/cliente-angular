import { Routes } from '@angular/router';

export default [
    { path: '', loadComponent: () => import('./department.component').then(m => m.DepartmentComponent) },
    { path: 'group-detail/:id', loadComponent: () => import('./department-detail/department-detail.component').then(m => m.DepartmentDetailComponent) }
] as Routes;
