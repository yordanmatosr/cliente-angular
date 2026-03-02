import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { UserService } from '../../../core/services/user.service';

@Component({
    selector: 'app-forgot-username',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule, MessageModule],
    templateUrl: './forgot-username.component.html',
    styleUrl: './forgot-username.component.scss'
})
export class ForgotUsernameComponent {
    private userService = inject(UserService);
    private router = inject(Router);

    email = '';
    loading = false;
    errorMessage = '';

    send() {
        if (!this.email || this.loading) return;
        this.loading = true;
        this.errorMessage = '';

        this.userService.forgotUsername(this.email).subscribe({
            next: () => {
                this.router.navigate(['/auth/confirm-mail', this.email]);
            },
            error: (err: any) => {
                this.errorMessage = err.error?.message ?? 'Could not send username reminder. Please try again.';
                this.loading = false;
            }
        });
    }
}
