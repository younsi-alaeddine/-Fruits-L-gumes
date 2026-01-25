import React from 'react'
import { useCart } from '../contexts/CartContext'

function CartSummary({ onSaveDraft, onSendOrder }) {
  const { items, total } = useCart()

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
      <h2 className="text-xl font-semibold mb-4">Résumé de la commande</h2>
      
      {items.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Votre panier est vide</p>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center border-b pb-2">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">Qté: {item.quantity}</p>
                </div>
                <p className="font-semibold">{(item.price * item.quantity).toFixed(2)} €</p>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 mb-6">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span className="text-green-600">{total.toFixed(2)} €</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={onSendOrder}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Envoyer la commande
            </button>
            <button
              onClick={onSaveDraft}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Sauvegarder comme brouillon
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default CartSummary
