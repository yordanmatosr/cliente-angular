import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
    private http = inject(HttpClient);
    private readonly API = `${environment.apiUrl}/department`;

    all() { return this.http.get<any[]>(this.API); }
    find(id: number) { return this.http.get<any>(`${this.API}/${id}`); }
    create(department: any) { return this.http.post<any>(this.API, department); }
    update(department: any) { return this.http.put<any>(this.API, department); }
    delete(id: number) { return this.http.delete<void>(`${this.API}/${id}`); }
    byOrganization(id: number) { return this.http.get<any[]>(`${this.API}/byorganization/${id}`); }
    allByUser(id: number) { return this.http.get<any[]>(`${this.API}/byuser/${id}`); }
}
