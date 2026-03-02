import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { SpecialtyService } from '../../../core/services/specialty.service';
import { ClinicianService } from '../../../core/services/clinician.service';
import { TagSeverity, USER_STATUS_INFO } from '../../../core/constants/status.constants';

@Component({
    selector: 'app-specialty-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, TagModule, TableModule, ProgressSpinnerModule, ToastModule, TooltipModule],
    templateUrl: './specialty-detail.component.html',
    styleUrl: './specialty-detail.component.scss',
    providers: [MessageService]
})
export class SpecialtyDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private specialtyService = inject(SpecialtyService);
    private clinicianService = inject(ClinicianService);
    private messageService = inject(MessageService);
    private destroyRef = inject(DestroyRef);

    specialty = signal<any>(null);
    loading = signal(true);
    clinicians = signal<any[]>([]);
    clinicianLoading = signal(false);

    readonly STATUS_INFO = USER_STATUS_INFO;

    specialtyId!: number;

    ngOnInit() {
        this.specialtyId = +this.route.snapshot.paramMap.get('id')!;
        this.loadSpecialty();
    }

    private loadSpecialty() {
        this.loading.set(true);
        this.specialtyService.find(this.specialtyId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any) => {
                    this.specialty.set(data);
                    this.loading.set(false);
                    this.loadClinicians();
                },
                error: (err: any) => { this.showError(err); this.loading.set(false); }
            });
    }

    private loadClinicians() {
        this.clinicianLoading.set(true);
        this.clinicianService.all()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any[]) => {
                    const filtered = data.filter(c => c.specialtyId === this.specialtyId);
                    this.clinicians.set(filtered);
                    this.clinicianLoading.set(false);
                },
                error: (err: any) => { this.showError(err); this.clinicianLoading.set(false); }
            });
    }

    fullName(c: any): string {
        return [c?.firstname, c?.middlename, c?.lastname].filter(Boolean).join(' ');
    }

    statusInfo(status: number) {
        return this.STATUS_INFO[status] ?? { label: 'Unknown', severity: 'secondary' as TagSeverity };
    }

    private showError(err: any) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message ?? 'Something went wrong' });
    }
}
