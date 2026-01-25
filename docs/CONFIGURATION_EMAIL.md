# Configuration de l'envoi d'emails

## Pourquoi les emails ne partent pas ?

1. **SMTP non configuré**  
   Si `SMTP_HOST`, `SMTP_USER` ou `SMTP_PASSWORD` sont absents du `.env`, le service email utilise une **config par défaut** (Hostinger) pour permettre l’envoi des emails de vérification. En production, il faut configurer explicitement le SMTP.

2. **Erreur "Cannot read properties of null (reading 'sendMail')"**  
   Cela arrivait quand le transporteur global était `null` et que `sendEmailVerificationEmail` l’utilisait quand même. C’est corrigé : on utilise maintenant `getTransporterOrFallback()` qui crée un transporteur à la volée si besoin.

## Variables d’environnement

À définir dans `backend/.env` :

```env
# SMTP (obligatoire en production)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=contact@fatah-commander.cloud
SMTP_PASSWORD=votre_mot_de_passe

# URL du frontend (pour les liens de vérification / reset password)
FRONTEND_URL=https://fatah-commander.cloud
```

Sans ces variables, le backend utilise la config par défaut (Hostinger) pour les emails de vérification. En production, configurez toujours `SMTP_*` et `FRONTEND_URL`.

## Vérifier que les emails partent

1. **Logs**  
   Au démarrage, vous devez voir soit :  
   - `Service email configuré avec succès`  
   soit :  
   - `SMTP: config par défaut (Hostinger)...`

2. **Test manuel**  
   ```bash
   cd backend
   node scripts/test-email.js
   ```

3. **Renvoyer un email de vérification**  
   Depuis l’app : Login → « Renvoyer l’email de vérification » ou Settings → « Renvoyer l’email de vérification ».

## Fichiers modifiés

- `backend/utils/emailService.js`  
  - `getTransporterOrFallback()` : crée un transporteur si la config globale est absente.  
  - `sendEmailVerificationEmail` : utilise ce transporteur au lieu du `transporter` global.
