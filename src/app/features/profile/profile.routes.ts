import { Routes } from '@angular/router';

export default [
    { path: 'profiles', loadComponent: () => import('./profile.component').then(m => m.ProfileComponent) }
] as Routes;
