import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { OrganizationService } from '../../../core/services/organization.service';

@Component({
    selector: 'app-organization-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, ProgressSpinnerModule, ToastModule],
    templateUrl: './organization-detail.component.html',
    styleUrl: './organization-detail.component.scss',
    providers: [MessageService]
})
export class OrganizationDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private orgService = inject(OrganizationService);
    private messageService = inject(MessageService);

    organization: any = null;
    loading = true;
    organizationId!: number;

    ngOnInit() {
        this.organizationId = +this.route.snapshot.paramMap.get('id')!;
        this.loadOrganization();
    }

    loadOrganization() {
        this.loading = true;
        this.orgService.find(this.organizationId).subscribe({
            next: (data: any) => {
                this.organization = data;
                this.loading = false;
            },
            error: (err: any) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message });
                this.loading = false;
            }
        });
    }
}
