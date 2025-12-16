import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }));

            // Animation des statistiques
            if (entry.target.id === 'stats') {
              const statNumbers = entry.target.querySelectorAll('.stat-number');
              statNumbers.forEach((stat) => {
                const target = parseInt(stat.getAttribute('data-target'));
                const duration = 2000;
                const increment = target / (duration / 16);
                let current = 0;

                const updateCounter = () => {
                  current += increment;
                  if (current < target) {
                    stat.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                  } else {
                    stat.textContent = target;
                  }
                };

                updateCounter();
              });
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('.section');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="home-page">
      {/* Navigation */}
      <nav className="home-nav">
        <div className="nav-container">
          <div className="logo">
            <span className="logo-icon">🍎</span>
            <span className="logo-text">Fruits & Légumes</span>
          </div>
          <div className="nav-links">
            <a href="#accueil">Accueil</a>
            <a href="#produits">Nos Produits</a>
            <a href="#services">Nos Services</a>
            <a href="#engagements">Nos Engagements</a>
            <a href="#actualites">Actualités</a>
            <a href="#contact">Contact</a>
            <div className="nav-icons">
              <span className="search-icon">🔍</span>
            </div>
            <Link to="/login" className="btn-mon-compte">
              Mon compte
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="accueil" className="hero-section">
        <div className="hero-image-container">
          <div className="hero-image-overlay"></div>
          <div className="hero-image-placeholder">
            {/* Placeholder pour image hero - vous pouvez ajouter une vraie image */}
            <div className="hero-image-content">
              <div className="hero-fruits-bg">
                <span className="hero-fruit">🍅</span>
                <span className="hero-fruit">🥕</span>
                <span className="hero-fruit">🍎</span>
                <span className="hero-fruit">🥬</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-content">
          <h1 className="hero-title">
            FRUITS & LÉGUMES
            <br />
            <span className="hero-subtitle-main">LE RÉFÉRENT DE LA DISTRIBUTION</span>
            <br />
            <span className="hero-subtitle-main">DE FRUITS & LÉGUMES</span>
          </h1>
          <p className="hero-location">en Île-de-France depuis 2024</p>
        </div>
      </section>

      {/* Stats Section - Chiffres clés */}
      <section id="stats" className="section stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className={`stat-card ${isVisible['stat-1'] ? 'fade-in-up' : ''}`} id="stat-1">
              <div className="stat-number" data-target="400">0</div>
              <div className="stat-icon">🛒</div>
              <div className="stat-label">clients</div>
            </div>
            <div className={`stat-card ${isVisible['stat-2'] ? 'fade-in-up' : ''}`} id="stat-2">
              <div className="stat-number" data-target="4">0</div>
              <div className="stat-icon">🏢</div>
              <div className="stat-label">plateformes</div>
            </div>
            <div className={`stat-card ${isVisible['stat-3'] ? 'fade-in-up' : ''}`} id="stat-3">
              <div className="stat-number" data-target="9">0</div>
              <div className="stat-icon">🚚</div>
              <div className="stat-label">camions</div>
            </div>
            <div className={`stat-card ${isVisible['stat-4'] ? 'fade-in-up' : ''}`} id="stat-4">
              <div className="stat-number" data-target="800">0</div>
              <div className="stat-icon">📦</div>
              <div className="stat-label">références</div>
            </div>
            <div className={`stat-card ${isVisible['stat-5'] ? 'fade-in-up' : ''}`} id="stat-5">
              <div className="stat-number" data-target="5">0</div>
              <div className="stat-icon">🤝</div>
              <div className="stat-label">engagements</div>
            </div>
            <div className={`stat-card ${isVisible['stat-6'] ? 'fade-in-up' : ''}`} id="stat-6">
              <div className="stat-number" data-target="12">0</div>
              <div className="stat-icon">🌱</div>
              <div className="stat-label">produits bio</div>
            </div>
          </div>
        </div>
      </section>

      {/* Témoignage Directeur */}
      <section className="section temoignage-section">
        <div className="container">
          <div className="temoignage-content">
            <div className={`temoignage-image ${isVisible['temoignage'] ? 'fade-in-left' : ''}`} id="temoignage">
              <div className="temoignage-photo">
                <div className="photo-placeholder">👨‍💼</div>
              </div>
              <div className="temoignage-signature">
                <div className="signature-line">Thomas VALLENET</div>
                <div className="signature-role">Directeur Général</div>
              </div>
            </div>
            <div className={`temoignage-text ${isVisible['temoignage'] ? 'fade-in-right' : ''}`}>
              <h2>Créer le lien au cœur de nos régions</h2>
              <p>
                Au cœur de l'Île-de-France, notre équipe s'engage pour vous proposer le meilleur 
                de nos régions et vous garantir tout au long de l'année des fruits & légumes frais 
                qui respectent le rythme des saisons. Implantés depuis plusieurs années dans nos 
                territoires, notre approche personnalisée contribue au quotidien à la création 
                d'un service global de qualité.
              </p>
              <p>
                Nous développons une relation durable entre nos clients, nos producteurs et nos 
                partenaires. Au quotidien, nos équipes vous proposent tous les plaisirs de nos 
                régions avec des produits sélectionnés pour leur goût et leur qualité.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Engagements Section */}
      <section id="engagements" className="section engagements-section">
        <div className="container">
          <div className={`section-header ${isVisible['engagements-header'] ? 'fade-in' : ''}`} id="engagements-header">
            <h2 className="section-title">Nos Engagements</h2>
          </div>
          <div className="engagements-grid">
            <div className={`engagement-card ${isVisible['engagement-1'] ? 'slide-in-up' : ''}`} id="engagement-1">
              <div className="engagement-image-circle">
                <div className="circle-image">🏰</div>
              </div>
              <h3>Créer le lien au cœur de nos régions</h3>
              <p>
                Nous développons une relation durable entre nos clients, nos producteurs et nos 
                partenaires. Au quotidien, nos équipes vous proposent tous les plaisirs de nos 
                régions avec des produits sélectionnés pour leur goût et leur qualité.
              </p>
              <button className="btn-en-savoir-plus">En savoir plus</button>
            </div>
            <div className={`engagement-card ${isVisible['engagement-2'] ? 'slide-in-up' : ''}`} id="engagement-2">
              <div className="engagement-image-circle">
                <div className="circle-image">🍑</div>
              </div>
              <h3>Choisir les bons produits au bon moment</h3>
              <p>
                Au rythme des saisons, nous sélectionnons avant tout des fruits et légumes qui 
                ont du goût. Notre connaissance approfondie des différents terroirs de production 
                vous garantit le meilleur choix et la pleine satisfaction des consommateurs.
              </p>
            </div>
            <div className={`engagement-card ${isVisible['engagement-3'] ? 'slide-in-up' : ''}`} id="engagement-3">
              <div className="engagement-image-circle">
                <div className="circle-image">🤝</div>
              </div>
              <h3>Conseiller, Accompagner les ventes et Valoriser les produits</h3>
              <p>
                Du mûrissement des fruits à l'animation des points de vente en passant par les 
                supports de promotion, notre approche personnalisée contribue à la création d'un 
                service global de qualité. Les hommes et les femmes de notre équipe s'engagent 
                pour vous.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Savoir-Faire Section */}
      <section id="savoir-faire" className="section savoir-faire-section">
        <div className="container">
          <div className={`section-header ${isVisible['savoir-faire-header'] ? 'fade-in' : ''}`} id="savoir-faire-header">
            <h2 className="section-title-white">NOS SAVOIR-FAIRE</h2>
          </div>
          <div className="savoir-faire-grid">
            <div className={`savoir-faire-item ${isVisible['sf-1'] ? 'fade-in-up' : ''}`} id="sf-1">
              <div className="sf-icon-circle">📞</div>
              <p>Un service de commande 24h/24</p>
            </div>
            <div className={`savoir-faire-item ${isVisible['sf-2'] ? 'fade-in-up' : ''}`} id="sf-2">
              <div className="sf-icon-circle">👥</div>
              <p>Une équipe dédiée</p>
            </div>
            <div className={`savoir-faire-item ${isVisible['sf-3'] ? 'fade-in-up' : ''}`} id="sf-3">
              <div className="sf-icon-circle">🚚</div>
              <p>Un service de livraison 6j/7</p>
            </div>
            <div className={`savoir-faire-item ${isVisible['sf-4'] ? 'fade-in-up' : ''}`} id="sf-4">
              <div className="sf-icon-circle">⭐</div>
              <p>Des produits frais et de qualité</p>
            </div>
            <div className={`savoir-faire-item ${isVisible['sf-5'] ? 'fade-in-up' : ''}`} id="sf-5">
              <div className="sf-icon-circle">🌍</div>
              <p>Un circuit court et des produits locaux</p>
            </div>
            <div className={`savoir-faire-item ${isVisible['sf-6'] ? 'fade-in-up' : ''}`} id="sf-6">
              <div className="sf-icon-circle">✅</div>
              <p>Des certifications reconnues</p>
            </div>
            <div className={`savoir-faire-item ${isVisible['sf-7'] ? 'fade-in-up' : ''}`} id="sf-7">
              <div className="sf-icon-circle">🌱</div>
              <p>Une démarche éco-responsable</p>
            </div>
            <div className={`savoir-faire-item ${isVisible['sf-8'] ? 'fade-in-up' : ''}`} id="sf-8">
              <div className="sf-icon-circle">💼</div>
              <p>Un accompagnement personnalisé</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="section services-section">
        <div className="container">
          <div className={`section-header ${isVisible['services-header'] ? 'fade-in' : ''}`} id="services-header">
            <h2 className="section-title">Nos Services</h2>
            <p className="section-subtitle">
              Une plateforme complète pour gérer vos commandes de fruits et légumes
            </p>
          </div>
          <div className="services-grid">
            <div className={`service-card ${isVisible['service-1'] ? 'slide-in-left' : ''}`} id="service-1">
              <div className="service-icon">🛒</div>
              <h3>Catalogue en ligne</h3>
              <p>
                Accédez à un catalogue complet de fruits et légumes frais.
                Recherchez, filtrez et commandez en quelques clics.
              </p>
            </div>
            <div className={`service-card ${isVisible['service-2'] ? 'slide-in-up' : ''}`} id="service-2">
              <div className="service-icon">📋</div>
              <h3>Gestion des commandes</h3>
              <p>
                Suivez vos commandes en temps réel, de la création à la livraison.
                Historique complet et notifications automatiques.
              </p>
            </div>
            <div className={`service-card ${isVisible['service-3'] ? 'slide-in-right' : ''}`} id="service-3">
              <div className="service-icon">📊</div>
              <h3>Tableau de bord</h3>
              <p>
                Visualisez vos statistiques, ventes et performances.
                Outils d'analyse pour optimiser votre activité.
              </p>
            </div>
            <div className={`service-card ${isVisible['service-4'] ? 'slide-in-left' : ''}`} id="service-4">
              <div className="service-icon">📦</div>
              <h3>Gestion de stock</h3>
              <p>
                Suivez vos stocks en temps réel avec alertes automatiques.
                Optimisez vos commandes selon vos besoins.
              </p>
            </div>
            <div className={`service-card ${isVisible['service-5'] ? 'slide-in-up' : ''}`} id="service-5">
              <div className="service-icon">💳</div>
              <h3>Paiements sécurisés</h3>
              <p>
                Gestion complète des paiements et factures.
                Suivi des encaissements et rapports financiers.
              </p>
            </div>
            <div className={`service-card ${isVisible['service-6'] ? 'slide-in-right' : ''}`} id="service-6">
              <div className="service-icon">👥</div>
              <h3>Gestion multi-utilisateurs</h3>
              <p>
                Gérez vos équipes avec des rôles et permissions.
                Administration complète de votre organisation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Avantages Section */}
      <section id="avantages" className="section avantages-section">
        <div className="container">
          <div className={`section-header ${isVisible['avantages-header'] ? 'fade-in' : ''}`} id="avantages-header">
            <h2 className="section-title">Pourquoi nous choisir ?</h2>
            <p className="section-subtitle">
              Des avantages concrets pour votre entreprise
            </p>
          </div>
          <div className="avantages-grid">
            <div className={`avantage-item ${isVisible['avantage-1'] ? 'fade-in-up' : ''}`} id="avantage-1">
              <div className="avantage-number">01</div>
              <h3>Gain de temps</h3>
              <p>
                Commandez en quelques minutes au lieu d'appels téléphoniques.
                Automatisation complète du processus.
              </p>
            </div>
            <div className={`avantage-item ${isVisible['avantage-2'] ? 'fade-in-up' : ''}`} id="avantage-2">
              <div className="avantage-number">02</div>
              <h3>Traçabilité complète</h3>
              <p>
                Suivez chaque commande de A à Z. Historique détaillé
                et notifications en temps réel.
              </p>
            </div>
            <div className={`avantage-item ${isVisible['avantage-3'] ? 'fade-in-up' : ''}`} id="avantage-3">
              <div className="avantage-number">03</div>
              <h3>Réduction des erreurs</h3>
              <p>
                Moins d'erreurs grâce à la saisie numérique.
                Validation automatique des commandes.
              </p>
            </div>
            <div className={`avantage-item ${isVisible['avantage-4'] ? 'fade-in-up' : ''}`} id="avantage-4">
              <div className="avantage-number">04</div>
              <h3>Accessible 24/7</h3>
              <p>
                Commandez quand vous voulez, où vous voulez.
                Plateforme disponible en permanence.
              </p>
            </div>
            <div className={`avantage-item ${isVisible['avantage-5'] ? 'fade-in-up' : ''}`} id="avantage-5">
              <div className="avantage-number">05</div>
              <h3>Rapports détaillés</h3>
              <p>
                Analysez vos achats et optimisez vos commandes.
                Export Excel et PDF disponibles.
              </p>
            </div>
            <div className={`avantage-item ${isVisible['avantage-6'] ? 'fade-in-up' : ''}`} id="avantage-6">
              <div className="avantage-number">06</div>
              <h3>Support réactif</h3>
              <p>
                Équipe dédiée pour vous accompagner.
                Formation et assistance continue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fonctionnalités Section */}
      <section id="fonctionnalites" className="section fonctionnalites-section">
        <div className="container">
          <div className={`section-header ${isVisible['fonctionnalites-header'] ? 'fade-in' : ''}`} id="fonctionnalites-header">
            <h2 className="section-title">Fonctionnalités principales</h2>
            <p className="section-subtitle">
              Tout ce dont vous avez besoin pour gérer vos commandes efficacement
            </p>
          </div>
          <div className="fonctionnalites-content">
            <div className="fonctionnalites-list">
              <div className={`fonctionnalite-item ${isVisible['func-1'] ? 'slide-in-left' : ''}`} id="func-1">
                <div className="fonctionnalite-icon">✅</div>
                <div className="fonctionnalite-text">
                  <h4>Catalogue produits complet</h4>
                  <p>Recherche avancée, filtres par catégorie, prix et disponibilité</p>
                </div>
              </div>
              <div className={`fonctionnalite-item ${isVisible['func-2'] ? 'slide-in-left' : ''}`} id="func-2">
                <div className="fonctionnalite-icon">✅</div>
                <div className="fonctionnalite-text">
                  <h4>Panier intelligent</h4>
                  <p>Calcul automatique des totaux HT, TVA et TTC</p>
                </div>
              </div>
              <div className={`fonctionnalite-item ${isVisible['func-3'] ? 'slide-in-left' : ''}`} id="func-3">
                <div className="fonctionnalite-icon">✅</div>
                <div className="fonctionnalite-text">
                  <h4>Suivi des commandes</h4>
                  <p>Statuts en temps réel : Nouvelle, Préparation, Livraison, Livrée</p>
                </div>
              </div>
              <div className={`fonctionnalite-item ${isVisible['func-4'] ? 'slide-in-left' : ''}`} id="func-4">
                <div className="fonctionnalite-icon">✅</div>
                <div className="fonctionnalite-text">
                  <h4>Gestion de stock</h4>
                  <p>Alertes automatiques, seuils minimums configurables</p>
                </div>
              </div>
              <div className={`fonctionnalite-item ${isVisible['func-5'] ? 'slide-in-left' : ''}`} id="func-5">
                <div className="fonctionnalite-icon">✅</div>
                <div className="fonctionnalite-text">
                  <h4>Tableaux de bord</h4>
                  <p>Statistiques détaillées, graphiques et analyses</p>
                </div>
              </div>
              <div className={`fonctionnalite-item ${isVisible['func-6'] ? 'slide-in-left' : ''}`} id="func-6">
                <div className="fonctionnalite-icon">✅</div>
                <div className="fonctionnalite-text">
                  <h4>Export de données</h4>
                  <p>Export Excel et PDF pour vos rapports</p>
                </div>
              </div>
            </div>
            <div className={`fonctionnalites-visual ${isVisible['func-visual'] ? 'slide-in-right' : ''}`} id="func-visual">
              <div className="visual-card">
                <div className="visual-header">
                  <div className="visual-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <div className="visual-content">
                  <div className="visual-item">📊 Dashboard</div>
                  <div className="visual-item">📦 Commandes</div>
                  <div className="visual-item">🛍️ Produits</div>
                  <div className="visual-item">💳 Paiements</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nos Produits Section */}
      <section id="produits" className="section produits-section">
        <div className="container">
          <div className={`section-header ${isVisible['produits-header'] ? 'fade-in' : ''}`} id="produits-header">
            <h2 className="section-title">NOS PRODUITS</h2>
          </div>
          <div className="produits-main-image">
            <div className="produits-image-placeholder">
              <div className="produits-image-content">
                <span className="produits-icon">🌿</span>
                <p>Fruits & Légumes frais de saison</p>
              </div>
            </div>
          </div>
          <div className="produits-cards">
            <div className={`produit-card ${isVisible['produit-1'] ? 'fade-in-up' : ''}`} id="produit-1">
              <div className="produit-icon">📅</div>
              <h3>La saisonnalité</h3>
              <p>Respect des cycles naturels et des saisons</p>
            </div>
            <div className={`produit-card ${isVisible['produit-2'] ? 'fade-in-up' : ''}`} id="produit-2">
              <div className="produit-icon">👨‍🌾</div>
              <h3>Nos producteurs</h3>
              <p>Partenariats durables avec des producteurs locaux</p>
            </div>
            <div className={`produit-card ${isVisible['produit-3'] ? 'fade-in-up' : ''}`} id="produit-3">
              <div className="produit-icon">🤝</div>
              <h3>Nos engagements</h3>
              <p>Qualité, fraîcheur et traçabilité garanties</p>
            </div>
            <div className={`produit-card ${isVisible['produit-4'] ? 'fade-in-up' : ''}`} id="produit-4">
              <div className="produit-icon">✅</div>
              <h3>Nos certifications</h3>
              <p>Labels reconnus et contrôles qualité</p>
            </div>
            <div className={`produit-card ${isVisible['produit-5'] ? 'fade-in-up' : ''}`} id="produit-5">
              <div className="produit-icon">🏷️</div>
              <h3>Nos marques</h3>
              <p>Gamme complète de produits sélectionnés</p>
            </div>
          </div>
        </div>
      </section>

      {/* Les Jardins de Louis Section */}
      <section className="section jardins-louis-section">
        <div className="container">
          <div className="jardins-louis-content">
            <div className={`jardins-louis-logo ${isVisible['jardins'] ? 'fade-in-left' : ''}`} id="jardins">
              <div className="jardins-logo-circle">
                <span className="jardins-logo-icon">🌳</span>
                <div className="jardins-logo-text">LES JARDINS DE LOUIS</div>
              </div>
            </div>
            <div className={`jardins-louis-text ${isVisible['jardins'] ? 'fade-in-right' : ''}`}>
              <h2>LA NATURE DU GOÛT</h2>
              <p>
                Découvrez notre marque dédiée aux produits de qualité supérieure. 
                Les Jardins de Louis vous propose une sélection rigoureuse de fruits 
                et légumes qui respectent les saisons et les terroirs.
              </p>
              <p>
                Chaque produit est soigneusement sélectionné pour vous offrir le meilleur 
                de la nature, avec un goût authentique et une qualité irréprochable.
              </p>
              <button className="btn-decouvrir">Découvrir</button>
            </div>
          </div>
        </div>
      </section>

      {/* Nos Clients Section */}
      <section id="clients" className="section clients-section">
        <div className="container">
          <div className={`section-header ${isVisible['clients-header'] ? 'fade-in' : ''}`} id="clients-header">
            <h2 className="section-title">NOS CLIENTS</h2>
          </div>
          <div className="clients-background">
            <div className="clients-image-overlay"></div>
          </div>
          <div className="clients-cards">
            <div className={`client-card ${isVisible['client-1'] ? 'fade-in-up' : ''}`} id="client-1">
              <div className="client-icon">🍽️</div>
              <h3>Restauration</h3>
              <p>Restaurants, hôtels, traiteurs et établissements de restauration</p>
            </div>
            <div className={`client-card ${isVisible['client-2'] ? 'fade-in-up' : ''}`} id="client-2">
              <div className="client-icon">🏫</div>
              <h3>Collectivités</h3>
              <p>Écoles, hôpitaux, maisons de retraite et établissements publics</p>
            </div>
            <div className={`client-card ${isVisible['client-3'] ? 'fade-in-up' : ''}`} id="client-3">
              <div className="client-icon">📦</div>
              <h3>Grossistes</h3>
              <p>Distributeurs et grossistes en fruits et légumes</p>
            </div>
            <div className={`client-card ${isVisible['client-4'] ? 'fade-in-up' : ''}`} id="client-4">
              <div className="client-icon">🏪</div>
              <h3>Détaillants</h3>
              <p>Commerces de détail, épiceries et magasins spécialisés</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Portail Client */}
      <section className="cta-portal-section">
        <div className="container">
          <div className="cta-portal-content">
            <div className={`cta-portal-text ${isVisible['cta-portal'] ? 'fade-in-left' : ''}`} id="cta-portal">
              <h2>Commandez vos produits 24h/24 avec notre portail client dédié !</h2>
              <Link to="/login" className="btn-acceder-portal">
                Accéder au portail
              </Link>
            </div>
            <div className={`cta-portal-image ${isVisible['cta-portal'] ? 'fade-in-right' : ''}`}>
              <div className="portal-image-placeholder">
                <span className="portal-icon">💻</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Contact */}
      <section className="cta-contact-section">
        <div className="container">
          <div className="cta-contact-content">
            <div className={`cta-contact-text ${isVisible['cta-contact'] ? 'fade-in-left' : ''}`} id="cta-contact">
              <h2>Besoin d'aide ? Toutes nos équipes sont à votre écoute.</h2>
              <Link to="#contact" className="btn-nous-contacter">
                Nous contacter
              </Link>
            </div>
            <div className={`cta-contact-image ${isVisible['cta-contact'] ? 'fade-in-right' : ''}`}>
              <div className="contact-image-placeholder">
                <span className="contact-icon">👥</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section footer-logo-section">
              <div className="footer-logo">
                <span className="logo-icon">🍎</span>
                <span className="logo-text">Fruits & Légumes</span>
              </div>
              <p className="footer-address">
                123 Rue de la Distribution<br />
                75000 Paris, France
              </p>
              <p className="footer-phone">01 34 86 79 00</p>
              <p className="footer-email">contact@fruits-legumes.fr</p>
              <div className="footer-social">
                <a href="#" className="social-icon">📘</a>
                <a href="#" className="social-icon">📷</a>
                <a href="#" className="social-icon">💼</a>
              </div>
            </div>
            <div className="footer-section">
              <h4>Navigation</h4>
              <ul>
                <li><a href="#accueil">Accueil</a></li>
                <li><a href="#produits">Nos Produits</a></li>
                <li><a href="#services">Nos Services</a></li>
                <li><a href="#engagements">Nos Engagements</a></li>
                <li><a href="#clients">Nos Clients</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Nos Produits</h4>
              <ul>
                <li><a href="#produits">La saisonnalité</a></li>
                <li><a href="#produits">Nos producteurs</a></li>
                <li><a href="#produits">Nos engagements</a></li>
                <li><a href="#produits">Nos certifications</a></li>
                <li><a href="#produits">Nos marques</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Nos Services</h4>
              <ul>
                <li><a href="#services">Catalogue en ligne</a></li>
                <li><a href="#services">Gestion des commandes</a></li>
                <li><a href="#services">Suivi en temps réel</a></li>
                <li><a href="#services">Gestion de stock</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Recrutement</h4>
              <ul>
                <li><a href="#">Chauffeur-Livreur</a></li>
                <li><a href="#">Préparateur de commandes</a></li>
                <li><a href="#">Commercial</a></li>
                <li><a href="#">Voir toutes les offres</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Fruits & Légumes - Tous droits réservés.</p>
            <div className="footer-legal">
              <a href="#">Mentions légales</a>
              <span> | </span>
              <a href="#">Politique de confidentialité</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

