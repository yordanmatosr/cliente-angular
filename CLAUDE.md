# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Contexto del proyecto

Este es el **nuevo cliente Angular** de HCare/eScoreIT, reemplazando el cliente React legacy (`/home/yordan/Work/projects/HCare/client`). Migración en curso — NO modificar el proyecto React.

**Backend:** Spring Boot en `/home/yordan/Work/projects/HCare/server` (puerto 8443) — no cambia.

## Comandos de desarrollo

```bash
npm start                              # Dev server en http://localhost:4200
npx ng build --configuration development   # Build de desarrollo
npx ng build                          # Build de producción
npx ng generate component path/name --standalone  # Generar componente
```

## Convenciones de componentes

**Cada componente Angular debe estar en su propio directorio con tres archivos separados:**
```
feature-name/
├── feature-name.component.ts     # Clase del componente (@Component con templateUrl y styleUrl)
├── feature-name.component.html   # Template HTML
└── feature-name.component.scss   # Estilos SCSS del componente
```
- Nunca usar `template` o `styles` inline en el decorador `@Component`
- Siempre usar `templateUrl` y `styleUrl` apuntando a los archivos separados
- El archivo `.ts` no debe contener HTML ni CSS

## Stack técnico

- Angular 21 (standalone components, zoneless)
- PrimeNG 21 + Tailwind CSS v4
- Sakai-NG como shell visual (sidebar, topbar, footer)
- TypeScript estricto
- RxJS para estado reactivo

## Arquitectura

### Estructura de carpetas
```
src/
├── environments/           # environment.ts (prod) / environment.development.ts
├── app/
│   ├── core/
│   │   ├── interceptors/  # auth.interceptor.ts — JWT Bearer automático en todos los requests
│   │   ├── guards/        # auth.guard.ts, role.guard.ts
│   │   └── services/      # auth.service.ts, idle.service.ts (+ servicios de dominio en Fase 2)
│   ├── shared/
│   │   └── components/    # componentes reutilizables (tabla, modal, cards) — Fase 4
│   ├── features/          # módulos de dominio con lazy loading
│   │   ├── dashboard/     ✅ stub
│   │   ├── organization/  ✅ stub
│   │   ├── department/    ✅ stub
│   │   ├── specialty/     ✅ stub
│   │   ├── user/          ✅ stub
│   │   ├── clinician/     ✅ stub
│   │   ├── exam/          ✅ stub
│   │   ├── reports/       ✅ stub
│   │   ├── profile/       ✅ stub
│   │   └── contact/       ✅ stub
│   ├── layout/            # Sakai shell — no modificar estructura, solo app.menu.ts
│   └── pages/
│       ├── auth/          # login.ts (funcional), kiosk (pendiente), guru (pendiente)
│       └── notfound/
├── assets/                # Sakai assets (clonado de cetincakiroglu/sakai-assets)
├── app.config.ts          # providers globales: interceptor, PrimeNG, router
└── app.routes.ts          # rutas completas con authGuard + roleGuard
```

### Autenticación
- `AuthService` — BehaviorSubject<CurrentUser>, login/logout, localStorage key: `currentuser`
- `authInterceptor` — agrega `Authorization: Bearer <token>` a todos los requests HTTP
- `authGuard` — redirige a `/auth/login` si no autenticado o token expirado
- `roleGuard` — lee `route.data['roles']`, redirige a `/auth/access` si no autorizado
- `IdleService` — logout automático tras 10 min de inactividad (RxJS + debounceTime)

### CurrentUser interface
```typescript
interface CurrentUser {
    id: number;
    username: string;
    email: string;
    roles: string[];        // 'super' | 'superadmin' | 'admin' | 'user' | 'kiosk'
    accessToken: string;
    jwtExpirationMs: number;  // timestamp Unix en ms
}
```

### Roles del sistema (mayor a menor privilegio)
- `super` — acceso total + gestión de organizaciones/empresas
- `superadmin` — multi-departamento, sin gestión de org
- `admin` — departamento único
- `user` — clinician/tester, solo sus propios exámenes
- `kiosk` — modo examen únicamente, dashboard restringido

### Rutas
```
/auth/login          → público
/auth/access         → público (acceso denegado)
/dashboard           → authGuard
/agency/**           → authGuard + roleGuard(['super'])
/group/**            → authGuard + roleGuard(['superadmin','admin'])
/specialty/**        → authGuard + roleGuard(['super','superadmin','admin'])
/user/**             → authGuard + roleGuard(['super','superadmin'])
/tester/**           → authGuard + roleGuard(['super','superadmin','admin'])
/reports/**          → authGuard + roleGuard(['super','superadmin','admin'])
/exam/**             → authGuard (todos los roles)
/profile/**          → authGuard (todos los roles)
/contactsupport/**   → authGuard + roleGuard(['super','superadmin','admin'])
```

### Menú lateral
`app/layout/component/app.menu.ts` — filtra ítems según roles del usuario logueado. Modificar aquí para agregar nuevas secciones al menú.

### HTTP y servicios
- El interceptor maneja el JWT automáticamente — los servicios NO necesitan headers manuales
- Patrón de servicio Angular:
```typescript
@Injectable({ providedIn: 'root' })
export class ExamService {
    private http = inject(HttpClient);
    getAll() { return this.http.get<Exam[]>(`${environment.apiUrl}/exams`); }
}
```
- API base URL: `environment.apiUrl` (http://localhost:8443/api)

## Estado de la migración

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1 | Setup: proyecto, guards, interceptor, rutas, login | ✅ Completo |
| 2 | Services: portar 19 servicios de React → Angular | ⏳ Pendiente |
| 3 | Auth: kiosk login, guru login | ⏳ Pendiente |
| 4 | Shared: p-table base, p-dialog base, card summaries | ⏳ Pendiente |
| 5 | CRUD simples: Organization → Department → Specialty → Clinician | ⏳ Pendiente |
| 6 | User management | ⏳ Pendiente |
| 7 | Exam workflow + Question types (más complejo) | ⏳ Pendiente |
| 8 | Reports + Charts + PDF | ⏳ Pendiente |
| 9 | Dashboard, Profile, Documents, FAQ | ⏳ Pendiente |

## Referencia al proyecto React original

Los servicios a portar están en:
`/home/yordan/Work/projects/HCare/client/src/services/`

Los componentes de referencia están en:
`/home/yordan/Work/projects/HCare/client/src/hcare/components/`

Al portar servicios: `axios.get(url)` → `this.http.get(url)` (el interceptor pone el header).
Al portar componentes: Reactstrap → PrimeNG, React Router → Angular Router.
