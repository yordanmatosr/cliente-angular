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
import { TagModule } from 'primeng/tag';
import { MenuModule } from 'primeng/menu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { OrganizationService } from '../../core/services/organization.service';
import { FileService } from '../../core/services/file.service';
import { EmailService } from '../../core/services/email.service';
import { MAX_LOGO_SIZE_BYTES } from '../../core/constants/status.constants';

@Component({
    selector: 'app-organization',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        TableModule, ButtonModule, DialogModule,
        InputTextModule, TextareaModule, SelectModule,
        TagModule, MenuModule, ConfirmDialogModule,
        ToastModule, ToolbarModule, IconFieldModule, InputIconModule,
        ProgressSpinnerModule
    ],
    templateUrl: './organization.component.html',
    styleUrl: './organization.component.scss',
    providers: [ConfirmationService, MessageService]
})
export class OrganizationComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    private router = inject(Router);
    private orgService = inject(OrganizationService);
    private fileService = inject(FileService);
    private emailService = inject(EmailService);
    private confirmService = inject(ConfirmationService);
    private messageService = inject(MessageService);
    private destroyRef = inject(DestroyRef);

    organizations = signal<any[]>([]);
    loading = signal(true);
    searchValue = '';

    // Form dialog
    dialogVisible = signal(false);
    editMode = signal(false);
    form: any = this.emptyForm();
    subscriptionModels = signal<{ label: string; value: string }[]>([]);
    logoPreview = signal<string | null>(null);
    logoFile: File | null = null;

    // Exam URLs dialog
    examUrlDialogVisible = signal(false);
    selectedOrg = signal<any>(null);
    examList = signal<any[]>([]);
    examUrlLoading = signal(false);

    // Send email dialog
    sendEmailDialogVisible = signal(false);
    emailAddress = '';
    sendingEmail = signal(false);

    menuItems: MenuItem[] = [];

    ngOnInit() {
        this.loadOrganizations();
        this.loadSubscriptionModels();
    }

    loadOrganizations() {
        this.loading.set(true);
        this.orgService.all()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any[]) => { this.organizations.set(data); this.loading.set(false); },
                error: (err: any) => { this.showError(err); this.loading.set(false); }
            });
    }

    loadSubscriptionModels() {
        this.orgService.organizationModel()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any[]) => {
                    this.subscriptionModels.set(data.map((m: any) => ({
                        label: m.organizationModelValue,
                        value: m.organizationModelText
                    })));
                }
            });
    }

    // --- CRUD ---

    openCreate() {
        this.form = this.emptyForm();
        this.logoPreview.set(null);
        this.logoFile = null;
        this.editMode.set(false);
        this.dialogVisible.set(true);
    }

    openEdit(org: any) {
        this.form = { ...org };
        this.logoPreview.set(null);
        this.logoFile = null;
        this.editMode.set(true);
        this.fileService.getOrganizationLogo(org.organizationId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (blob: Blob) => {
                    if (blob.size > 0) this.logoPreview.set(URL.createObjectURL(blob));
                }
            });
        this.dialogVisible.set(true);
    }

    save() {
        const request = this.editMode()
            ? this.orgService.update(this.form)
            : this.orgService.create(this.form);

        request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data: any) => {
                this.uploadLogoIfSelected(data.organizationId ?? this.form.organizationId);
                this.messageService.add({
                    severity: 'success',
                    summary: this.editMode() ? 'Updated' : 'Created',
                    detail: `${data.organizationName} ${this.editMode() ? 'updated' : 'saved'}`
                });
                this.dialogVisible.set(false);
                this.loadOrganizations();
            },
            error: (err: any) => this.showError(err)
        });
    }

    confirmDelete(org: any) {
        this.confirmService.confirm({
            message: `Are you sure you want to delete "${org.organizationName}"?`,
            header: 'Delete Company',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { severity: 'danger', label: 'Delete' },
            rejectButtonProps: { severity: 'secondary', label: 'Cancel', outlined: true },
            accept: () => {
                this.orgService.delete(org.organizationId)
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe({
                        next: () => {
                            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Company deleted' });
                            this.loadOrganizations();
                        },
                        error: (err: any) => this.showError(err)
                    });
            }
        });
    }

    toggleDisable(org: any) {
        this.orgService.updateIsDisabled(org.organizationId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any) => {
                    this.messageService.add({ severity: 'success', summary: 'Updated', detail: data.message });
                    this.loadOrganizations();
                },
                error: (err: any) => this.showError(err)
            });
    }

    // --- Logo ---

    onLogoSelect(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        if (file.size > MAX_LOGO_SIZE_BYTES) {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Logo must be less than 400kb' });
            return;
        }
        this.logoFile = file;
        this.logoPreview.set(URL.createObjectURL(file));
    }

    private uploadLogoIfSelected(organizationId: number) {
        if (!this.logoFile) return;
        this.fileService.uploadLogo(this.logoFile, organizationId, false)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any) => this.messageService.add({ severity: 'success', summary: 'Logo saved', detail: data.message }),
                error: (err: any) => this.showError(err)
            });
    }

    // --- Exam URLs ---

    openExamUrls(org: any) {
        this.selectedOrg.set(org);
        this.examList.set([]);
        this.examUrlLoading.set(true);
        this.examUrlDialogVisible.set(true);
        this.orgService.urlencryptedlist(org.organizationId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any[]) => { this.examList.set(data); this.examUrlLoading.set(false); },
                error: (err: any) => { this.showError(err); this.examUrlLoading.set(false); }
            });
    }

    openSendEmail() {
        this.emailAddress = '';
        this.sendEmailDialogVisible.set(true);
    }

    sendEmail() {
        if (!this.emailAddress || !this.selectedOrg()) return;
        this.sendingEmail.set(true);
        this.buildPdfBlob().then(blob => {
            this.emailService.sendAttachmentEmail(
                blob as File,
                this.emailAddress,
                `${this.selectedOrg()!.organizationName}_report.pdf`,
                this.selectedOrg()!.organizationName
            )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any) => {
                    this.messageService.add({ severity: 'success', summary: 'Sent', detail: data.message });
                    this.sendEmailDialogVisible.set(false);
                    this.sendingEmail.set(false);
                },
                error: (err: any) => { this.showError(err); this.sendingEmail.set(false); }
            });
        });
    }

    async downloadPdf() {
        const { default: jsPDF } = await import('jspdf');
        const doc = this.buildPdfDoc(jsPDF);
        doc.save(`${this.selectedOrg()!.organizationName}_report.pdf`);
    }

    private async buildPdfBlob(): Promise<Blob> {
        const { default: jsPDF } = await import('jspdf');
        return this.buildPdfDoc(jsPDF).output('blob');
    }

    private buildPdfDoc(jsPDF: any) {
        const org = this.selectedOrg()!;
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

    goToDetail(org: any) {
        this.router.navigate(['/agency/agency-detail', org.organizationId]);
    }

    onGlobalFilter(event: Event) {
        this.dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    clearFilter() {
        this.searchValue = '';
        this.dt.filterGlobal('', 'contains');
    }

    setMenuItems(org: any) {
        this.menuItems = [
            { label: 'Edit', icon: 'pi pi-pencil', command: () => this.openEdit(org) },
            { label: 'Delete', icon: 'pi pi-trash', command: () => this.confirmDelete(org) },
            { separator: true },
            { label: 'Exam URLs', icon: 'pi pi-link', command: () => this.openExamUrls(org) },
            { label: org.isDisabled ? 'Enable' : 'Disable', icon: org.isDisabled ? 'pi pi-check-circle' : 'pi pi-ban', command: () => this.toggleDisable(org) }
        ];
    }

    private emptyForm() {
        return { organizationId: 0, organizationName: '', location: '', description: '', orgSubscriptionModel: '', isLogo: false };
    }

    private showError(err: any) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message ?? 'Something went wrong' });
    }
}
