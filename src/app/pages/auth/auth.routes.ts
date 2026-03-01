import { Routes } from '@angular/router';
import { AccessComponent } from './access.component';
import { LoginComponent } from './login.component';
import { ErrorComponent } from './error.component';

export default [
    { path: 'login', component: LoginComponent },
    { path: 'access', component: AccessComponent },
    { path: 'error', component: ErrorComponent },
    { path: '', redirectTo: 'login', pathMatch: 'full' }
] as Routes;
