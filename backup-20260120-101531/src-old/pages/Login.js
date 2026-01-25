import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/client');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setRateLimited(false);
    setRetryAfter(null);
    setEmailNotVerified(false);

    const result = await login(email, password);

    if (!result.success) {
      if (result.isRateLimited) {
        setRateLimited(true);
        setRetryAfter(result.retryAfter);
        toast.error(result.message || 'Trop de tentatives de connexion');
      } else if (result.requiresEmailVerification) {
        // Email non vérifié
        setEmailNotVerified(true);
        toast.error(result.message || 'Votre adresse email n\'a pas été vérifiée');
      } else {
        toast.error(result.message || 'Erreur de connexion');
      }
      setLoading(false);
    }
    // La navigation sera gérée par le useEffect qui surveille 'user'
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Veuillez entrer votre email');
      return;
    }

    setResendingEmail(true);
    try {
      const response = await api.post('/auth/resend-verification', { email });
      if (response.data.success) {
        toast.success('Un nouvel email de vérification a été envoyé ! Vérifiez votre boîte mail.');
        setEmailNotVerified(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card login-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon">🍎</span>
          </div>
          <h1>Connexion</h1>
          <p className="auth-subtitle">Distribution Fruits & Légumes</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className={`form-group ${focusedField === 'email' ? 'focused' : ''} ${email ? 'has-value' : ''}`}>
            <label htmlFor="email">
              <span className="label-icon">📧</span>
              Email
            </label>
            <div className="input-wrapper">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                required
                placeholder="votre@email.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div className={`form-group ${focusedField === 'password' ? 'focused' : ''} ${password ? 'has-value' : ''}`}>
            <label htmlFor="password">
              <span className="label-icon">🔒</span>
              Mot de passe
            </label>
            <div className="input-wrapper password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-options">
            <Link to="/forgot-password" className="forgot-password-link">
              Mot de passe oublié ?
            </Link>
          </div>

          {rateLimited && retryAfter && (
            <div className="rate-limit-warning">
              <div className="warning-icon">⚠️</div>
              <div className="warning-content">
                <strong>Trop de tentatives</strong>
                <p>
                  Veuillez attendre {Math.ceil(retryAfter / 60)} minute{Math.ceil(retryAfter / 60) > 1 ? 's' : ''} avant de réessayer.
                </p>
              </div>
            </div>
          )}

          {emailNotVerified && (
            <div className="email-verification-warning">
              <div className="warning-icon">📧</div>
              <div className="warning-content">
                <strong>Email non vérifié</strong>
                <p>
                  Votre adresse email n'a pas été vérifiée. Veuillez vérifier votre boîte mail et cliquer sur le lien de confirmation.
                </p>
                <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '8px' }}>
                  Vous n'avez pas reçu l'email ?
                </p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendingEmail}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '10px', width: '100%' }}
                >
                  {resendingEmail ? 'Envoi...' : '📧 Renvoyer l\'email de vérification'}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className={`btn btn-primary btn-block btn-login ${loading ? 'loading' : ''}`}
            disabled={loading || rateLimited}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Connexion en cours...</span>
              </>
            ) : (
              <>
                <span>Se connecter</span>
                <span className="btn-icon">→</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Pas encore de compte ?{' '}
            <Link to="/register" className="auth-link">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

