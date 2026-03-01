import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { FileService } from '../../core/services/file.service';
import { OrganizationService } from '../../core/services/organization.service';

@Component({
    selector: 'app-contact',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        ButtonModule, CardModule, TableModule, TabsModule, SelectModule,
        ToastModule, ProgressSpinnerModule, TooltipModule
    ],
    templateUrl: './contact.component.html',
    styleUrl: './contact.component.scss',
    providers: [MessageService]
})
export class ContactComponent implements OnInit {
    private authService = inject(AuthService);
    private userService = inject(UserService);
    private fileService = inject(FileService);
    private orgService = inject(OrganizationService);
    private messageService = inject(MessageService);

    role = '';
    loading = true;
    files: any[] = [];
    orgs: any[] = [];
    selectedUploadOrgId: number | null = null;
    uploading = false;
    activeTab = 'faq';

    get isSuper() { return this.role === 'super'; }
    get isAdmin() { return ['super', 'superadmin', 'admin'].includes(this.role); }
    get isUser() { return this.role === 'user'; }
    get showFaq() { return this.isAdmin; }
    get showStudyGuides() { return this.isSuper || (this.isUser && this.files.length > 0); }
    get showTestDefs() { return this.isAdmin; }

    ngOnInit() {
        const user = this.authService.currentUser()!;
        this.role = user.roles[0];
        this.activeTab = this.isAdmin ? 'faq' : 'guides';

        if (this.isSuper) {
            Promise.all([
                this.fileService.all().toPromise(),
                this.orgService.all().toPromise()
            ]).then(([files, orgs]) => {
                this.files = files ?? [];
                this.orgs = (orgs ?? []).map((o: any) => ({ label: o.organizationName, value: o.organizationId }));
                this.loading = false;
            }).catch(() => { this.loading = false; });
        } else if (this.isUser) {
            this.userService.find(user.id).subscribe({
                next: (userData: any) => {
                    const orgId = userData.department?.organization?.organizationId;
                    if (orgId) {
                        this.fileService.allByOrganization(orgId).subscribe({
                            next: (files: any[]) => { this.files = files ?? []; this.loading = false; },
                            error: () => { this.loading = false; }
                        });
                    } else {
                        this.loading = false;
                    }
                },
                error: () => { this.loading = false; }
            });
        } else {
            this.loading = false;
        }
    }

    openFile(row: any) {
        const filename = (row.url as string).substring(row.url.lastIndexOf('/') + 1);
        this.fileService.getFile(filename).subscribe({
            next: (blob: Blob) => {
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                setTimeout(() => URL.revokeObjectURL(url), 10000);
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not open file.' })
        });
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            this.messageService.add({ severity: 'warn', summary: 'Invalid', detail: 'Only PDF files are allowed.' });
            return;
        }
        if (this.isSuper && !this.selectedUploadOrgId) {
            this.messageService.add({ severity: 'warn', summary: 'Required', detail: 'Please select a company first.' });
            return;
        }
        this.uploading = true;
        this.fileService.upload(file, this.selectedUploadOrgId!).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Uploaded', detail: 'Study guide uploaded successfully.' });
                this.fileService.all().subscribe({ next: (files: any[]) => { this.files = files ?? []; } });
                this.uploading = false;
                input.value = '';
            },
            error: (err: any) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'Upload failed.' });
                this.uploading = false;
            }
        });
    }
}
