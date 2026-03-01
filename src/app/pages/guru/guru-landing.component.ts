import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../core/services/auth.service';
import { IdleService } from '../../core/services/idle.service';

@Component({
    selector: 'app-guru-landing',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule, PasswordModule, MessageModule],
    templateUrl: './guru-landing.component.html',
    styleUrl: './guru-landing.component.scss'
})
export class GuruLandingComponent {
    private auth = inject(AuthService);
    private idle = inject(IdleService);
    private router = inject(Router);

    username = '';
    password = '';
    loading = false;
    errorMessage = '';

    get isValid(): boolean {
        return !!this.username && !!this.password;
    }

    login() {
        if (!this.isValid || this.loading) return;
        this.loading = true;
        this.errorMessage = '';

        this.auth.login(this.username, this.password).subscribe({
            next: () => {
                this.idle.start();
                this.router.navigate(['/dashboard']);
            },
            error: (err: any) => {
                this.errorMessage = err.error?.message ?? 'Invalid username or password.';
                this.loading = false;
            }
        });
    }
}
