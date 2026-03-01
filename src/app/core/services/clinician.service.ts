import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClinicianService {
    private http = inject(HttpClient);
    private readonly API = `${environment.apiUrl}/tester`;

    all() { return this.http.get<any[]>(this.API); }
    find(id: number) { return this.http.get<any>(`${this.API}/${id}`); }
    create(clinician: any) { return this.http.post<any>(this.API, clinician); }
    update(clinician: any) { return this.http.put<any>(this.API, clinician); }
    delete(id: number) { return this.http.delete<void>(`${this.API}/${id}`); }
    byUser(id: number) { return this.http.get<any[]>(`${this.API}/byuser/${id}`); }
}
