# Cómo contribuir

## Flujo de ramas

```
feature/<issue>-<tema>  ──PR──▶  develop  ──PR (paso a producción)──▶  main
```

- **`main` es solo producción.** Vercel y Render despliegan desde ahí. Solo recibe cambios desde `develop`, y siempre mediante un pull request.
- **`develop` es la rama de integración** (es la rama `dev` del remoto). Cada issue va en su propia rama (`feature/w04-gobernanza`) y se fusiona a `develop` mediante PR; ahí se verifica.
- No se hace push directo a `main` ni a `develop`. Todo entra por PR y con el CI en verde.

## Pull requests

### De una rama `feature/*` a `develop`

1. Rama desde `develop` actualizado, con un solo issue por PR.
2. El PR apunta a **`develop`** y enlaza el issue (`Refs #N`).
3. El CI debe estar en verde: `frontend (lint + build)` y `backend (lint + test)`.
4. No se exigen aprobaciones de otra persona (equipo de una sola persona); en su lugar, se completa la lista de verificación de la plantilla y se pega una revisión asistida (`/code-review`) como comentario.
5. Se fusiona con *merge commit* (conserva los commits de la rama).
6. `Closes #N` solo cierra issues al fusionar en `main`; al fusionar en `develop` el issue se cierra a mano cuando cumple todos sus criterios.

### De `develop` a `main` (paso a producción)

Se hace cuando hay un avance estable (fin de hito o entrega), no en cada issue.

1. Sincroniza `develop` y verifica el CI local:

   ```bash
   git fetch origin
   git switch develop
   git pull --ff-only origin develop

   npm run lint --prefix frontend && npm run build --prefix frontend
   npm run lint --prefix backend && npm test --prefix backend
   ```

2. Si `main` tiene commits que no están en `develop` (por ejemplo un hotfix), intégralos con un PR de sincronización antes de abrir el PR de release:

   ```bash
   git switch -c chore/sync-main develop
   git merge origin/main
   # resuelve los conflictos y verifica
   npm run lint && npm test --prefix backend
   git push -u origin chore/sync-main
   gh pr create --base develop --head chore/sync-main \
     --title "chore: sincroniza main en develop"
   ```

3. Abre el PR de `develop` hacia `main`:

   ```bash
   gh pr create --base main --head develop \
     --title "release: avance del hito <N>" \
     --body "Resumen del avance. Closes #N de los issues que se cierran."
   ```

   También puedes hacerlo desde GitHub: *Compare & pull request* con **base: main** y **compare: develop**.

4. Espera el CI en verde y fusiona con **merge commit**. No borres `develop`.

5. Actualiza tu copia local:

   ```bash
   git switch main && git pull --ff-only
   git switch develop && git pull --ff-only
   ```

6. Verifica el despliegue de Vercel/Render desde `main` y que `/api/health` responda.

`develop` y `main` están protegidas: PR obligatorio y checks de CI requeridos (`frontend (lint + build)` y `backend (lint + test)`), sin aprobaciones obligatorias. No existe push directo a ninguna de las dos.

## Antes de abrir el PR

```bash
npm run lint --prefix frontend && npm run build --prefix frontend
npm run lint --prefix backend && npm test --prefix backend
```

## Prioridades

Los issues llevan `prio:P0-must`, `P1-should` o `P2-could`. Solo los **Must** son compromiso del semestre; los **Should** y **Could** son *stretch* y no se empiezan hasta cerrar los Must del hito (ver `docs/12_ruta_trabajo_semestre.md`).
