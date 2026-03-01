import { Routes } from '@angular/router';

export default [
    { path: 'clinicians', loadComponent: () => import('./clinician.component').then(m => m.ClinicianComponent) }
] as Routes;
