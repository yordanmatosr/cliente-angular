# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Contexto del proyecto

**Nuevo cliente Angular** de HCare/eScoreIT, reemplazando el cliente React legacy (`/home/yordan/Work/projects/HCare/client`). Migración prácticamente completa — NO modificar el proyecto React.

**Repo:** independiente en `/home/yordan/Work/projects/client-angular/` (fuera del monorepo HCare)
**Backend:** Spring Boot en `/home/yordan/Work/projects/HCare/server` (puerto 8443) — no cambia.

## Comandos de desarrollo

```bash
npm start                              # Dev server en http://localhost:4200
npx ng build --configuration development   # Build de desarrollo
npx ng build                          # Build de producción
npx ng generate component path/name --standalone  # Generar componente
```

## Git

- Hacer commit cuando se pida o al terminar una tarea significativa.
- **Nunca hacer `git push`** — el push lo hace el usuario.

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

## Stack técnico

- Angular 21 (standalone components, **zoneless**)
- PrimeNG 21 + Tailwind CSS v4
- Sakai-NG como shell visual (sidebar, topbar, footer)
- TypeScript estricto, RxJS

## Arquitectura

### Estructura de carpetas
```
src/
├── environments/           # environment.ts (prod) / environment.development.ts
├── app/
│   ├── core/
│   │   ├── constants/     # roles.constants.ts, status.constants.ts
│   │   ├── interceptors/  # auth.interceptor.ts — JWT Bearer automático en todos los requests
│   │   ├── guards/        # auth.guard.ts, role.guard.ts
│   │   └── services/      # auth.service.ts, idle.service.ts + todos los servicios de dominio
│   ├── features/          # módulos de dominio con lazy loading (3 archivos por componente)
│   │   ├── dashboard/     # charts admin/user, forkJoin de múltiples servicios
│   │   ├── organization/  # CRUD completo (list + detail dialog)
│   │   ├── department/    # CRUD completo
│   │   ├── specialty/     # CRUD completo
│   │   ├── user/          # CRUD completo con roles
│   │   ├── clinician/     # CRUD completo + clinician-detail/
│   │   ├── exam/          # Workflow completo: exam-dialog/ + exam-report/ (PDF/email)
│   │   ├── reports/       # Reportes con filtros y charts
│   │   ├── profile/       # Edición de perfil + cambio de contraseña
│   │   └── contact/       # FAQ + Study Guides
│   ├── layout/            # Sakai shell — no modificar estructura, solo app.menu.ts
│   └── pages/
│       ├── auth/          # login, access, error, kiosk, direct-login, forgot-password,
│       │                  # forgot-username, confirm-mail, password-reset, login-otp
│       ├── guru/          # guru-landing, guru-register (ruta pública /guru)
│       └── notfound/
├── app.config.ts          # providers globales: interceptor, PrimeNG (preset Aura + color #2c7be5)
└── app.routes.ts          # rutas completas con authGuard + roleGuard
```

**Nota:** `src/app/pages/` también contiene páginas demo de Sakai (uikit/, crud/, dashboard/, landing/) que no son parte de la app — ignorarlas.

### Autenticación
- `AuthService` — signal `currentUser()`, BehaviorSubject, login/logout/clearUser, localStorage key: `currentuser`
- `authInterceptor` — agrega `Authorization: Bearer <token>` + maneja 401 (idle.stop + logout)
- `authGuard` — llama `clearUser()` (sin navegar) y retorna UrlTree a `/auth/login`
- `roleGuard` — lee `route.data['roles']`, redirige a `/auth/access` si no autorizado
- `IdleService` — logout automático tras 10 min de inactividad; re-entrant (stop+start seguro)

### CurrentUser interface
```typescript
interface CurrentUser {
    id: number;
    username: string;
    email: string;
    roles: string[];        // ver ROLE constants
    accessToken: string;
    jwtExpirationMs: number;  // timestamp Unix en ms
}
```

### Roles del sistema
Usar siempre las constantes de `src/app/core/constants/roles.constants.ts`:
```typescript
import { ROLE, ADMIN_ROLES, MANAGEMENT_ROLES } from '../../core/constants/roles.constants';
// ROLE.SUPER | ROLE.SUPERADMIN | ROLE.ADMIN | ROLE.USER | ROLE.KIOSK
// ADMIN_ROLES = [super, superadmin, admin]
// MANAGEMENT_ROLES = [super, superadmin]
```

### Rutas
```
/auth/login          → público
/auth/kiosk          → público (login modo kiosk)
/auth/loginexam      → público (direct login desde examen)
/guru                → público (landing + registro guru)
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

### HTTP y servicios
- El interceptor maneja el JWT automáticamente — los servicios NO necesitan headers manuales
- Patrón de servicio Angular:
```typescript
@Injectable({ providedIn: 'root' })
export class ExamService {
    private http = inject(HttpClient);
    private readonly API = `${environment.apiUrl}/exams`;
    getAll() { return this.http.get<Exam[]>(this.API); }
}
```
- API base URL: `environment.apiUrl` = `http://localhost:8443/api`

### Estilos y diseño
- **Color primario:** `#2c7be5` (Falcon blue) — definido en `app.config.ts` via `definePreset(Aura, {...})`
- **Criterio:** colores de Falcon + componentes de Sakai (cards con gradient border, rounded corners, box-shadow)
- **Logo:** `public/img/scoreit_logo.svg`
- Falcon color reference: `/home/yordan/Work/Falcon/falcon-react-3.5.1-and-2.10.2/falcon-react-v2.10.2/src/assets/scss/theme/_variables.scss`

## Estado de la migración

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1 | Setup: proyecto, guards, interceptor, rutas, login | ✅ Completo |
| 2 | Services: 15 servicios de dominio portados | ✅ Completo |
| 3 | Auth: kiosk login, guru login, forgot-password, OTP | ✅ Completo |
| 4 | Shared: p-table base, p-dialog base, card summaries | ✅ Completo |
| 5 | CRUD simples: Organization, Department, Specialty, Clinician | ✅ Completo |
| 6 | User management | ✅ Completo |
| 7 | Exam workflow + Question types | ✅ Completo |
| 8 | Reports + Charts + PDF/email | ✅ Completo |
| 9 | Dashboard (charts), Profile, Contact/FAQ | ✅ Completo |

## Mejoras pendientes en el backend

Estas mejoras fueron identificadas durante la migración Angular. Se documentan aquí para coordinarse con el backend cuando corresponda.

### 1. `GraphicSpecialtyExamsDTO` — agregar `totalcompletionpercen`
- **Endpoint:** `GET /api/specialty/graphic_prof_designation_exams_stats`
- **Problema:** El DTO no incluye `totalcompletionpercen`, así que el cliente lo calcula:
  `examsCompleted * 100 / (examsNew + examsInProgress + examsCompleted)`
- **Mejora:** Calcularlo server-side en `GraphicSpecialtyExamsDTO` para que el cliente no tenga que hacerlo.

### 2. Dashboard — consolidar `testers_completed_from_last_login` en `DashboardResponse`
- **Endpoints actuales:** `GET /api/dashboard/{userId}` + `GET /api/org/testers_completed_from_last_login/{userId}` (2 requests)
- **Mejora:** Incluir el campo `testersCompletedSinceLogin` directamente en `DashboardResponse` para reducir a 1 request.

### 3. `UserClinicianRequest/Response` — soporte multi-specialty
- **Situación actual:** `UserClinicianRequest` tiene `specialtyId: Integer` (singular). `UserClinicianResponse` tiene `specialtyDescription: String` (solo una).
- **Mejora:** Agregar `List<Integer> specialtiesRequest` al request y `List<SpecialtyResponse> specialtyResponses` al response para cuando un tester deba pertenecer a múltiples especialidades.
- **Nota:** No implementar en el cliente Angular hasta que el backend lo soporte — actualmente se usa `p-select` simple.

### 4. `UserClinicianRequest/Response` — agregar tipo de clínico (`typeId`)
- **Situación actual:** El request/response de testers no incluye `typeId` ni `clinicianTypeResponse`.
- **Mejora:** Agregar `typeId: Integer` al request y `clinicianType: ClinicianTypeResponse` al response si se quiere gestionar el tipo desde el CRUD de testers.
- **Nota:** El campo fue removido del cliente Angular por no estar en el DTO — agregar solo cuando el backend lo soporte.

### 5. Endpoints de gráficas (`graphic_prof_designation_*`) — filtrado por org para superadmin
- **Situación actual:** `GET /api/specialty/graphic_prof_designation_*` devuelve datos globales (sin filtro de org).
- **Mejora:** Para el rol `superadmin` (que gestiona una sola org), agregar un parámetro opcional `?orgId=` para que las gráficas del dashboard reflejen solo su organización.

---

## Referencia al proyecto React original

- Servicios: `/home/yordan/Work/projects/HCare/client/src/services/`
- Componentes: `/home/yordan/Work/projects/HCare/client/src/hcare/components/`

Al portar: `axios.get(url)` → `this.http.get(url)`, Reactstrap → PrimeNG, React Router → Angular Router.
