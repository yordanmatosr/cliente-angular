import { Injectable } from '@angular/core';
import { of } from 'rxjs';

// Static local data — no backend endpoint (same as React)
const SPECIALTY_TYPES = [
    { hcpType: 'APP' },
    { hcpType: 'CHIRO' },
    { hcpType: 'DENTIST' },
    { hcpType: 'DIETETIC PRACTITIONERS' },
    { hcpType: 'NURSE' },
    { hcpType: 'OPTOMETRIST' },
    { hcpType: 'PHARMACIST' },
    { hcpType: 'PHYSICIAN' },
    { hcpType: 'PODIATRIST' },
    { hcpType: 'STUDENT' },
];

@Injectable({ providedIn: 'root' })
export class SpecialtyTypeService {
    all() { return of(SPECIALTY_TYPES); }
}
