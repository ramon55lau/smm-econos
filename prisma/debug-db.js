const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const userCount = await prisma.user.count();
        const packageCount = await prisma.package.count();
        const permissionCount = await prisma.permission.count();
        console.log({ userCount, packageCount, permissionCount });
    } catch (e) {
        console.error('Prisma Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
