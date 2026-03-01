import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RoleService {
    private http = inject(HttpClient);
    private readonly API = `${environment.apiUrl}/role`;

    all() { return this.http.get<any[]>(this.API); }
}
