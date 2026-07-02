const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const packages = [
        { name: 'Starter', maxFacebook: 1, maxInstagram: 1, maxYouTube: 1 },
        { name: 'Growth', maxFacebook: 3, maxInstagram: 3, maxYouTube: 3 },
        { name: 'Professional', maxFacebook: 10, maxInstagram: 10, maxYouTube: 10 },
        { name: 'Enterprise', maxFacebook: 30, maxInstagram: 30, maxYouTube: 30 },
    ];

    console.log('Seeding packages...');

    for (const pkg of packages) {
        await prisma.package.upsert({
            where: { name: pkg.name },
            update: pkg,
            create: pkg,
        });
    }

    console.log('Packages seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
