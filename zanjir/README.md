# Zanjir — B2B savdo platformasi

Ishlab chiqaruvchi kompaniyalar va chakana do'konlar o'rtasidagi ulgurji savdo platformasi.
React + Vite (frontend) va tashqi kutubxonasiz Node.js serveri + SQLite (backend).

## Ishga tushirish (mahalliy)

```
npm install
npm run build
npm run server        # http://localhost:8080
```

Joylashtirish (DigitalOcean, Docker): `DEPLOYMENT.md`. Boshqa buyruqlar: `npm run lint` (tur tekshiruvi), `npm test`.

## Loyiha tuzilishi

```
server/                    # Backend: REST API, SQLite, sessiyalar, real vaqt (SSE), CLI
  app.mjs                  # Marshrutlar va biznes mantiq (buyurtma, ombor, bildirishnomalar)
  db.mjs                   # Baza sxemasi va tranzaksiyalar
  auth.mjs, validate.mjs   # Parollar/sessiyalar va kiruvchi ma'lumotlarni tekshirish
  tests/                   # API testlari
src/
  App.tsx                  # Ilova ildizi va ko'rinishlar o'rtasida navigatsiya
  context/                 # AuthContext (sessiya), CartContext (savat)
  services/                # api.ts (HTTP), dbService.ts (ma'lumotlar), liveFeed.ts (real vaqt)
  components/company/      # Kompaniya kabineti
  components/store/        # Do'kon kabineti
  components/common/       # Umumiy komponentlar
  constants/, hooks/, utils/, types/
Dockerfile, docker-compose.yml, Caddyfile   # Joylashtirish
deploy/backup.sh                            # Ma'lumotlar zaxirasi
```
