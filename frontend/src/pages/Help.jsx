import React, { useRef } from 'react'
import { HelpCircle, Book, Video, MessageCircle, ChevronDown, Mail, ExternalLink } from 'lucide-react'

const SUPPORT_EMAIL = 'support@fatah-commander.cloud'

function Help() {
  const faqRef = useRef(null)

  const scrollToFaq = () => {
    faqRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
        Centre d'Aide
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button
          type="button"
          onClick={scrollToFaq}
          className="card card-hover text-center transition-all hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <Book className="h-16 w-16 text-primary-600 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">Documentation</h3>
          <p className="text-sm text-gray-600">Guides et FAQ</p>
          <span className="inline-flex items-center gap-1 text-xs text-primary-600 mt-2">
            Voir la FAQ <ChevronDown className="h-4 w-4" />
          </span>
        </button>
        <button
          type="button"
          onClick={scrollToFaq}
          className="card card-hover text-center transition-all hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <Video className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">Tutoriels</h3>
          <p className="text-sm text-gray-600">Comment utiliser la plateforme</p>
          <span className="inline-flex items-center gap-1 text-xs text-blue-600 mt-2">
            Voir la FAQ <ExternalLink className="h-4 w-4" />
          </span>
        </button>
        <button
          type="button"
          onClick={scrollToFaq}
          className="card card-hover text-center transition-all hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <HelpCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">FAQ</h3>
          <p className="text-sm text-gray-600">Questions fréquentes</p>
        </button>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="card card-hover text-center transition-all hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary-500 no-underline text-inherit"
        >
          <MessageCircle className="h-16 w-16 text-orange-600 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">Support</h3>
          <p className="text-sm text-gray-600">Contactez-nous</p>
          <span className="inline-flex items-center gap-1 text-xs text-orange-600 mt-2">
            <Mail className="h-4 w-4" /> {SUPPORT_EMAIL}
          </span>
        </a>
      </div>

      <div className="card scroll-mt-8" ref={faqRef}>
        <h2 className="text-2xl font-bold mb-6">Questions Fréquentes</h2>
        <div className="space-y-4">
          <details className="group p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
              Comment passer une commande ?
              <ChevronDown className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="mt-3 text-gray-600">
              En tant que <strong>client</strong>, les commandes peuvent être passées entre 12h et 20h. Rendez-vous dans
              « Commandes » → « Nouvelle commande », choisissez votre magasin, ajoutez les produits au panier puis
              validez. Vous recevrez une confirmation par email.
            </p>
          </details>
          <details className="group p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
              Quand puis-je voir mes commandes en tant qu'ADMIN ?
              <ChevronDown className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="mt-3 text-gray-600">
              Les commandes des magasins sont visibles à partir de 00h00 le lendemain. L'ADMIN agrège les commandes,
              crée les commandes fournisseur et suit la préparation jusqu'à la livraison.
            </p>
          </details>
          <details className="group p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
              Quelle est la fenêtre de livraison recommandée ?
              <ChevronDown className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="mt-3 text-gray-600">
              La fenêtre optimale est de <strong>10h à 12h</strong>. Les commandes sont préparées la veille et livrées
              le lendemain matin. Vous recevez une notification lors de la fenêtre de livraison.
            </p>
          </details>
          <details className="group p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
              Comment gérer mes magasins (client) ?
              <ChevronDown className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="mt-3 text-gray-600">
              Allez dans « Magasins » pour voir la liste de vos magasins, leurs adresses et statistiques. Vous pouvez
              cliquer sur « Voir les détails » pour un magasin ou « Commandes » pour filtrer les commandes par magasin.
            </p>
          </details>
          <details className="group p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
              Mon email n'est pas vérifié, que faire ?
              <ChevronDown className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="mt-3 text-gray-600">
              Dans « Paramètres », utilisez « Renvoyer l'email de vérification ». Consultez votre boîte de réception et
              les spams, puis cliquez sur le lien reçu. Une fois vérifié, l'alerte disparaît.
            </p>
          </details>
        </div>
      </div>
    </div>
  )
}

export default Help
