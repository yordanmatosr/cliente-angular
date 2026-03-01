import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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

    private orgService = inject(OrganizationService);
    private fileService = inject(FileService);
    private emailService = inject(EmailService);
    private confirmService = inject(ConfirmationService);
    private messageService = inject(MessageService);

    organizations: any[] = [];
    loading = true;

    // Form dialog
    dialogVisible = false;
    editMode = false;
    form: any = this.emptyForm();
    subscriptionModels: { label: string; value: string }[] = [];
    logoPreview: string | null = null;
    logoFile: File | null = null;

    // Exam URLs dialog
    examUrlDialogVisible = false;
    selectedOrg: any = null;
    examList: any[] = [];
    examUrlLoading = false;

    // Send email dialog
    sendEmailDialogVisible = false;
    emailAddress = '';
    sendingEmail = false;

    // Actions menu (single shared instance)
    menuItems: MenuItem[] = [];

    ngOnInit() {
        this.loadOrganizations();
        this.loadSubscriptionModels();
    }

    loadOrganizations() {
        this.loading = true;
        this.orgService.all().subscribe({
            next: (data: any[]) => {
                this.organizations = data;
                this.loading = false;
            },
            error: (err: any) => {
                this.showError(err);
                this.loading = false;
            }
        });
    }

    loadSubscriptionModels() {
        this.orgService.organizationModel().subscribe({
            next: (data: any[]) => {
                this.subscriptionModels = data.map((m: any) => ({
                    label: m.organizationModelValue,
                    value: m.organizationModelText
                }));
            }
        });
    }

    // --- CRUD ---

    openCreate() {
        this.form = this.emptyForm();
        this.logoPreview = null;
        this.logoFile = null;
        this.editMode = false;
        this.dialogVisible = true;
    }

    openEdit(org: any) {
        this.form = { ...org };
        this.logoPreview = null;
        this.logoFile = null;
        this.editMode = true;
        this.fileService.getOrganizationLogo(org.organizationId).subscribe({
            next: (blob: Blob) => {
                if (blob.size > 0) this.logoPreview = URL.createObjectURL(blob);
            }
        });
        this.dialogVisible = true;
    }

    save() {
        const request = this.editMode
            ? this.orgService.update(this.form)
            : this.orgService.create(this.form);

        request.subscribe({
            next: (data: any) => {
                this.uploadLogoIfSelected(data.organizationId ?? this.form.organizationId);
                this.messageService.add({
                    severity: 'success',
                    summary: this.editMode ? 'Updated' : 'Created',
                    detail: `${data.organizationName} ${this.editMode ? 'updated' : 'saved'}`
                });
                this.dialogVisible = false;
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
                this.orgService.delete(org.organizationId).subscribe({
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
        this.orgService.updateIsDisabled(org.organizationId).subscribe({
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
        if (file.size > 400 * 1024) {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Logo must be less than 400kb' });
            return;
        }
        this.logoFile = file;
        this.logoPreview = URL.createObjectURL(file);
    }

    private uploadLogoIfSelected(organizationId: number) {
        if (!this.logoFile) return;
        this.fileService.uploadLogo(this.logoFile, organizationId, false).subscribe({
            next: (data: any) => this.messageService.add({ severity: 'success', summary: 'Logo saved', detail: data.message }),
            error: (err: any) => this.showError(err)
        });
    }

    // --- Exam URLs ---

    openExamUrls(org: any) {
        this.selectedOrg = org;
        this.examList = [];
        this.examUrlLoading = true;
        this.examUrlDialogVisible = true;
        this.orgService.urlencryptedlist(org.organizationId).subscribe({
            next: (data: any[]) => {
                this.examList = data;
                this.examUrlLoading = false;
            },
            error: (err: any) => {
                this.showError(err);
                this.examUrlLoading = false;
            }
        });
    }

    openSendEmail() {
        this.emailAddress = '';
        this.sendEmailDialogVisible = true;
    }

    sendEmail() {
        if (!this.emailAddress || !this.selectedOrg) return;
        this.sendingEmail = true;
        this.buildPdfBlob().then(blob => {
            this.emailService.sendAttachmentEmail(
                blob as File,
                this.emailAddress,
                `${this.selectedOrg.organizationName}_report.pdf`,
                this.selectedOrg.organizationName
            ).subscribe({
                next: (data: any) => {
                    this.messageService.add({ severity: 'success', summary: 'Sent', detail: data.message });
                    this.sendEmailDialogVisible = false;
                    this.sendingEmail = false;
                },
                error: (err: any) => {
                    this.showError(err);
                    this.sendingEmail = false;
                }
            });
        });
    }

    async downloadPdf() {
        const { default: jsPDF } = await import('jspdf');
        const doc = this.buildPdfDoc(jsPDF);
        doc.save(`${this.selectedOrg.organizationName}_report.pdf`);
    }

    private async buildPdfBlob(): Promise<Blob> {
        const { default: jsPDF } = await import('jspdf');
        return this.buildPdfDoc(jsPDF).output('blob');
    }

    private buildPdfDoc(jsPDF: any) {
        const doc = new jsPDF({ orientation: 'p', unit: 'cm', format: 'a4', compress: true, putOnlyUsedFonts: true });
        let x = 1.5, y = 2;
        const pageHeight = doc.internal.pageSize.height - 3.0;
        doc.setFontSize(11).setFont(undefined, 'bold').text(this.selectedOrg.organizationName, x, y, { maxWidth: 18 });
        y = 3;
        doc.setFontSize(9).setFont(undefined, 'bold').text("Exam's links", x, y, { maxWidth: 8 });
        y += 0.8;
        for (const exam of this.examList) {
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

    // --- Table filter ---

    onGlobalFilter(event: Event) {
        this.dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    // --- Actions menu ---

    setMenuItems(org: any) {
        this.menuItems = [
            { label: 'Edit', icon: 'pi pi-pencil', command: () => this.openEdit(org) },
            { label: 'Delete', icon: 'pi pi-trash', command: () => this.confirmDelete(org) },
            { separator: true },
            { label: 'Exam URLs', icon: 'pi pi-link', command: () => this.openExamUrls(org) },
            { label: org.isDisabled ? 'Enable' : 'Disable', icon: org.isDisabled ? 'pi pi-check-circle' : 'pi pi-ban', command: () => this.toggleDisable(org) }
        ];
    }

    // --- Helpers ---

    private emptyForm() {
        return { organizationId: 0, organizationName: '', location: '', description: '', orgSubscriptionModel: '', isLogo: false };
    }

    private showError(err: any) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message ?? 'Something went wrong' });
    }
}
