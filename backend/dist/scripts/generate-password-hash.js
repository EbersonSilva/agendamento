// Este script é usado para gerar um hash de senha usando bcrypt. Ele pode ser útil para criar senhas de administrador ou para testes.
import bcrypt from 'bcryptjs';
const password = process.argv[2];
if (!password) {
    console.error('Uso: npx tsx scripts/generate-password-hash.ts "novaSenha"');
    process.exit(1);
}
const saltRounds = 10;
const hash = bcrypt.hashSync(password, saltRounds);
console.log(hash);
