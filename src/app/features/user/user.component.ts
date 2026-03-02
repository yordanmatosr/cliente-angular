import { Component, inject, OnInit, ViewChild, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
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
import { ROLE } from '../../core/constants/roles.constants';
import { DEFAULT_PASSWORD } from '../../core/constants/status.constants';

@Component({
    selector: 'app-user',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule,
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

    private router = inject(Router);
    private userService = inject(UserService);
    private roleService = inject(RoleService);
    private orgService = inject(OrganizationService);
    private deptService = inject(DepartmentService);
    private authService = inject(AuthService);
    private messageService = inject(MessageService);
    private destroyRef = inject(DestroyRef);

    users = signal<any[]>([]);
    loading = signal(true);
    searchValue = '';
    isSuper = signal(false);

    dialogVisible = signal(false);
    editMode = signal(false);
    form: any = this.emptyForm();
    optionsLoading = signal(false);
    availableRoles = signal<{ label: string; value: string }[]>([]);
    allOrganizations = signal<any[]>([]);
    allDepartments = signal<any[]>([]);
    filteredDepartments = signal<any[]>([]);

    resetPasswordVisible = signal(false);
    resetTarget: any = null;
    newPassword = '';
    confirmPassword = '';
    resetting = signal(false);

    menuItems: MenuItem[] = [];

    readonly ROLE_SEVERITY: Record<string, 'danger' | 'warn' | 'success' | 'info' | 'secondary'> = {
        [ROLE.SUPER]: 'danger',
        [ROLE.SUPERADMIN]: 'warn',
        [ROLE.ADMIN]: 'success',
        [ROLE.USER]: 'info'
    };

    ngOnInit() {
        this.isSuper.set(this.authService.hasRole(ROLE.SUPER));
        this.loadUsers();
    }

    loadUsers() {
        this.loading.set(true);
        this.userService.all()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any[]) => {
                    this.users.set(data.filter((u: any) => !u.roles?.includes(ROLE.USER)));
                    this.loading.set(false);
                },
                error: (err: any) => { this.showError(err); this.loading.set(false); }
            });
    }

    openCreate() {
        this.form = this.emptyForm();
        this.editMode.set(false);
        this.dialogVisible.set(true);
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
            role: user.roles?.[0] ?? ROLE.ADMIN,
            isTwoFactorEnabled: !!user.isTwoFactorEnabled,
            status: user.status ?? 0,
            isClinician: user.isClinician ?? false
        };
        this.editMode.set(true);
        this.dialogVisible.set(true);
        this.loadFormOptions(orgId);
    }

    private loadFormOptions(selectedOrgId: number | null) {
        this.optionsLoading.set(true);
        const userId = this.authService.currentUser()!.id;
        forkJoin([
            this.roleService.all(),
            this.orgService.allByUser(userId),
            this.deptService.allByUser(userId)
        ])
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
            next: ([rolesData, orgs, depts]: [any, any[], any[]]) => {
                const rolesList: string[] = rolesData?.roles ?? (Array.isArray(rolesData) ? rolesData : []);
                this.availableRoles.set(
                    rolesList
                        .filter((r: string) => r !== ROLE.USER && r !== ROLE.KIOSK)
                        .map((r: string) => ({ label: r.toUpperCase(), value: r }))
                );

                this.allOrganizations.set(orgs);
                this.allDepartments.set(depts);

                const orgId = selectedOrgId ?? (orgs[0]?.organizationId ?? null);
                if (!this.form.organizationId && orgId) this.form.organizationId = orgId;
                this.filteredDepartments.set(this.filterDepts(this.form.organizationId));
                if (!this.form.department && this.filteredDepartments().length) {
                    this.form.department = this.filteredDepartments()[0].departmentId;
                }
                if (!this.form.role && this.availableRoles().length) {
                    this.form.role = this.availableRoles()[0].value;
                }
                this.optionsLoading.set(false);
            },
            error: (err: any) => { this.showError(err); this.optionsLoading.set(false); }
        });
    }

    onOrgChange() {
        this.filteredDepartments.set(this.filterDepts(this.form.organizationId));
        this.form.department = this.filteredDepartments()[0]?.departmentId ?? null;
    }

    private filterDepts(orgId: number | null): any[] {
        if (!orgId) return this.allDepartments();
        return this.allDepartments().filter(d => d.organization?.organizationId === orgId);
    }

    get isFormRoleSuper(): boolean {
        return this.form.role === ROLE.SUPER;
    }

    save() {
        const payload = this.buildPayload();
        const request = this.editMode()
            ? this.userService.update(payload)
            : this.userService.create(payload);

        request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data: any) => {
                this.messageService.add({
                    severity: 'success',
                    summary: this.editMode() ? 'Updated' : 'Created',
                    detail: `${data.username} ${this.editMode() ? 'updated' : 'saved'}`
                });
                this.dialogVisible.set(false);
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
        if (this.editMode()) base.userId = this.form.userId;
        if (!this.editMode()) base.password = DEFAULT_PASSWORD;
        return base;
    }

    toggleDisable(user: any) {
        this.userService.updateIsDisabled(user.userId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
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
        this.resetPasswordVisible.set(true);
    }

    get resetPasswordValid(): boolean {
        return this.newPassword.length > 3 &&
            this.confirmPassword.length > 3 &&
            this.newPassword === this.confirmPassword;
    }

    doResetPassword() {
        if (!this.resetPasswordValid || !this.resetTarget) return;
        this.resetting.set(true);
        this.userService.password_Reset(this.resetTarget.userId, this.newPassword)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any) => {
                    this.messageService.add({ severity: 'success', summary: 'Password Reset', detail: data.message });
                    this.resetPasswordVisible.set(false);
                    this.resetting.set(false);
                },
                error: (err: any) => { this.showError(err); this.resetting.set(false); }
            });
    }

    roleSeverity(role: string): 'danger' | 'warn' | 'success' | 'info' | 'secondary' {
        return this.ROLE_SEVERITY[role] ?? 'secondary';
    }

    goToDetail(user: any) {
        this.router.navigate(['/user/user-detail', user.userId]);
    }

    onGlobalFilter(event: Event) {
        this.dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    clearFilter() {
        this.searchValue = '';
        this.dt.filterGlobal('', 'contains');
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
            role: ROLE.ADMIN, isTwoFactorEnabled: false,
            status: 0, isClinician: false
        };
    }

    private showError(err: any) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message ?? 'Something went wrong' });
    }
}
