import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-access',
    standalone: true,
    imports: [ButtonModule, RouterModule],
    templateUrl: './access.component.html',
    styleUrl: './access.component.scss'
})
export class AccessComponent {}
