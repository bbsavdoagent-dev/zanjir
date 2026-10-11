# DigitalOcean'ga joylashtirish

Ilova bitta serverda ishlaydi: **Node.js serveri + SQLite bazasi** (Docker ichida) va **Caddy**
(avtomatik HTTPS). Firebase, to'lov kartasi va qo'shimcha xizmatlar kerak emas.

## 1. Droplet yaratish
1. DigitalOcean → **Create → Droplet**: Ubuntu 24.04, **kamida 2 GB RAM** (frontendni yig'ish xotira talab qiladi;
   1 GB bo'lsa, pastdagi "swap" qadamini bajaring).
2. Autentifikatsiya: parol yoki SSH kalit. Droplet IP manzilini yozib oling.

## 2. Serverni tayyorlash (SSH orqali: `ssh root@SERVER-IP`)
```bash
curl -fsSL https://get.docker.com | sh        # Docker o'rnatish
apt-get install -y unzip ufw
ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw --force enable
```
1 GB RAM bo'lsa (swap qo'shish):
```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

## 3. Loyihani serverga yuklash
O'z kompyuteringizdan (PowerShell), loyiha arxivi turgan papkada:
```
scp zanjir-production.zip root@SERVER-IP:/root/
```
Serverda:
```bash
unzip zanjir-production.zip -d /root && cd /root/zanjir
```

## 4. Sozlash va ishga tushirish
```bash
nano .env          # SITE_ADDRESS va (ixtiyoriy) aloqa ma'lumotlari
docker compose up -d --build
```
- **Domen bo'lmasa:** `SITE_ADDRESS=:80` qoldiring. Sayt `http://SERVER-IP` da ochiladi.
- **Domen bo'lsa (tavsiya):** domeningizning DNS'ida **A yozuv**ni droplet IP'siga yo'naltiring,
  `.env` da `SITE_ADDRESS=zanjir.uz` qiling va `docker compose up -d` ni qayta yuring.
  HTTPS sertifikatni Caddy o'zi oladi va yangilab turadi.

Birinchi yig'ish 3-5 daqiqa oladi. Tekshirish: `docker compose ps` (ikkala xizmat `running`/`healthy`),
`docker compose logs -f app` (loglar).

> Haqiqiy foydalanuvchilar bilan **domen + HTTPS** ishlating: HTTP orqali parollar ochiq yuboriladi.

## 5. Birinchi tekshiruv
1. Saytni oching, **kompaniya** sifatida ro'yxatdan o'ting, mahsulot qo'shing.
2. Inkognito oynada **do'kon** sifatida ro'yxatdan o'ting, buyurtma bering.
3. Kompaniyada buyurtma va bildirishnoma darhol paydo bo'lishi, ombor qoldig'i kamayishi kerak.
4. Holatni o'zgartiring (do'konda yangilanishi kerak), keyin boshqa buyurtmani bekor qiling (ombor qaytishi kerak).
5. Uchinchi hisob (boshqa kompaniya) bu buyurtmalarni ko'rmasligi kerak.

## Kundalik ishlar

**Yangilash** (yangi arxiv yuklagach):
```bash
cd /root/zanjir && docker compose up -d --build
```
Ma'lumotlar `zanjir-data` volume'sida saqlanadi, yangilashda yo'qolmaydi.

**Zaxira nusxa** (muhim!):
```bash
sh deploy/backup.sh            # ./backups/ papkasiga saqlaydi
crontab -e                     # har kuni avtomatik: 0 3 * * * cd /root/zanjir && sh deploy/backup.sh
```
Zaxirani vaqti-vaqti bilan o'z kompyuteringizga ham nusxalang: `scp root@SERVER-IP:/root/zanjir/backups/*.db .`
(DigitalOcean'da Droplet **Backups** xizmatini yoqish ham mumkin, haftalik, narxi droplet narxining ~20%).

**Tiklash:** `docker compose down`, so'ng `docker run --rm -v zanjir_zanjir-data:/data -v $PWD/backups:/b alpine cp /b/FAYL.db /data/zanjir.db`,
keyin `docker compose up -d`.

**Administrator buyruqlari** (parol tiklash shu orqali):
```bash
docker compose exec app node server/cli.mjs list-users
docker compose exec app node server/cli.mjs reset-password email@example.com YangiParol123
docker compose exec app node server/cli.mjs delete-user email@example.com
```

## Mahalliy ishlab chiqish
```
npm install
npm run build
npm run server        # http://localhost:8080 (frontend ham shu yerda)
```
Frontendni jonli o'zgartirish uchun ikkinchi terminalda `npm run dev` (http://localhost:3000, /api serverga yo'naltiriladi).

## Arxitektura
- `server/` — tashqi kutubxonasiz Node.js serveri (Node 22, `node:sqlite`). Sessiyalar HttpOnly cookie'da,
  parollar scrypt bilan, kirish urinishlari cheklangan, o'zgartiruvchi so'rovlar manbasi tekshiriladi.
- Buyurtma, ombor va bildirishnomalar **serverda bitta tranzaksiyada** bajariladi: narxni mijoz o'zgartira olmaydi.
- Real vaqt yangilanishlari Server-Sent Events orqali; uzilsa, har 20 soniyada avtomatik yangilanadi.

## Hali mavjud emas
Email orqali parol tiklash (hozir administrator CLI orqali), SMS, to'lov tizimi, email tasdiqlash,
kompaniyani administrator tomonidan tasdiqlash, rasm yuklash (rasm havola orqali beriladi).

## Telefonga ilova sifatida o'rnatish (PWA)
Sayt PWA sifatida sozlangan: foydalanuvchi saytni telefonida ochib, **"Ilovani o'rnatish"** (Android/Chrome:
menyu ⋮ → *Ilovani o'rnatish* / *Bosh ekranga qo'shish*; iPhone/Safari: *Ulashish* → *Bosh ekranga qo'shish*) ni bosadi.
Muhim: o'rnatish faqat **HTTPS** orqali ishlaydi (domen kerak). Domen bo'lmasa, vaqtincha bepul manzil mumkin:
IP `164.92.10.5` bo'lsa, `.env` da `SITE_ADDRESS=164-92-10-5.sslip.io` qiling va `docker compose up -d`.
