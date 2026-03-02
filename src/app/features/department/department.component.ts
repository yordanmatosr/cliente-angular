import { Component, inject, OnInit, ViewChild, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MenuModule } from 'primeng/menu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { DepartmentService } from '../../core/services/department.service';
import { OrganizationService } from '../../core/services/organization.service';
import { AuthService } from '../../core/services/auth.service';
import { ROLE } from '../../core/constants/roles.constants';

@Component({
    selector: 'app-department',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        TableModule, ButtonModule, DialogModule,
        InputTextModule, TextareaModule, SelectModule,
        MenuModule, ConfirmDialogModule,
        ToastModule, ToolbarModule, IconFieldModule, InputIconModule,
        ProgressSpinnerModule
    ],
    templateUrl: './department.component.html',
    styleUrl: './department.component.scss',
    providers: [ConfirmationService, MessageService]
})
export class DepartmentComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    private router = inject(Router);
    private deptService = inject(DepartmentService);
    private orgService = inject(OrganizationService);
    private authService = inject(AuthService);
    private confirmService = inject(ConfirmationService);
    private messageService = inject(MessageService);
    private destroyRef = inject(DestroyRef);

    departments = signal<any[]>([]);
    loading = signal(true);
    searchValue = '';
    organizations = signal<any[]>([]);
    isSuper = signal(false);

    dialogVisible = signal(false);
    editMode = signal(false);
    form: any = this.emptyForm();

    menuItems: MenuItem[] = [];

    ngOnInit() {
        this.isSuper.set(this.authService.hasRole(ROLE.SUPER));
        this.loadDepartments();
        this.loadOrganizations();
    }

    loadDepartments() {
        this.loading.set(true);
        const userId = this.authService.currentUser()!.id;
        this.deptService.allByUser(userId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any[]) => { this.departments.set(data); this.loading.set(false); },
                error: (err: any) => { this.showError(err); this.loading.set(false); }
            });
    }

    loadOrganizations() {
        const userId = this.authService.currentUser()!.id;
        this.orgService.allByUser(userId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any[]) => this.organizations.set(data)
            });
    }

    openCreate() {
        const orgs = this.organizations();
        const defaultOrgId = !this.isSuper() && orgs.length ? orgs[0].organizationId : null;
        this.form = { ...this.emptyForm(), organizationId: defaultOrgId };
        this.editMode.set(false);
        this.dialogVisible.set(true);
    }

    openEdit(dept: any) {
        this.form = {
            departmentId: dept.departmentId,
            departmentName: dept.departmentName,
            description: dept.description,
            organizationId: dept.organization?.organizationId ?? dept.organizationId
        };
        this.editMode.set(true);
        this.dialogVisible.set(true);
    }

    save() {
        const request = this.editMode()
            ? this.deptService.update(this.form)
            : this.deptService.create(this.form);

        request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data: any) => {
                this.messageService.add({
                    severity: 'success',
                    summary: this.editMode() ? 'Updated' : 'Created',
                    detail: `${data.departmentName} ${this.editMode() ? 'updated' : 'saved'}`
                });
                this.dialogVisible.set(false);
                this.loadDepartments();
            },
            error: (err: any) => this.showError(err)
        });
    }

    confirmDelete(dept: any) {
        this.confirmService.confirm({
            message: `Are you sure you want to delete "${dept.departmentName}"?`,
            header: 'Delete Department',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { severity: 'danger', label: 'Delete' },
            rejectButtonProps: { severity: 'secondary', label: 'Cancel', outlined: true },
            accept: () => {
                this.deptService.delete(dept.departmentId)
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe({
                        next: () => {
                            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Department deleted' });
                            this.loadDepartments();
                        },
                        error: (err: any) => this.showError(err)
                    });
            }
        });
    }

    onGlobalFilter(event: Event) {
        this.dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    clearFilter() {
        this.searchValue = '';
        this.dt.filterGlobal('', 'contains');
    }

    goToDetail(dept: any) {
        this.router.navigate(['/group/group-detail', dept.departmentId]);
    }

    setMenuItems(dept: any) {
        this.menuItems = [
            { label: 'Edit', icon: 'pi pi-pencil', command: () => this.openEdit(dept) },
            { label: 'Delete', icon: 'pi pi-trash', command: () => this.confirmDelete(dept) }
        ];
    }

    private emptyForm() {
        return { departmentId: 0, departmentName: '', description: '', organizationId: null };
    }

    private showError(err: any) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message ?? 'Something went wrong' });
    }
}
