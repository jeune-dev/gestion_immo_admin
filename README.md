# Gestion Immobilière — Administration (super admin web)

Interface React / Vite / Tailwind v4 / TypeScript branchée sur l'API existante (`CONTRAT-API-ADMIN.md`). Le backend n'est pas modifié.

## Démarrage

```bash
npm install
cp .env.example .env   # puis renseigner VITE_API_URL (ex. http://localhost:3000/api/v1)
npm run dev            # http://localhost:5173
```

Scripts : `npm run build` (typecheck + build), `npm run preview`, `npm run typecheck`.

## Prérequis côté API

- `CORS_ORIGIN` doit contenir l'origine de l'admin (ex. `http://localhost:5173`) : le refresh token passe par un cookie httpOnly `SameSite=Strict` (requêtes en `withCredentials`).
- En production, l'admin et l'API doivent partager le même domaine parent (ex. `admin.exemple.sn` / `api.exemple.sn`).
- Le compte doit avoir le rôle `super_admin` ; la double authentification est obligatoire (configurée au premier accès).

## Structure

```
src/
  api/         client Axios (refresh mutualisé, erreurs normalisées), endpoints, types
  components/  ui/ (Button, DataTable, Modal…), layout/ (Sidebar, Topbar…), owners/
  contexts/    AuthContext, ToastContext
  hooks/       useListQuery (filtres/pagination dans l'URL), useAction, useReferentiels
  pages/       auth/ et admin/ (chargées à la demande)
  theme/       charte graphique (theme.css, statuts.ts)
```

Les libellés des statuts viennent de `GET /referentiels` ; seules les couleurs sont définies côté interface (charte).
