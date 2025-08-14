import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const result = await prisma.alive.findMany();
    console.log('Alive rows:', result);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());