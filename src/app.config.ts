import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';

// Falcon primary blue: #2c7be5 (from $blue in Falcon _variables.scss)
const EScoreITPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#eaf2fd',
            100: '#c5dbf8',
            200: '#9dc1f2',
            300: '#71a5ec',
            400: '#4d8fe4',
            500: '#2c7be5',
            600: '#2465c2',
            700: '#1c4f9e',
            800: '#143b7a',
            900: '#0d2857',
            950: '#081a3d'
        }
    },
    components: {
        datatable: {
            row: {
                hoverBackground: '#dbeafe'
            }
        }
    }
});

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
        provideZonelessChangeDetection(),
        providePrimeNG({ theme: { preset: EScoreITPreset, options: { darkModeSelector: '.app-dark' } } })
    ]
};
