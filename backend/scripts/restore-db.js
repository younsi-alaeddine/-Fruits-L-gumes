const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const BACKUP_DIR = path.join(__dirname, '../backups');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL non définie dans .env');
  process.exit(1);
}

// Récupérer le nom du fichier de backup depuis les arguments
const backupFile = process.argv[2];

if (!backupFile) {
  console.error('❌ Usage: node restore-db.js <nom-du-fichier-backup>');
  console.log('\n📋 Backups disponibles:');
  
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
    .sort()
    .reverse();
  
  files.forEach((file, index) => {
    const stats = fs.statSync(path.join(BACKUP_DIR, file));
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`  ${index + 1}. ${file} (${sizeMB} MB)`);
  });
  
  process.exit(1);
}

const backupPath = path.join(BACKUP_DIR, backupFile);

if (!fs.existsSync(backupPath)) {
  console.error(`❌ Fichier de backup non trouvé: ${backupPath}`);
  process.exit(1);
}

// Extraire les informations de connexion depuis DATABASE_URL
const urlMatch = DATABASE_URL.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

if (!urlMatch) {
  console.error('❌ Format DATABASE_URL invalide');
  process.exit(1);
}

const [, user, password, host, port, database] = urlMatch;

// Commande pg_restore
const pgRestoreCommand = `pg_restore -h ${host} -p ${port} -U ${user} -d ${database} -c "${backupPath}"`;

console.log('⚠️  ATTENTION: Cette opération va écraser la base de données actuelle!');
console.log(`📁 Fichier: ${backupPath}`);
console.log('🔄 Restauration en cours...');

// Définir le mot de passe comme variable d'environnement
process.env.PGPASSWORD = password;

exec(pgRestoreCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Erreur lors de la restauration:', error.message);
    console.error(stderr);
    process.exit(1);
  }

  console.log('✅ Base de données restaurée avec succès!');
});

