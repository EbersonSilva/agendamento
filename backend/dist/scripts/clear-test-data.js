import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('Iniciando a limpeza de dados de teste...');
    // 1. Apagar todos os agendamentos (pois dependem de clientes e serviços)
    const deletedAppointments = await prisma.appointment.deleteMany();
    console.log(`Deletados ${deletedAppointments.count} agendamentos.`);
    // 2. Apagar todos os usuários que NÃO são administradores (os clientes de teste)
    const deletedUsers = await prisma.user.deleteMany({
        where: {
            isAdmin: false,
        },
    });
    console.log(`Deletados ${deletedUsers.count} clientes (usuários não-admin).`);
    console.log('Limpeza concluída com sucesso!');
}
main()
    .catch((e) => {
    console.error('Erro durante a limpeza de dados:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
