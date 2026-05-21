const { execSync } = require('child_process');

console.log('Generating version info...');
execSync('node scripts/generate-version.js', { stdio: 'inherit' });

console.log('Using PostgreSQL database');

execSync('prisma generate', { stdio: 'inherit' });

const isVercel = process.env.VERCEL === '1';
if (isVercel) {
  console.log('Running on Vercel, pushing database schema...');
  execSync('prisma db push', { stdio: 'inherit' });
} else {
  console.log('Running locally, skipping database push (ensure PostgreSQL is running)');
}

execSync('next build', { stdio: 'inherit' });