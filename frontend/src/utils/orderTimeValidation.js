/**
 * Validation des horaires de commande
 * Règles métier Fattah :
 * - Magasins peuvent commander entre 12h00 et 20h00
 * - ADMIN voit commandes à partir de 00h00 le lendemain
 * - Livraison recommandée : 10h00-12h00
 */

/**
 * Vérifie si l'heure actuelle est dans la plage autorisée pour passer commande (12h-20h)
 * @returns {Object} { allowed: boolean, message: string, currentHour: number }
 */
export const isOrderTimeAllowed = () => {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  
  // Plage autorisée : 12h00 à 20h00
  const START_HOUR = 12
  const END_HOUR = 20
  
  const currentTimeInMinutes = currentHour * 60 + currentMinute
  const startTimeInMinutes = START_HOUR * 60
  const endTimeInMinutes = END_HOUR * 60
  
  const allowed = currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes
  
  if (!allowed) {
    if (currentHour < START_HOUR) {
      return {
        allowed: false,
        message: `Les commandes sont acceptées uniquement entre 12h00 et 20h00. Il est actuellement ${currentHour}h${currentMinute.toString().padStart(2, '0')}. Veuillez réessayer à partir de 12h00.`,
        currentHour,
        nextAvailableTime: '12h00 aujourd\'hui',
      }
    } else {
      return {
        allowed: false,
        message: `Les commandes sont acceptées uniquement entre 12h00 et 20h00. Il est actuellement ${currentHour}h${currentMinute.toString().padStart(2, '0')}. Les commandes sont fermées pour aujourd'hui. Prochaine ouverture : demain à 12h00.`,
        currentHour,
        nextAvailableTime: '12h00 demain',
      }
    }
  }
  
  return {
    allowed: true,
    message: `Vous pouvez passer commande jusqu'à 20h00. Il est actuellement ${currentHour}h${currentMinute.toString().padStart(2, '0')}.`,
    currentHour,
    remainingTime: `${20 - currentHour}h${59 - currentMinute}min`,
  }
}

/**
 * Vérifie si ADMIN peut voir les commandes (à partir de 00h00 le lendemain)
 * @param {Date} orderDate - Date de la commande
 * @returns {boolean}
 */
export const canAdminSeeOrder = (orderDate) => {
  const now = new Date()
  const order = new Date(orderDate)
  
  // ADMIN voit les commandes du jour précédent à partir de 00h00
  // Si commande passée hier ou avant, ADMIN peut voir
  const orderDayStart = new Date(order.getFullYear(), order.getMonth(), order.getDate())
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  return orderDayStart < todayStart
}

/**
 * Vérifie si l'heure actuelle est dans la fenêtre de livraison recommandée (10h-12h)
 * @returns {Object} { inWindow: boolean, message: string }
 */
export const isInDeliveryWindow = () => {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  
  const DELIVERY_START = 10
  const DELIVERY_END = 12
  
  const currentTimeInMinutes = currentHour * 60 + currentMinute
  const deliveryStartInMinutes = DELIVERY_START * 60
  const deliveryEndInMinutes = DELIVERY_END * 60
  
  const inWindow = currentTimeInMinutes >= deliveryStartInMinutes && currentTimeInMinutes < deliveryEndInMinutes
  
  return {
    inWindow,
    message: inWindow
      ? '✅ Fenêtre de livraison optimale (10h-12h)'
      : '⏰ Livraison hors fenêtre recommandée (10h-12h), mais acceptée',
    currentTime: `${currentHour}h${currentMinute.toString().padStart(2, '0')}`,
  }
}

/**
 * Formate un message d'information sur les horaires pour l'utilisateur
 * @param {string} role - Rôle de l'utilisateur (SHOP, MANAGER, ADMIN)
 * @returns {string}
 */
export const getOrderingHoursInfo = (role) => {
  if (role === 'ADMIN') {
    return '📋 Vous recevez les commandes des magasins à partir de 00h00 chaque jour.'
  }
  
  if (role === 'MANAGER' || role === 'SHOP') {
    const { allowed, message } = isOrderTimeAllowed()
    return `🕐 ${message}`
  }
  
  return ''
}

/**
 * Calcule le temps restant avant la fin de la plage horaire
 * @returns {string}
 */
export const getRemainingOrderTime = () => {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  
  if (currentHour >= 20) {
    return 'Fermé'
  }
  
  if (currentHour < 12) {
    const hoursUntilOpen = 12 - currentHour - 1
    const minutesUntilOpen = 60 - currentMinute
    return `Ouvre dans ${hoursUntilOpen}h${minutesUntilOpen}min`
  }
  
  const hoursRemaining = 19 - currentHour
  const minutesRemaining = 60 - currentMinute
  return `${hoursRemaining}h${minutesRemaining}min restantes`
}
