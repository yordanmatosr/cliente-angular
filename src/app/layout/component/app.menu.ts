import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of model; track item.label) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul>`
})
export class AppMenu implements OnInit {
    private auth = inject(AuthService);

    model: MenuItem[] = [];

    ngOnInit() {
        const user = this.auth.currentUser();
        const roles = user?.roles ?? [];

        const hasRole = (...r: string[]) => r.some(role => roles.includes(role));

        this.model = [
            {
                label: 'Home',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-chart-pie', routerLink: ['/dashboard'] }
                ]
            },
            // Admin sections — hidden for kiosk and user roles
            ...(hasRole('super', 'superadmin', 'admin') ? [{
                label: 'Management',
                items: [
                    ...(hasRole('super') ? [
                        { label: 'Companies', icon: 'pi pi-fw pi-building', routerLink: ['/agency/agencies'] }
                    ] : []),
                    ...(hasRole('superadmin', 'admin') ? [
                        { label: 'Departments', icon: 'pi pi-fw pi-users', routerLink: ['/group/groups'] }
                    ] : []),
                    { label: 'Specialties', icon: 'pi pi-fw pi-tag', routerLink: ['/specialty/specialties'] },
                    ...(hasRole('super', 'superadmin') ? [
                        { label: 'Admins', icon: 'pi pi-fw pi-user-edit', routerLink: ['/user/users'] }
                    ] : []),
                    { label: 'Testers', icon: 'pi pi-fw pi-id-card', routerLink: ['/tester/testers'] }
                ]
            }] : []),
            // Reports — admin only
            ...(hasRole('super', 'superadmin', 'admin') ? [{
                label: 'Analytics',
                items: [
                    { label: 'Reports', icon: 'pi pi-fw pi-file-pdf', routerLink: ['/reports'] }
                ]
            }] : []),
            // Resources
            ...(hasRole('super', 'superadmin', 'admin') ? [{
                label: 'Support',
                items: [
                    { label: 'Resources', icon: 'pi pi-fw pi-comments', routerLink: ['/contactsupport'] }
                ]
            }] : [])
        ];
    }
}
