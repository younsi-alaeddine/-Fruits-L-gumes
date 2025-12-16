/**
 * Script pour réinitialiser le rate limiting en développement
 * Utile si vous êtes bloqué par le rate limiter pendant les tests
 */

const { exec } = require('child_process');

console.log('🔄 Réinitialisation du rate limiting...');
console.log('⚠️  Ce script nettoie le cache du rate limiter en développement');

// En développement, le rate limiter utilise un store mémoire
// Redémarrer le serveur réinitialisera le rate limiting
console.log('\n📝 Pour réinitialiser le rate limiting:');
console.log('   1. Arrêtez le serveur (Ctrl+C)');
console.log('   2. Redémarrez avec: npm run dev');
console.log('\n💡 En production, le rate limiting se réinitialise automatiquement après la période définie.');

