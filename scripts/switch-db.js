const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (target !== 'sqlite' && target !== 'postgres') {
    console.error('Error: Debes especificar "sqlite" o "postgres". Ejemplo: node scripts/switch-db.js sqlite');
    process.exit(1);
}

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

try {
    let content = fs.readFileSync(schemaPath, 'utf8');

    if (target === 'sqlite') {
        // Cambiar de postgresql a sqlite
        content = content.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
        fs.writeFileSync(schemaPath, content, 'utf8');
        console.log('✅ Proveedor cambiado a SQLite en schema.prisma.');
    } else {
        // Cambiar de sqlite a postgresql
        content = content.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
        fs.writeFileSync(schemaPath, content, 'utf8');
        console.log('✅ Proveedor cambiado a PostgreSQL en schema.prisma.');
    }
} catch (error) {
    console.error('Error procesando schema.prisma:', error.message);
    process.exit(1);
}
