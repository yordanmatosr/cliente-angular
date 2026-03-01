import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Notfound } from './app/pages/notfound/notfound';
import { authGuard } from './app/core/guards/auth.guard';
import { roleGuard } from './app/core/guards/role.guard';

export const appRoutes: Routes = [
    // Public routes
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: 'guru', loadChildren: () => import('./app/pages/guru/guru.routes') },
    { path: 'notfound', component: Notfound },

    // Protected routes — all require auth
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadChildren: () => import('./app/features/dashboard/dashboard.routes')
            },
            {
                path: 'agency',
                canActivate: [roleGuard],
                data: { roles: ['super'] },
                loadChildren: () => import('./app/features/organization/organization.routes')
            },
            {
                path: 'group',
                canActivate: [roleGuard],
                data: { roles: ['superadmin', 'admin'] },
                loadChildren: () => import('./app/features/department/department.routes')
            },
            {
                path: 'specialty',
                canActivate: [roleGuard],
                data: { roles: ['super', 'superadmin', 'admin'] },
                loadChildren: () => import('./app/features/specialty/specialty.routes')
            },
            {
                path: 'user',
                canActivate: [roleGuard],
                data: { roles: ['super', 'superadmin'] },
                loadChildren: () => import('./app/features/user/user.routes')
            },
            {
                path: 'tester',
                canActivate: [roleGuard],
                data: { roles: ['super', 'superadmin', 'admin'] },
                loadChildren: () => import('./app/features/clinician/clinician.routes')
            },
            {
                path: 'reports',
                canActivate: [roleGuard],
                data: { roles: ['super', 'superadmin', 'admin'] },
                loadChildren: () => import('./app/features/reports/reports.routes')
            },
            {
                path: 'exam',
                loadChildren: () => import('./app/features/exam/exam.routes')
            },
            {
                path: 'profile',
                loadChildren: () => import('./app/features/profile/profile.routes')
            },
            {
                path: 'contactsupport',
                canActivate: [roleGuard],
                data: { roles: ['super', 'superadmin', 'admin'] },
                loadChildren: () => import('./app/features/contact/contact.routes')
            }
        ]
    },

    { path: '**', redirectTo: '/notfound' }
];
