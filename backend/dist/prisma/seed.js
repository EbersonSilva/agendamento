import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const adminName = process.env.ADMIN_NAME;
    const adminPhone = process.env.ADMIN_PHONE;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminName || !adminPhone || !adminPassword) {
        console.error("Missing ADMIN_NAME, ADMIN_PHONE, or ADMIN_PASSWORD in environment.");
        process.exit(1);
    }
    const existingAdmin = await prisma.user.findFirst({
        where: {
            isAdmin: true,
            name: adminName,
            phone: adminPhone,
        },
    });
    if (existingAdmin) {
        console.log("Admin user already exists. Skipping seed.");
        return;
    }
    const passwordHash = bcrypt.hashSync(adminPassword, 10);
    await prisma.user.create({
        data: {
            name: adminName,
            phone: adminPhone,
            passwordHash,
            isAdmin: true,
        },
    });
    console.log("Admin user created successfully.");
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
