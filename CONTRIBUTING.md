# Cómo contribuir

## Flujo de ramas

```
feature/<issue>-<tema>  ──PR──▶  develop  ──(avance largo)──▶  main
```

- **`main` es solo producción.** Vercel y Render despliegan desde ahí. Recibe cambios únicamente desde `develop`, tras un avance largo.
- **`develop` es la rama de integración.** Cada issue va en su propia rama (`feature/w04-gobernanza`) y se fusiona a `develop` mediante PR; ahí se verifica.
- No se hace push directo a `main` ni a `develop`.

## Pull requests

1. Rama desde `develop` actualizado, con un solo issue por PR.
2. El PR apunta a **`develop`** y enlaza el issue (`Refs #N`).
3. El CI debe estar en verde: `frontend (lint + build)` y `backend (lint + test)`.
4. No se exigen aprobaciones de otra persona (equipo de una sola persona); en su lugar, se completa la lista de verificación de la plantilla y se pega una revisión asistida (`/code-review`) como comentario.
5. Se fusiona con *merge commit* (conserva los commits de la rama).
6. `Closes #N` solo cierra issues al fusionar en `main`; al fusionar en `develop` el issue se cierra a mano cuando cumple todos sus criterios.

## Antes de abrir el PR

```bash
npm run lint --prefix frontend && npm run build --prefix frontend
npm run lint --prefix backend && npm test --prefix backend
```

## Prioridades

Los issues llevan `prio:P0-must`, `P1-should` o `P2-could`. Solo los **Must** son compromiso del semestre; los **Should** y **Could** son *stretch* y no se empiezan hasta cerrar los Must del hito (ver `docs/12_ruta_trabajo_semestre.md`).
