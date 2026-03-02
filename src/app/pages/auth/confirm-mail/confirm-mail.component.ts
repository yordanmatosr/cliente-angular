import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-confirm-mail',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule],
    templateUrl: './confirm-mail.component.html',
    styleUrl: './confirm-mail.component.scss'
})
export class ConfirmMailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    email = '';

    ngOnInit() {
        this.email = this.route.snapshot.paramMap.get('email') ?? '';
    }
}
