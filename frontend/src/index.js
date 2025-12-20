import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Enregistrer le Service Worker pour PWA (seulement en production ou si activé)
if ('serviceWorker' in navigator) {
  // Ne pas enregistrer le SW en développement (react-scripts ne le sert pas correctement)
  // Il sera actif automatiquement en production après build
  if (process.env.NODE_ENV === 'production' || process.env.REACT_APP_ENABLE_SW === 'true') {
    window.addEventListener('load', () => {
      // D'abord, désinscrire tous les Service Workers existants pour éviter les conflits
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().then(() => {
            console.log('🧹 Ancien Service Worker désinscrit');
          });
        });
      }).then(() => {
        // Attendre un peu avant de réenregistrer
        return new Promise(resolve => setTimeout(resolve, 100));
      }).then(() => {
        // Enregistrer le nouveau Service Worker
        return navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('✅ Service Worker enregistré avec succès:', registration.scope);
            
            // Vérifier les mises à jour périodiquement
            setInterval(() => {
              registration.update();
            }, 60000); // Vérifier chaque minute
            
            return registration;
          });
      }).catch((error) => {
        console.log('❌ Échec de l\'enregistrement du Service Worker:', error.message);
        // Ne pas bloquer l'application si le SW ne peut pas s'enregistrer
      });
    });
  } else {
    // En développement, désinscrire les SW existants pour éviter les erreurs
    window.addEventListener('load', () => {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
        if (registrations.length > 0) {
          console.log('ℹ️  Service Worker désactivé en mode développement');
        }
      });
    });
  }
}

