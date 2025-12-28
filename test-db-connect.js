const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Manually load .env
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["'](.*)["']$/, '$1'); // Remove quotes
            process.env[key] = value;
        }
    });
}

console.log('Testing Prisma Connection...');
console.log('Database URL:', process.env.DATABASE_URL?.replace(/:[^:]+@/, ':****@')); // Hide password

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    try {
        console.log('Attempting to connect...');
        await prisma.$connect();
        console.log('✅ Connection successful!');

        const result = await prisma.$queryRaw`SELECT 1 as result`;
        console.log('Query result:', result);

        await prisma.$disconnect();
        console.log('Disconnected.');
    } catch (e) {
        console.error('❌ Connection failed:', e);
        process.exit(1);
    }
}

main();
