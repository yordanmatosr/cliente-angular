import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MenuModule } from 'primeng/menu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { SpecialtyService } from '../../core/services/specialty.service';
import { ClinicianTypeService } from '../../core/services/clinician-type.service';
import { ProfDesignationTypeService } from '../../core/services/prof-designation-type.service';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-specialty',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        TableModule, ButtonModule, DialogModule,
        InputTextModule, SelectModule,
        MenuModule, ConfirmDialogModule,
        ToastModule, ToolbarModule, IconFieldModule, InputIconModule,
        ProgressSpinnerModule
    ],
    templateUrl: './specialty.component.html',
    styleUrl: './specialty.component.scss',
    providers: [ConfirmationService, MessageService]
})
export class SpecialtyComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    private specialtyService = inject(SpecialtyService);
    private clinicianTypeService = inject(ClinicianTypeService);
    private profDesService = inject(ProfDesignationTypeService);
    private confirmService = inject(ConfirmationService);
    private messageService = inject(MessageService);

    specialties: any[] = [];
    loading = true;

    dialogVisible = false;
    editMode = false;
    form: any = this.emptyForm();
    optionsLoading = false;

    clinicianTypes: any[] = [];
    profDesTypes: any[] = [];

    menuItems: MenuItem[] = [];

    ngOnInit() {
        this.loadSpecialties();
    }

    loadSpecialties() {
        this.loading = true;
        this.specialtyService.all().subscribe({
            next: (data: any[]) => {
                this.specialties = data;
                this.loading = false;
            },
            error: (err: any) => {
                this.showError(err);
                this.loading = false;
            }
        });
    }

    openCreate() {
        this.form = this.emptyForm();
        this.editMode = false;
        this.dialogVisible = true;
        this.loadFormOptions();
    }

    openEdit(specialty: any) {
        this.form = {
            specialtyId: specialty.specialtyId,
            specialtyDescription: specialty.specialtyDescription,
            clinicianTypeId: specialty.clinicianTypeId ?? specialty.clinicianType?.typeId,
            profDesignationTypeId: specialty.profDesignationTypeId ?? specialty.profDesignationType?.profDesignationTypeId
        };
        this.editMode = true;
        this.dialogVisible = true;
        this.loadFormOptions();
    }

    private loadFormOptions() {
        if (this.clinicianTypes.length && this.profDesTypes.length) return;
        this.optionsLoading = true;
        forkJoin([
            this.clinicianTypeService.all(),
            this.profDesService.all()
        ]).subscribe({
            next: ([types, profs]: [any[], any[]]) => {
                this.clinicianTypes = types;
                this.profDesTypes = profs;
                if (!this.form.clinicianTypeId && types.length) {
                    this.form.clinicianTypeId = types[0].typeId;
                }
                if (!this.form.profDesignationTypeId && profs.length) {
                    this.form.profDesignationTypeId = profs[0].profDesignationTypeId;
                }
                this.optionsLoading = false;
            },
            error: (err: any) => {
                this.showError(err);
                this.optionsLoading = false;
            }
        });
    }

    save() {
        const request = this.editMode
            ? this.specialtyService.update(this.form)
            : this.specialtyService.create(this.form);

        request.subscribe({
            next: (data: any) => {
                this.messageService.add({
                    severity: 'success',
                    summary: this.editMode ? 'Updated' : 'Created',
                    detail: `${data.specialtyDescription} ${this.editMode ? 'updated' : 'saved'}`
                });
                this.dialogVisible = false;
                this.loadSpecialties();
            },
            error: (err: any) => this.showError(err)
        });
    }

    confirmDelete(specialty: any) {
        this.confirmService.confirm({
            message: `Are you sure you want to delete "${specialty.specialtyDescription}"?`,
            header: 'Delete Specialty',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { severity: 'danger', label: 'Delete' },
            rejectButtonProps: { severity: 'secondary', label: 'Cancel', outlined: true },
            accept: () => {
                this.specialtyService.delete(specialty.specialtyId).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Specialty deleted' });
                        this.loadSpecialties();
                    },
                    error: (err: any) => this.showError(err)
                });
            }
        });
    }

    onGlobalFilter(event: Event) {
        this.dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    setMenuItems(specialty: any) {
        this.menuItems = [
            { label: 'Edit', icon: 'pi pi-pencil', command: () => this.openEdit(specialty) },
            { label: 'Delete', icon: 'pi pi-trash', command: () => this.confirmDelete(specialty) }
        ];
    }

    private emptyForm() {
        return { specialtyId: 0, specialtyDescription: '', clinicianTypeId: null, profDesignationTypeId: null };
    }

    private showError(err: any) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message ?? 'Something went wrong' });
    }
}
