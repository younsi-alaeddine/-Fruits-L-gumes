import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Un email de réinitialisation a été envoyé si cet email existe.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <span className="logo-icon">✉️</span>
            </div>
            <h1>Email envoyé</h1>
            <p className="auth-subtitle">Vérifiez votre boîte de réception</p>
          </div>

          <div className="success-message">
            <p>
              Si un compte existe avec l'adresse <strong>{email}</strong>, 
              vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
            </p>
            <p className="success-note">
              💡 Vérifiez également votre dossier spam si vous ne recevez pas l'email.
            </p>
          </div>

          <div className="auth-footer">
            <Link to="/login" className="auth-link">
              ← Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon">🔑</span>
          </div>
          <h1>Mot de passe oublié</h1>
          <p className="auth-subtitle">Entrez votre email pour recevoir un lien de réinitialisation</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="reset-email">
              <span className="label-icon">📧</span>
              Email
            </label>
            <div className="input-wrapper">
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="votre@email.com"
                autoComplete="email"
              />
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-block btn-login ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Envoi en cours...</span>
              </>
            ) : (
              <>
                <span>Envoyer le lien</span>
                <span className="btn-icon">→</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="auth-link">
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

