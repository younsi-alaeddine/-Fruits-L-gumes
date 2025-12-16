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

// Créer le dossier backups s'il n'existe pas
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Extraire les informations de connexion depuis DATABASE_URL
// Format: postgresql://user:password@host:port/database
const urlMatch = DATABASE_URL.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

if (!urlMatch) {
  console.error('❌ Format DATABASE_URL invalide');
  process.exit(1);
}

const [, user, password, host, port, database] = urlMatch;

// Nom du fichier de backup avec timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.sql`);

// Commande pg_dump
const pgDumpCommand = `pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -F c -f "${backupFile}"`;

console.log('🔄 Création du backup...');
console.log(`📁 Fichier: ${backupFile}`);

// Définir le mot de passe comme variable d'environnement
process.env.PGPASSWORD = password;

exec(pgDumpCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Erreur lors du backup:', error.message);
    console.error(stderr);
    process.exit(1);
  }

  // Obtenir la taille du fichier
  const stats = fs.statSync(backupFile);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('✅ Backup créé avec succès!');
  console.log(`📊 Taille: ${fileSizeMB} MB`);
  console.log(`📁 Fichier: ${backupFile}`);

  // Nettoyer les anciens backups (garder les 10 derniers)
  cleanupOldBackups();
});

function cleanupOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    // Garder les 10 derniers backups
    if (files.length > 10) {
      const filesToDelete = files.slice(10);
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`🗑️  Ancien backup supprimé: ${file.name}`);
      });
    }
  } catch (error) {
    console.warn('⚠️  Erreur lors du nettoyage des anciens backups:', error.message);
  }
}

