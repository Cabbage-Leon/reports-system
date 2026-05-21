const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isVercel = process.env.VERCEL === '1';
const schemaPath = isVercel ? 'prisma/schema.postgresql.prisma' : 'prisma/schema.prisma';
const prismaClientPath = path.join(__dirname, '../node_modules/@prisma/client');

console.log(`Detected environment: ${isVercel ? 'Vercel (PostgreSQL)' : 'Local (SQLite)'}`);
console.log(`Using schema: ${schemaPath}`);

if (fs.existsSync(prismaClientPath)) {
  console.log('Cleaning existing Prisma Client...');
  execSync(`rm -rf ${prismaClientPath}`, { stdio: 'inherit' });
}

if (isVercel) {
  execSync(`PRISMA_SCHEMA_PATH=${schemaPath} prisma generate`, { stdio: 'inherit' });
  execSync(`PRISMA_SCHEMA_PATH=${schemaPath} prisma db push`, { stdio: 'inherit' });
  execSync('next build', { stdio: 'inherit' });
} else {
  execSync(`PRISMA_SCHEMA_PATH=${schemaPath} dotenv -e .env -- prisma generate`, { stdio: 'inherit' });
  execSync(`PRISMA_SCHEMA_PATH=${schemaPath} dotenv -e .env -- prisma db push`, { stdio: 'inherit' });
  execSync('dotenv -e .env -- next build', { stdio: 'inherit' });
}