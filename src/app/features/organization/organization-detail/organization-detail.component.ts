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
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { OrganizationService } from '../../../core/services/organization.service';
import { DepartmentService } from '../../../core/services/department.service';
import { FileService } from '../../../core/services/file.service';
import { EmailService } from '../../../core/services/email.service';

@Component({
    selector: 'app-organization-detail',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        TableModule, ButtonModule, DialogModule,
        InputTextModule, TextareaModule, TagModule, MenuModule,
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
    private fileService = inject(FileService);
    private emailService = inject(EmailService);
    private confirmService = inject(ConfirmationService);
    private messageService = inject(MessageService);
    private destroyRef = inject(DestroyRef);

    organization = signal<any>(null);
    loading = signal(true);
    logoUrl = signal<string | null>(null);

    departments = signal<any[]>([]);
    deptLoading = signal(true);
    deptDialogVisible = signal(false);
    deptEditMode = signal(false);
    deptForm: any = this.emptyDeptForm();
    deptMenuItems: MenuItem[] = [];

    examList = signal<any[]>([]);
    examUrlLoading = signal(false);

    sendEmailVisible = signal(false);
    emailAddress = '';
    sendingEmail = signal(false);

    organizationId!: number;

    ngOnInit() {
        this.organizationId = +this.route.snapshot.paramMap.get('id')!;
        this.loadOrganization();
        this.loadDepartments();
        this.loadExamUrls();
        this.loadLogo();
    }

    // --- Organization ---

    loadOrganization() {
        this.loading.set(true);
        this.orgService.find(this.organizationId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any) => { this.organization.set(data); this.loading.set(false); },
                error: (err: any) => { this.showError(err); this.loading.set(false); }
            });
    }

    private loadLogo() {
        this.fileService.getOrganizationLogo(this.organizationId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (blob: Blob) => {
                    if (blob.size > 0) this.logoUrl.set(URL.createObjectURL(blob));
                }
            });
    }

    toggleDisable() {
        this.orgService.updateIsDisabled(this.organizationId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any) => {
                    this.messageService.add({ severity: 'success', summary: 'Updated', detail: data.message });
                    this.loadOrganization();
                },
                error: (err: any) => this.showError(err)
            });
    }

    // --- Departments ---

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

    // --- Exam URLs ---

    private loadExamUrls() {
        this.examUrlLoading.set(true);
        this.orgService.urlencryptedlist(this.organizationId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any[]) => { this.examList.set(data); this.examUrlLoading.set(false); },
                error: (err: any) => { this.showError(err); this.examUrlLoading.set(false); }
            });
    }

    async downloadPdf() {
        const { default: jsPDF } = await import('jspdf');
        const doc = this.buildPdfDoc(jsPDF);
        doc.save(`${this.organization()!.organizationName}_report.pdf`);
    }

    openSendEmail() {
        this.emailAddress = '';
        this.sendEmailVisible.set(true);
    }

    sendEmail() {
        if (!this.emailAddress) return;
        this.sendingEmail.set(true);
        this.buildPdfBlob().then(blob => {
            const org = this.organization()!;
            this.emailService.sendAttachmentEmail(
                blob as File,
                this.emailAddress,
                `${org.organizationName}_report.pdf`,
                org.organizationName
            )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any) => {
                    this.messageService.add({ severity: 'success', summary: 'Sent', detail: data.message });
                    this.sendEmailVisible.set(false);
                    this.sendingEmail.set(false);
                },
                error: (err: any) => { this.showError(err); this.sendingEmail.set(false); }
            });
        });
    }

    private async buildPdfBlob(): Promise<Blob> {
        const { default: jsPDF } = await import('jspdf');
        return this.buildPdfDoc(jsPDF).output('blob');
    }

    private buildPdfDoc(jsPDF: any) {
        const org = this.organization()!;
        const exams = this.examList();
        const doc = new jsPDF({ orientation: 'p', unit: 'cm', format: 'a4', compress: true, putOnlyUsedFonts: true });
        let x = 1.5, y = 2;
        const pageHeight = doc.internal.pageSize.height - 3.0;
        doc.setFontSize(11).setFont(undefined, 'bold').text(org.organizationName, x, y, { maxWidth: 18 });
        y = 3;
        doc.setFontSize(9).setFont(undefined, 'bold').text("Exam's links", x, y, { maxWidth: 8 });
        y += 0.8;
        for (const exam of exams) {
            doc.setFontSize(9).setFont(undefined, 'normal').setTextColor(0, 0, 0)
                .textWithLink(exam.examName, x, y, { maxWidth: 18, url: exam.url });
            y += 0.5;
            doc.setFontSize(9).setTextColor(0, 0, 255)
                .textWithLink(exam.url, x, y, { maxWidth: 18, url: exam.url });
            y += 1.8;
            if (y >= pageHeight) { doc.addPage(); y = 2; }
        }
        return doc;
    }

    // --- Helpers ---

    private emptyDeptForm() {
        return { departmentId: 0, departmentName: '', description: '', organizationId: 0 };
    }

    private showError(err: any) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message ?? 'Something went wrong' });
    }
}
