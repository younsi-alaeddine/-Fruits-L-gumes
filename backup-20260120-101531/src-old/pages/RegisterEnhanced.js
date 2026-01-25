import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Auth.css';

const RegisterEnhanced = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [emailSent, setEmailSent] = useState(false);
  
  const [formData, setFormData] = useState({
    // Étape 1: Informations personnelles
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    
    // Étape 2: Informations du magasin
    shopName: '',
    address: '',
    city: '',
    postalCode: '',
    siret: '',
    tvaNumber: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: ''
  });

  // Si token présent, c'est une vérification d'email
  React.useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken) => {
    try {
      setLoading(true);
      const response = await api.get(`/auth/verify-email?token=${verificationToken}`);
      if (response.data.success) {
        toast.success(response.data.message);
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la vérification de l\'email');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Effacer l'erreur du champ modifié
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: null
      });
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
      if (!formData.email.trim()) {
        newErrors.email = 'L\'email est requis';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email invalide';
      }
      if (!formData.password) {
        newErrors.password = 'Le mot de passe est requis';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Le mot de passe doit faire au moins 6 caractères';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }
    
    if (step === 2) {
      if (!formData.shopName.trim()) newErrors.shopName = 'Le nom du magasin est requis';
      if (!formData.address.trim()) newErrors.address = 'L\'adresse est requise';
      if (!formData.city.trim()) newErrors.city = 'La ville est requise';
      if (!formData.postalCode.trim()) {
        newErrors.postalCode = 'Le code postal est requis';
      } else if (!/^\d{5}$/.test(formData.postalCode)) {
        newErrors.postalCode = 'Code postal invalide (5 chiffres)';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(2)) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        shopName: formData.shopName,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        siret: formData.siret || undefined,
        tvaNumber: formData.tvaNumber || undefined,
        contactPerson: formData.contactPerson || undefined,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined
      });

      if (response.data.success) {
        setEmailSent(true);
        toast.success(response.data.message);
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        const errorMap = {};
        error.response.data.errors.forEach(err => {
          errorMap[err.param] = err.msg;
        });
        setErrors(errorMap);
      }
      toast.error(error.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      setLoading(true);
      await api.post('/auth/resend-verification', { email: formData.email });
      toast.success('Un nouvel email de vérification a été envoyé');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setLoading(false);
    }
  };

  if (token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Vérification de l'email</h1>
          <p>Vérification en cours...</p>
        </div>
      </div>
    );
  }

  if (emailSent) {
    return (
      <div className="auth-container">
        <div className="auth-card auth-card-large">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📧</div>
            <h1>Email de confirmation envoyé !</h1>
            <p style={{ marginBottom: '30px', color: '#666' }}>
              Un email de confirmation a été envoyé à <strong>{formData.email}</strong>
            </p>
            <p style={{ marginBottom: '30px', color: '#666' }}>
              Veuillez vérifier votre boîte mail et cliquer sur le lien de confirmation pour activer votre compte.
            </p>
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                <strong>⚠️ Important :</strong> Vous ne pourrez pas vous connecter tant que votre email n'aura pas été vérifié.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleResendEmail}
                className="btn btn-secondary"
                disabled={loading}
              >
                {loading ? 'Envoi...' : 'Renvoyer l\'email'}
              </button>
              <Link to="/login" className="btn btn-primary">
                Aller à la connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-large">
        <h1>🍎 Inscription</h1>
        <p className="auth-subtitle">Créer un compte client</p>
        
        {/* Indicateur de progression */}
        <div className="progress-steps">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Informations personnelles</div>
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Informations du magasin</div>
          </div>
        </div>

        <form onSubmit={currentStep === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          {/* Étape 1: Informations personnelles */}
          {currentStep === 1 && (
            <div className="form-step">
              <h3>Informations personnelles</h3>
              
              <div className="form-group">
                <label>Nom complet *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={errors.name ? 'error' : ''}
                  placeholder="Jean Dupont"
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={errors.email ? 'error' : ''}
                  placeholder="jean.dupont@example.com"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Un email de confirmation sera envoyé à cette adresse
                </small>
              </div>

              <div className="form-group">
                <label>Téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0612345678"
                />
              </div>

              <div className="form-group">
                <label>Mot de passe *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className={errors.password ? 'error' : ''}
                  placeholder="Minimum 6 caractères"
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label>Confirmer le mot de passe *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className={errors.confirmPassword ? 'error' : ''}
                  placeholder="Répétez le mot de passe"
                />
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
            </div>
          )}

          {/* Étape 2: Informations du magasin */}
          {currentStep === 2 && (
            <div className="form-step">
              <h3>Informations du magasin</h3>
              
              <div className="form-group">
                <label>Nom du magasin *</label>
                <input
                  type="text"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  required
                  className={errors.shopName ? 'error' : ''}
                  placeholder="Épicerie du Centre"
                />
                {errors.shopName && <span className="error-message">{errors.shopName}</span>}
              </div>

              <div className="form-group">
                <label>Adresse *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className={errors.address ? 'error' : ''}
                  placeholder="123 Rue de la République"
                />
                {errors.address && <span className="error-message">{errors.address}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ville *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className={errors.city ? 'error' : ''}
                    placeholder="Paris"
                  />
                  {errors.city && <span className="error-message">{errors.city}</span>}
                </div>

                <div className="form-group">
                  <label>Code postal *</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    required
                    pattern="[0-9]{5}"
                    maxLength={5}
                    className={errors.postalCode ? 'error' : ''}
                    placeholder="75001"
                  />
                  {errors.postalCode && <span className="error-message">{errors.postalCode}</span>}
                </div>
              </div>

              <h4 style={{ marginTop: '30px', marginBottom: '15px', color: '#666', fontSize: '16px' }}>
                Informations complémentaires (optionnel)
              </h4>

              <div className="form-group">
                <label>Numéro SIRET</label>
                <input
                  type="text"
                  name="siret"
                  value={formData.siret}
                  onChange={handleChange}
                  placeholder="12345678901234"
                />
              </div>

              <div className="form-group">
                <label>Numéro TVA intracommunautaire</label>
                <input
                  type="text"
                  name="tvaNumber"
                  value={formData.tvaNumber}
                  onChange={handleChange}
                  placeholder="FR12345678901"
                />
              </div>

              <div className="form-group">
                <label>Personne de contact</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder="Nom de la personne de contact"
                />
              </div>

              <div className="form-group">
                <label>Email de contact</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="contact@example.com"
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Peut différer de l'email de connexion
                </small>
              </div>

              <div className="form-group">
                <label>Téléphone de contact</label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="0612345678"
                />
              </div>
            </div>
          )}

          <div className="form-actions">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="btn btn-secondary"
                disabled={loading}
              >
                Précédent
              </button>
            )}
            {currentStep < 2 ? (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                Suivant
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? 'Inscription...' : 'S\'inscrire'}
              </button>
            )}
          </div>
        </form>

        <p className="auth-footer">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterEnhanced;
