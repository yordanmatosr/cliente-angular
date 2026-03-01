import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfDesignationTypeService {
    private http = inject(HttpClient);
    private readonly API = `${environment.apiUrl}/prof`;

    all() { return this.http.get<any[]>(this.API); }
    byOrganization(id: number) { return this.http.get<any[]>(`${this.API}/byorganization/${id}`); }
}
