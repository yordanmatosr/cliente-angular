import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { IdleService } from '../../core/services/idle.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule, PasswordModule, CheckboxModule, MessageModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    private auth = inject(AuthService);
    private idle = inject(IdleService);
    private router = inject(Router);

    username = '';
    password = '';
    loading = false;
    errorMessage = '';

    login(): void {
        if (!this.username || !this.password) return;
        this.loading = true;
        this.errorMessage = '';

        this.auth.login(this.username, this.password).subscribe({
            next: () => {
                this.idle.start();
                this.router.navigate(['/dashboard']);
            },
            error: () => {
                this.errorMessage = 'Invalid username or password.';
                this.loading = false;
            }
        });
    }
}
