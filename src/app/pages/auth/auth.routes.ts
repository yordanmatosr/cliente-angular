import { Routes } from '@angular/router';
import { AccessComponent } from './access.component';
import { LoginComponent } from './login.component';
import { ErrorComponent } from './error.component';
import { DirectLoginComponent } from './direct-login.component';
import { KioskLoginComponent } from './kiosk-login.component';

export default [
    { path: 'login', component: LoginComponent },
    { path: 'access', component: AccessComponent },
    { path: 'error', component: ErrorComponent },
    { path: 'loginexam', component: DirectLoginComponent },
    { path: 'kiosk', component: KioskLoginComponent },
    { path: '', redirectTo: 'login', pathMatch: 'full' }
] as Routes;
