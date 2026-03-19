# Serviform Academy — API Reference

Base URL: `http://localhost:3001`

## Auth

| Method | Endpoint | Body | Auth | Description |
|--------|----------|------|------|-------------|
| POST | /auth/register | { email, password, name? } | No | Registrazione |
| POST | /auth/login | { email, password } | No | Login, restituisce JWT |
| GET | /auth/profile | - | Bearer | Profilo utente corrente |

## Software

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /software | No | Lista software |
| POST | /software | Admin | Crea software |

## Courses

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /courses | No | Lista corsi |
| GET | /courses/:slug | No | Dettaglio corso |
| POST | /courses | Admin | Crea corso |

## Units

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /units/:courseSlug/:unitSlug | No | Dettaglio unità |
| POST | /units | Admin | Crea unità |

## Videos

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /videos | No | Lista video pillole |
| GET | /videos/software/:slug | No | Video per software |
| POST | /videos | Admin | Crea video pillola |

## Progress

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /progress/complete | Bearer | Segna unità completata |
| GET | /progress/:userId/course/:courseSlug | Bearer | Progresso corso |

## Certificates

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /certificates/issue | Bearer | Emetti certificato |

## Sync

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /sync/video-pill | Admin | Import video pillola |

## Risposte errore

Formato consistente:
```json
{
  "statusCode": 400,
  "message": ["titolo deve avere almeno 3 caratteri"],
  "error": "Bad Request",
  "path": "/courses",
  "timestamp": "2026-03-18T..."
}
```
