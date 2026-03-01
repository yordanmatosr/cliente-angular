import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { UserService } from '../../core/services/user.service';

@Component({
    selector: 'app-password-reset',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, PasswordModule, MessageModule],
    templateUrl: './password-reset.component.html',
    styleUrl: './password-reset.component.scss'
})
export class PasswordResetComponent implements OnInit {
    private userService = inject(UserService);
    private router = inject(Router);

    password = '';
    confirmPassword = '';
    loading = false;
    errorMessage = '';
    private token = '';

    get isValid(): boolean {
        return !!this.password && this.password === this.confirmPassword && this.password.length >= 6;
    }

    ngOnInit() {
        const params = window.location.search;
        const split = params.split('=');
        this.token = split[1] ?? '';
    }

    reset() {
        if (!this.isValid || this.loading) return;
        this.loading = true;
        this.errorMessage = '';

        this.userService.passwordReset(this.token, this.password).subscribe({
            next: () => {
                this.router.navigate(['/auth/login']);
            },
            error: (err: any) => {
                this.errorMessage = err.error?.message ?? 'Invalid or expired token. Please request a new reset link.';
                this.loading = false;
            }
        });
    }
}
