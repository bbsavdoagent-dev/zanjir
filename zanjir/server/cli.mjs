// Administrator buyruqlari (server ichida ishga tushiriladi).
//   node server/cli.mjs list-users
//   node server/cli.mjs reset-password <email> <yangi-parol>
//   node server/cli.mjs delete-user <email>
//   node server/cli.mjs backup <fayl-yo'li>
import path from 'node:path';
import { loadConfig } from './config.mjs';
import { openDb } from './db.mjs';
import { hashPassword } from './auth.mjs';

const config = loadConfig();
const db = openDb(path.join(config.dataDir, 'zanjir.db'));
const [command, ...args] = process.argv.slice(2);

switch (command) {
  case 'list-users': {
    for (const u of db.prepare('SELECT email, role, name, phone, created_at FROM users ORDER BY created_at').all()) {
      console.log(`${u.created_at}  ${u.role.padEnd(7)}  ${u.email}  (${u.name}, ${u.phone})`);
    }
    break;
  }
  case 'reset-password': {
    const [email, newPassword] = args;
    if (!email || !newPassword || newPassword.length < 8) {
      console.error('Foydalanish: reset-password <email> <yangi-parol (kamida 8 belgi)>');
      process.exit(1);
    }
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) {
      console.error('Foydalanuvchi topilmadi');
      process.exit(1);
    }
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(await hashPassword(newPassword), user.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id); // eski sessiyalar bekor qilinadi
    console.log('Parol yangilandi.');
    break;
  }
  case 'delete-user': {
    const [email] = args;
    const user = email && db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) {
      console.error('Foydalanuvchi topilmadi');
      process.exit(1);
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
    if (user.company_id) db.prepare('DELETE FROM companies WHERE id = ?').run(user.company_id);
    if (user.store_id) db.prepare('DELETE FROM stores WHERE id = ?').run(user.store_id);
    console.log("Foydalanuvchi o'chirildi (buyurtmalar tarixi saqlanadi).");
    break;
  }
  case 'backup': {
    const [file] = args;
    if (!file) {
      console.error("Foydalanish: backup <fayl-yo'li>");
      process.exit(1);
    }
    db.exec(`VACUUM INTO '${path.resolve(file).replace(/'/g, "''")}'`);
    console.log(`Zaxira nusxa yaratildi: ${file}`);
    break;
  }
  default:
    console.log('Buyruqlar: list-users | reset-password <email> <parol> | delete-user <email> | backup <fayl>');
}
db.close();
