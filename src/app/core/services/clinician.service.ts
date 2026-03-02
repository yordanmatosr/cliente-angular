import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClinicianService {
    private http = inject(HttpClient);
    private readonly API = `${environment.apiUrl}/user`;

    all() { return this.http.get<any[]>(`${this.API}/testers`); }
    find(id: number) { return this.http.get<any>(`${this.API}/tester/${id}`); }
    create(clinician: any) { return this.http.post<any>(`${this.API}/tester`, clinician); }
    update(clinician: any) { return this.http.put<any>(`${this.API}/tester`, clinician); }
    delete(id: number) { return this.http.delete<void>(`${this.API}/${id}`); }
    byDepartment(departmentId: number) { return this.http.get<any[]>(`${this.API}/testers/bydepartment/${departmentId}`); }
}
