import { Component, inject, OnInit, ViewChild, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { MenuModule } from 'primeng/menu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { ClinicianService } from '../../core/services/clinician.service';
import { OrganizationService } from '../../core/services/organization.service';
import { DepartmentService } from '../../core/services/department.service';
import { SpecialtyService } from '../../core/services/specialty.service';
import { AuthService } from '../../core/services/auth.service';
import { USER_STATUS_INFO, DEFAULT_PASSWORD } from '../../core/constants/status.constants';

@Component({
    selector: 'app-clinician',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        TableModule, ButtonModule, DialogModule,
        InputTextModule, PasswordModule, SelectModule,
        CheckboxModule, TagModule, MenuModule, ConfirmDialogModule,
        ToastModule, ToolbarModule, IconFieldModule, InputIconModule,
        ProgressSpinnerModule
    ],
    templateUrl: './clinician.component.html',
    styleUrl: './clinician.component.scss',
    providers: [ConfirmationService, MessageService]
})
export class ClinicianComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    private router = inject(Router);
    private clinicianService = inject(ClinicianService);
    private orgService = inject(OrganizationService);
    private deptService = inject(DepartmentService);
    private specialtyService = inject(SpecialtyService);
    private authService = inject(AuthService);
    private confirmService = inject(ConfirmationService);
    private messageService = inject(MessageService);
    private destroyRef = inject(DestroyRef);

    clinicians = signal<any[]>([]);
    loading = signal(true);
    searchValue = '';

    dialogVisible = signal(false);
    editMode = signal(false);
    form: any = this.emptyForm();
    optionsLoading = signal(false);

    allOrganizations = signal<any[]>([]);
    allDepartments = signal<any[]>([]);
    filteredDepartments = signal<any[]>([]);
    specialties = signal<any[]>([]);

    menuItems: MenuItem[] = [];

    readonly STATUS_INFO = USER_STATUS_INFO;

    ngOnInit() {
        this.loadClinicians();
    }

    loadClinicians() {
        this.loading.set(true);
        this.clinicianService.all()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any[]) => { this.clinicians.set(data); this.loading.set(false); },
                error: (err: any) => { this.showError(err); this.loading.set(false); }
            });
    }

    openCreate() {
        this.form = this.emptyForm();
        this.editMode.set(false);
        this.dialogVisible.set(true);
        this.loadFormOptions(null);
    }

    openEdit(c: any) {
        this.form = {
            userId: c.userId,
            firstname: c.firstname ?? '',
            middlename: c.middlename ?? '',
            lastname: c.lastname ?? '',
            email: c.email ?? '',
            username: c.username ?? '',
            password: '',
            organizationId: c.organizationId ?? null,
            department: c.departmentId ?? null,
            phoneNumber: c.phoneNumber ? `+${c.phoneNumber}` : '',
            specialtyId: c.specialtyId ?? null,
            isTwoFactorEnabled: c.isTwoFactorEnabled === 1,
            status: c.status ?? 0,
            role: ['user']
        };
        this.editMode.set(true);
        this.dialogVisible.set(true);
        this.loadFormOptions(c.organizationId ?? null);
    }

    private loadFormOptions(selectedOrgId: number | null) {
        this.optionsLoading.set(true);
        const userId = this.authService.currentUser()!.id;
        forkJoin([
            this.orgService.allByUser(userId),
            this.deptService.allByUser(userId),
            this.specialtyService.all()
        ])
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
            next: ([orgs, depts, specs]: [any[], any[], any[]]) => {
                this.allOrganizations.set(orgs);
                this.allDepartments.set(depts);
                this.specialties.set(specs);

                const orgId = selectedOrgId ?? (orgs[0]?.organizationId ?? null);
                if (!this.form.organizationId && orgId) this.form.organizationId = orgId;
                this.filteredDepartments.set(this.filterDepts(this.form.organizationId));
                if (!this.form.department && this.filteredDepartments().length) {
                    this.form.department = this.filteredDepartments()[0].departmentId;
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

    save() {
        const payload = this.buildPayload();
        const request = this.editMode()
            ? this.clinicianService.update(payload)
            : this.clinicianService.create(payload);

        request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data: any) => {
                const name = data.username ?? '';
                this.messageService.add({
                    severity: 'success',
                    summary: this.editMode() ? 'Updated' : 'Created',
                    detail: `${name} ${this.editMode() ? 'updated' : 'saved'}`
                });
                this.dialogVisible.set(false);
                this.loadClinicians();
            },
            error: (err: any) => this.showError(err)
        });
    }

    private buildPayload() {
        const base: any = {
            username: this.form.username,
            email: this.form.email,
            password: this.form.password || DEFAULT_PASSWORD,
            firstname: this.form.firstname,
            middlename: this.form.middlename,
            lastname: this.form.lastname,
            status: this.form.status ?? 0,
            phoneNumber: this.form.phoneNumber || null,
            specialtyId: this.form.specialtyId ?? null,
            department: this.form.department,
            role: ['user'],
            isClinician: true,
            isRegisterClinician: false,
            isTwoFactorEnabled: this.form.isTwoFactorEnabled ? 1 : 0
        };
        if (this.editMode()) {
            base.userId = this.form.userId;
        }
        return base;
    }

    confirmDelete(c: any) {
        const name = this.fullName(c);
        this.confirmService.confirm({
            message: `Are you sure you want to delete "${name}"?`,
            header: 'Delete Clinician',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { severity: 'danger', label: 'Delete' },
            rejectButtonProps: { severity: 'secondary', label: 'Cancel', outlined: true },
            accept: () => {
                this.clinicianService.delete(c.userId)
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe({
                        next: () => {
                            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Clinician deleted' });
                            this.loadClinicians();
                        },
                        error: (err: any) => this.showError(err)
                    });
            }
        });
    }

    fullName(c: any): string {
        return [c.firstname, c.middlename, c.lastname].filter(Boolean).join(' ');
    }

    statusInfo(status: number) {
        return this.STATUS_INFO[status] ?? { label: 'Unknown', severity: 'secondary' };
    }

    goToDetail(c: any) {
        this.router.navigate(['/tester/clinician-detail', c.userId]);
    }

    onGlobalFilter(event: Event) {
        this.dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    clearFilter() {
        this.searchValue = '';
        this.dt.filterGlobal('', 'contains');
    }

    setMenuItems(c: any) {
        this.menuItems = [
            { label: 'Edit', icon: 'pi pi-pencil', command: () => this.openEdit(c) },
            { label: 'Delete', icon: 'pi pi-trash', command: () => this.confirmDelete(c) }
        ];
    }

    get canSave(): boolean {
        return !!(this.form.firstname?.trim() && this.form.email?.trim() &&
            this.form.username?.trim() && this.form.department);
    }

    private emptyForm() {
        return {
            userId: 0,
            firstname: '', middlename: '', lastname: '',
            email: '', username: '', password: DEFAULT_PASSWORD,
            organizationId: null, department: null,
            phoneNumber: '',
            specialtyId: null,
            isTwoFactorEnabled: false, status: 0,
            role: ['user']
        };
    }

    private showError(err: any) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message ?? 'Something went wrong' });
    }
}
