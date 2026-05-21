const { execSync } = require('child_process');

const isVercel = process.env.VERCEL === '1';

console.log(`Detected environment: ${isVercel ? 'Vercel (PostgreSQL)' : 'Local (SQLite)'}`);

if (isVercel) {
  execSync('prisma generate', { stdio: 'inherit' });
  execSync('next build', { stdio: 'inherit' });
} else {
  execSync('dotenv -e .env -- prisma generate', { stdio: 'inherit' });
  execSync('dotenv -e .env -- prisma db push', { stdio: 'inherit' });
  execSync('dotenv -e .env -- next build', { stdio: 'inherit' });
}