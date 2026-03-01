import { Routes } from '@angular/router';

export default [
    { path: '', loadComponent: () => import('./user.component').then(m => m.UserComponent) }
] as Routes;
