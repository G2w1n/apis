# Resultados del benchmark

Fecha: 2026-10-26 01:36 UTC · Concurrencia: 20 · 2000 lecturas · 300 pedidos

| API | Lectura req/s | p50 ms | p95 ms | Pedidos req/s | p50 ms | p95 ms | Stock consistente |
|---|---|---|---|---|---|---|---|
| Express + Firestore | 268 | 70.7 | 111.8 | 154 | 127.5 | 137.0 | ✅ |

- **Lectura**: `GET /productos?limit=10&orden=-precio` (catálogo público).
- **Pedidos**: `POST /pedidos` concurrentes sobre el MISMO producto (peor caso: todos compiten por el mismo documento).
- **Stock consistente**: al terminar, el stock coincide exactamente con los pedidos aprobados.

> Los números dependen de la máquina. Express corre como 1 proceso. Firestore corre en el **emulador local**, que es más lento que
> Firestore real en la nube; úsalo para comparar tendencias, no como cifra absoluta.
