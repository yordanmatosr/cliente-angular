import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DepartmentService } from '../../../core/services/department.service';

@Component({
    selector: 'app-department-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, ProgressSpinnerModule, ToastModule],
    templateUrl: './department-detail.component.html',
    styleUrl: './department-detail.component.scss',
    providers: [MessageService]
})
export class DepartmentDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private deptService = inject(DepartmentService);
    private messageService = inject(MessageService);
    private destroyRef = inject(DestroyRef);

    department = signal<any>(null);
    loading = signal(true);
    departmentId!: number;

    ngOnInit() {
        this.departmentId = +this.route.snapshot.paramMap.get('id')!;
        this.loadDepartment();
    }

    loadDepartment() {
        this.loading.set(true);
        this.deptService.find(this.departmentId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any) => { this.department.set(data); this.loading.set(false); },
                error: (err: any) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message });
                    this.loading.set(false);
                }
            });
    }
}
