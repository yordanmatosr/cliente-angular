import { Component, inject, OnInit, ViewChild, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MenuModule } from 'primeng/menu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { OrganizationService } from '../../../core/services/organization.service';
import { DepartmentService } from '../../../core/services/department.service';

@Component({
    selector: 'app-organization-detail',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        TableModule, ButtonModule, DialogModule,
        InputTextModule, TextareaModule, MenuModule,
        ConfirmDialogModule, ProgressSpinnerModule, ToastModule
    ],
    templateUrl: './organization-detail.component.html',
    styleUrl: './organization-detail.component.scss',
    providers: [ConfirmationService, MessageService]
})
export class OrganizationDetailComponent implements OnInit {
    @ViewChild('deptTable') deptTable!: Table;

    private route = inject(ActivatedRoute);
    private orgService = inject(OrganizationService);
    private deptService = inject(DepartmentService);
    private confirmService = inject(ConfirmationService);
    private messageService = inject(MessageService);
    private destroyRef = inject(DestroyRef);

    organization = signal<any>(null);
    loading = signal(true);
    organizationId!: number;

    departments = signal<any[]>([]);
    deptLoading = signal(true);
    deptDialogVisible = signal(false);
    deptEditMode = signal(false);
    deptForm: any = this.emptyDeptForm();
    deptMenuItems: MenuItem[] = [];

    ngOnInit() {
        this.organizationId = +this.route.snapshot.paramMap.get('id')!;
        this.loadOrganization();
        this.loadDepartments();
    }

    loadOrganization() {
        this.loading.set(true);
        this.orgService.find(this.organizationId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any) => { this.organization.set(data); this.loading.set(false); },
                error: (err: any) => { this.showError(err); this.loading.set(false); }
            });
    }

    loadDepartments() {
        this.deptLoading.set(true);
        this.deptService.byOrganization(this.organizationId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any[]) => { this.departments.set(data); this.deptLoading.set(false); },
                error: (err: any) => { this.showError(err); this.deptLoading.set(false); }
            });
    }

    openCreateDept() {
        this.deptForm = { ...this.emptyDeptForm(), organizationId: this.organizationId };
        this.deptEditMode.set(false);
        this.deptDialogVisible.set(true);
    }

    openEditDept(dept: any) {
        this.deptForm = {
            departmentId: dept.departmentId,
            departmentName: dept.departmentName,
            description: dept.description,
            organizationId: this.organizationId
        };
        this.deptEditMode.set(true);
        this.deptDialogVisible.set(true);
    }

    saveDept() {
        const request = this.deptEditMode()
            ? this.deptService.update(this.deptForm)
            : this.deptService.create(this.deptForm);

        request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data: any) => {
                this.messageService.add({
                    severity: 'success',
                    summary: this.deptEditMode() ? 'Updated' : 'Created',
                    detail: `${data.departmentName} ${this.deptEditMode() ? 'updated' : 'saved'}`
                });
                this.deptDialogVisible.set(false);
                this.loadDepartments();
            },
            error: (err: any) => this.showError(err)
        });
    }

    confirmDeleteDept(dept: any) {
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

    setDeptMenuItems(dept: any) {
        this.deptMenuItems = [
            { label: 'Edit', icon: 'pi pi-pencil', command: () => this.openEditDept(dept) },
            { label: 'Delete', icon: 'pi pi-trash', command: () => this.confirmDeleteDept(dept) }
        ];
    }

    private emptyDeptForm() {
        return { departmentId: 0, departmentName: '', description: '', organizationId: 0 };
    }

    private showError(err: any) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message ?? 'Something went wrong' });
    }
}
