import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService, MenuItem } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { RoleService } from '../../core/services/role.service';
import { OrganizationService } from '../../core/services/organization.service';
import { DepartmentService } from '../../core/services/department.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-user',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        TableModule, ButtonModule, DialogModule,
        InputTextModule, PasswordModule, SelectModule, CheckboxModule,
        TagModule, MenuModule,
        ToastModule, ToolbarModule, IconFieldModule, InputIconModule,
        ProgressSpinnerModule
    ],
    templateUrl: './user.component.html',
    styleUrl: './user.component.scss',
    providers: [MessageService]
})
export class UserComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    private userService = inject(UserService);
    private roleService = inject(RoleService);
    private orgService = inject(OrganizationService);
    private deptService = inject(DepartmentService);
    private authService = inject(AuthService);
    private messageService = inject(MessageService);

    users: any[] = [];
    loading = true;
    isSuper = false;

    // Edit dialog
    dialogVisible = false;
    editMode = false;
    form: any = this.emptyForm();
    optionsLoading = false;
    availableRoles: { label: string; value: string }[] = [];
    allOrganizations: any[] = [];
    allDepartments: any[] = [];
    filteredDepartments: any[] = [];

    // Reset password dialog
    resetPasswordVisible = false;
    resetTarget: any = null;
    newPassword = '';
    confirmPassword = '';
    resetting = false;

    menuItems: MenuItem[] = [];

    readonly ROLE_SEVERITY: Record<string, 'danger' | 'warn' | 'success' | 'info' | 'secondary'> = {
        super: 'danger',
        superadmin: 'warn',
        admin: 'success',
        user: 'info'
    };

    ngOnInit() {
        this.isSuper = this.authService.hasRole('super');
        this.loadUsers();
    }

    loadUsers() {
        this.loading = true;
        this.userService.all().subscribe({
            next: (data: any[]) => {
                this.users = data.filter((u: any) => u.roles?.[0] !== 'user');
                this.loading = false;
            },
            error: (err: any) => {
                this.showError(err);
                this.loading = false;
            }
        });
    }

    openCreate() {
        this.form = this.emptyForm();
        this.editMode = false;
        this.dialogVisible = true;
        this.loadFormOptions(null);
    }

    openEdit(user: any) {
        const orgId = user.department?.organization?.organizationId ?? null;
        const deptId = user.department?.departmentId ?? null;
        this.form = {
            userId: user.userId,
            firstname: user.firstname ?? '',
            middlename: user.middlename ?? '',
            lastname: user.lastname ?? '',
            email: user.email ?? '',
            username: user.username ?? '',
            address: user.address ?? '',
            organizationId: orgId,
            department: deptId,
            role: user.roles?.[0] ?? 'admin',
            isTwoFactorEnabled: !!user.isTwoFactorEnabled,
            status: user.status ?? 0,
            isClinician: user.isClinician ?? false
        };
        this.editMode = true;
        this.dialogVisible = true;
        this.loadFormOptions(orgId);
    }

    private loadFormOptions(selectedOrgId: number | null) {
        this.optionsLoading = true;
        const userId = this.authService.currentUser!.id;
        forkJoin([
            this.roleService.all(),
            this.orgService.allByUser(userId),
            this.deptService.allByUser(userId)
        ]).subscribe({
            next: ([rolesData, orgs, depts]: [any, any[], any[]]) => {
                const rolesList: string[] = rolesData?.roles ?? (Array.isArray(rolesData) ? rolesData : []);
                this.availableRoles = rolesList
                    .filter((r: string) => r !== 'user' && r !== 'kiosk')
                    .map((r: string) => ({ label: r.toUpperCase(), value: r }));

                this.allOrganizations = orgs;
                this.allDepartments = depts;

                const orgId = selectedOrgId ?? (orgs[0]?.organizationId ?? null);
                if (!this.form.organizationId && orgId) this.form.organizationId = orgId;
                this.filteredDepartments = this.filterDepts(this.form.organizationId);
                if (!this.form.department && this.filteredDepartments.length) {
                    this.form.department = this.filteredDepartments[0].departmentId;
                }
                if (!this.form.role && this.availableRoles.length) {
                    this.form.role = this.availableRoles[0].value;
                }
                this.optionsLoading = false;
            },
            error: (err: any) => {
                this.showError(err);
                this.optionsLoading = false;
            }
        });
    }

    onOrgChange() {
        this.filteredDepartments = this.filterDepts(this.form.organizationId);
        this.form.department = this.filteredDepartments[0]?.departmentId ?? null;
    }

    private filterDepts(orgId: number | null): any[] {
        if (!orgId) return this.allDepartments;
        return this.allDepartments.filter(d => d.organization?.organizationId === orgId);
    }

    get isFormRoleSuper(): boolean {
        return this.form.role === 'super';
    }

    save() {
        const payload = this.buildPayload();
        const request = this.editMode
            ? this.userService.update(payload)
            : this.userService.create(payload);

        request.subscribe({
            next: (data: any) => {
                this.messageService.add({
                    severity: 'success',
                    summary: this.editMode ? 'Updated' : 'Created',
                    detail: `${data.username} ${this.editMode ? 'updated' : 'saved'}`
                });
                this.dialogVisible = false;
                this.loadUsers();
            },
            error: (err: any) => this.showError(err)
        });
    }

    private buildPayload() {
        const base: any = {
            username: this.form.username,
            email: this.form.email,
            firstname: this.form.firstname,
            middlename: this.form.middlename,
            lastname: this.form.lastname,
            address: this.form.address,
            status: this.form.status ?? 0,
            isClinician: this.form.isClinician ?? false,
            phoneNumber: null,
            resetToken: null,
            resetTokenCreationDate: null,
            department: this.isFormRoleSuper ? null : this.form.department,
            role: [this.form.role],
            isRegisterClinician: 0,
            userModel: '',
            isTwoFactorEnabled: this.form.isTwoFactorEnabled ? 1 : 0
        };
        if (this.editMode) base.userId = this.form.userId;
        if (!this.editMode) base.password = '12345678';
        return base;
    }

    toggleDisable(user: any) {
        this.userService.updateIsDisabled(user.userId).subscribe({
            next: (data: any) => {
                this.messageService.add({ severity: 'success', summary: 'Updated', detail: data.message });
                this.loadUsers();
            },
            error: (err: any) => this.showError(err)
        });
    }

    openResetPassword(user: any) {
        this.resetTarget = user;
        this.newPassword = '';
        this.confirmPassword = '';
        this.resetPasswordVisible = true;
    }

    get resetPasswordValid(): boolean {
        return this.newPassword.length > 3 &&
            this.confirmPassword.length > 3 &&
            this.newPassword === this.confirmPassword;
    }

    doResetPassword() {
        if (!this.resetPasswordValid || !this.resetTarget) return;
        this.resetting = true;
        this.userService.password_Reset(this.resetTarget.userId, this.newPassword).subscribe({
            next: (data: any) => {
                this.messageService.add({ severity: 'success', summary: 'Password Reset', detail: data.message });
                this.resetPasswordVisible = false;
                this.resetting = false;
            },
            error: (err: any) => {
                this.showError(err);
                this.resetting = false;
            }
        });
    }

    roleSeverity(role: string): 'danger' | 'warn' | 'success' | 'info' | 'secondary' {
        return this.ROLE_SEVERITY[role] ?? 'secondary';
    }

    onGlobalFilter(event: Event) {
        this.dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    setMenuItems(user: any) {
        this.menuItems = [
            { label: 'Edit', icon: 'pi pi-pencil', command: () => this.openEdit(user) },
            { label: 'Reset Password', icon: 'pi pi-key', command: () => this.openResetPassword(user) },
            { separator: true },
            {
                label: user.isDisabled ? 'Enable' : 'Disable',
                icon: user.isDisabled ? 'pi pi-check-circle' : 'pi pi-ban',
                command: () => this.toggleDisable(user)
            }
        ];
    }

    private emptyForm() {
        return {
            userId: 0, firstname: '', middlename: '', lastname: '',
            email: '', username: '', address: '',
            organizationId: null, department: null,
            role: 'admin', isTwoFactorEnabled: false,
            status: 0, isClinician: false
        };
    }

    private showError(err: any) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message ?? 'Something went wrong' });
    }
}
