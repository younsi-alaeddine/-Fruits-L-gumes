import React from 'react';
import * as TablerIcons from '@tabler/icons-react';

/**
 * Composant helper pour utiliser facilement les icônes Tabler
 * 
 * Usage:
 * <Icon name="Dashboard" size={24} color="#28a745" />
 * <Icon name="ShoppingCart" size={20} />
 */
const Icon = ({ name, size = 24, color = 'currentColor', stroke = 2, className = '', ...props }) => {
  // Convertir le nom en format Tabler (ex: "Dashboard" -> "IconDashboard")
  const iconName = name.startsWith('Icon') ? name : `Icon${name}`;
  
  // Récupérer l'icône depuis Tabler Icons
  const IconComponent = TablerIcons[iconName];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in Tabler Icons. Available icons: https://tabler.io/icons`);
    // Retourner une icône par défaut ou null
    return null;
  }
  
  return (
    <IconComponent
      size={size}
      stroke={stroke}
      color={color}
      className={className}
      {...props}
    />
  );
};

export default Icon;

/**
 * Mapping des emojis vers les icônes Tabler pour faciliter la migration
 */
export const iconMap = {
  // Navigation
  '📊': 'IconChartBar',
  '📦': 'IconPackage',
  '📋': 'IconClipboardList',
  '🛍️': 'IconShoppingCart',
  '📁': 'IconFolder',
  '🏪': 'IconBuildingStore',
  '👥': 'IconUsers',
  '💳': 'IconCreditCard',
  '📄': 'IconFileText',
  '🏷️': 'IconTag',
  '🗓️': 'IconCalendar',
  '🔔': 'IconBell',
  '⚙️': 'IconSettings',
  '🛒': 'IconShoppingCart',
  '💰': 'IconCurrencyEuro',
  '🔄': 'IconRefresh',
  '👤': 'IconUser',
  '🚚': 'IconTruck',
  '💼': 'IconBriefcase',
  '💬': 'IconMessage',
  '🔍': 'IconSearch',
  '🍎': 'IconApple',
  '📅': 'IconCalendar',
  '⚠️': 'IconAlertTriangle',
  '✅': 'IconCheck',
  '❌': 'IconX',
  '➕': 'IconPlus',
  '✕': 'IconX',
  '☰': 'IconMenu2',
};
