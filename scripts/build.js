const { execSync } = require('child_process');

console.log('Using PostgreSQL database');

execSync('prisma generate', { stdio: 'inherit' });
execSync('prisma db push', { stdio: 'inherit' });
execSync('next build', { stdio: 'inherit' });