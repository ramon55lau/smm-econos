import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Updating existing users to APPROVED...");

    const result = await prisma.user.updateMany({
        where: {
            status: "PENDING", // Since the default is now PENDING
        },
        data: {
            status: "APPROVED",
        },
    });

    console.log(`Successfully updated ${result.count} users to APPROVED.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
