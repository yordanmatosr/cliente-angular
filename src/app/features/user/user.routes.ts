import { Routes } from '@angular/router';

export default [
    { path: '', redirectTo: 'users', pathMatch: 'full' },
    { path: 'users', loadComponent: () => import('./user.component').then(m => m.UserComponent) },
    { path: 'user-detail/:id', loadComponent: () => import('./user-detail/user-detail.component').then(m => m.UserDetailComponent) }
] as Routes;
