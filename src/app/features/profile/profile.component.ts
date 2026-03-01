import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        ButtonModule, CardModule, InputTextModule, PasswordModule,
        TagModule, ToastModule, ProgressSpinnerModule, DividerModule
    ],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss',
    providers: [MessageService]
})
export class ProfileComponent implements OnInit {
    private authService = inject(AuthService);
    private userService = inject(UserService);
    private messageService = inject(MessageService);

    loading = true;
    saving = false;
    savingPwd = false;

    userData: any = null;

    // Edit form fields
    form = {
        firstname: '',
        middlename: '',
        lastname: '',
        email: '',
        address: '',
        phoneNumber: ''
    };

    // Password form
    pwdForm = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    };

    get isUser(): boolean {
        return this.userData?.roles?.[0] === 'user';
    }

    get fullName(): string {
        return [this.userData?.firstname, this.userData?.middlename, this.userData?.lastname]
            .filter(Boolean).join(' ');
    }

    ngOnInit() {
        const user = this.authService.currentUser()!;
        this.userService.find(user.id).subscribe({
            next: (data: any) => {
                this.userData = data;
                this.form = {
                    firstname: data.firstname ?? '',
                    middlename: data.middlename ?? '',
                    lastname: data.lastname ?? '',
                    email: data.email ?? '',
                    address: data.address ?? '',
                    phoneNumber: data.phoneNumber ?? ''
                };
                this.loading = false;
            },
            error: (err: any) => {
                this.showError(err);
                this.loading = false;
            }
        });
    }

    saveProfile() {
        if (this.saving) return;
        this.saving = true;
        const payload = {
            userId: this.userData.userId,
            username: this.userData.username,
            email: this.form.email,
            password: '',
            firstname: this.form.firstname,
            middlename: this.form.middlename,
            lastname: this.form.lastname,
            address: this.form.address,
            status: this.userData.status,
            resetToken: this.userData.resetToken ?? null,
            resetTokenCreationDate: this.userData.resetTokenCreationDate,
            department: this.userData.department?.departmentId ?? this.userData.department,
            role: this.userData.roles,
            phoneNumber: this.form.phoneNumber || null,
            specialtyId: this.userData.specialtyId,
            isTwoFactorEnabled: this.userData.isTwoFactorEnabled ? 1 : 0
        };

        this.userService.update(payload).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Profile updated successfully.' });
                this.saving = false;
            },
            error: (err: any) => { this.showError(err); this.saving = false; }
        });
    }

    changePassword() {
        if (this.savingPwd) return;
        if (this.pwdForm.newPassword !== this.pwdForm.confirmPassword) {
            this.messageService.add({ severity: 'warn', summary: 'Mismatch', detail: 'New passwords do not match.' });
            return;
        }
        if (this.pwdForm.newPassword.length < 6) {
            this.messageService.add({ severity: 'warn', summary: 'Too short', detail: 'Password must be at least 6 characters.' });
            return;
        }
        this.savingPwd = true;
        this.userService.updatePassword(this.pwdForm.oldPassword, this.pwdForm.newPassword).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Done', detail: 'Password changed successfully.' });
                this.pwdForm = { oldPassword: '', newPassword: '', confirmPassword: '' };
                this.savingPwd = false;
            },
            error: (err: any) => { this.showError(err); this.savingPwd = false; }
        });
    }

    private showError(err: any) {
        this.messageService.add({
            severity: 'error', summary: 'Error',
            detail: err.error?.message ?? err.message ?? 'Something went wrong.'
        });
    }
}
