import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-guru-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule, MessageModule, ToastModule],
    templateUrl: './guru-register.component.html',
    styleUrl: './guru-register.component.scss',
    providers: [MessageService]
})
export class GuruRegisterComponent {
    private auth = inject(AuthService);
    private messageService = inject(MessageService);
    private router = inject(Router);

    loading = false;

    form = {
        username: '',
        email: '',
        firstname: '',
        middlename: '',
        lastname: '',
        phoneNumber: '',
        address: ''
    };

    get isValid(): boolean {
        return !!this.form.username && !!this.form.email && !!this.form.phoneNumber;
    }

    register() {
        if (!this.isValid || this.loading) return;
        this.loading = true;

        this.auth.signupGuruTest({
            ...this.form,
            specialtyId: 0,
            orgId: 0
        }).subscribe({
            next: (data: any) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Registered',
                    detail: `User ${data.username ?? this.form.username} registered! Check your email for login credentials.`,
                    life: 4000
                });
                setTimeout(() => this.router.navigate(['/guru']), 2500);
            },
            error: (err: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error?.message ?? 'Registration failed. Please try again.'
                });
                this.loading = false;
            }
        });
    }
}
