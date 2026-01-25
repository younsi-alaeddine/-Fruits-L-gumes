import React from 'react';
import { useNavigate } from 'react-router-dom';
const Home = () => {
    const navigate = useNavigate();
    return (
        <div>
            <h1>Bienvenue sur Fatah Commander</h1>
            <p>Fatah Commander est une application de gestion de commandes pour les entreprises.</p>
            <button onClick={() => navigate('/login')}>Connexion</button>
        </div>
    );
};

export default Home;