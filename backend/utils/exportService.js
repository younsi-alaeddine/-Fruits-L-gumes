const ExcelJS = require('exceljs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const logger = require('./logger');

/**
 * Exporter les commandes en Excel
 */
const exportOrdersToExcel = async (orders, filename = 'commandes') => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Commandes');

    // En-têtes
    worksheet.columns = [
      { header: 'ID Commande', key: 'id', width: 15 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Magasin', key: 'shopName', width: 25 },
      { header: 'Ville', key: 'city', width: 20 },
      { header: 'Statut', key: 'status', width: 15 },
      { header: 'Statut Paiement', key: 'paymentStatus', width: 15 },
      { header: 'Total HT', key: 'totalHT', width: 12 },
      { header: 'Total TVA', key: 'totalTVA', width: 12 },
      { header: 'Total TTC', key: 'totalTTC', width: 12 },
      { header: 'Nb Produits', key: 'nbProducts', width: 12 },
    ];

    // Style des en-têtes
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF28a745' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Données
    orders.forEach(order => {
      const date = new Date(order.createdAt);
      worksheet.addRow({
        id: order.id.substring(0, 8),
        date: date.toLocaleDateString('fr-FR'),
        shopName: order.shop?.name || 'N/A',
        city: order.shop?.city || 'N/A',
        status: getStatusLabel(order.status),
        paymentStatus: getPaymentStatusLabel(order.paymentStatus),
        totalHT: order.totalHT.toFixed(2),
        totalTVA: order.totalTVA.toFixed(2),
        totalTTC: order.totalTTC.toFixed(2),
        nbProducts: order.items?.length || 0,
      });
    });

    // Formater les colonnes numériques
    worksheet.getColumn('totalHT').numFmt = '#,##0.00 €';
    worksheet.getColumn('totalTVA').numFmt = '#,##0.00 €';
    worksheet.getColumn('totalTTC').numFmt = '#,##0.00 €';

    // Ligne de total
    const totalRow = worksheet.addRow({});
    totalRow.getCell('totalHT').value = {
      formula: `SUM(G2:G${orders.length + 1})`,
    };
    totalRow.getCell('totalTVA').value = {
      formula: `SUM(H2:H${orders.length + 1})`,
    };
    totalRow.getCell('totalTTC').value = {
      formula: `SUM(I2:I${orders.length + 1})`,
    };
    totalRow.font = { bold: true };
    totalRow.getCell('shopName').value = 'TOTAL';

    // Générer le buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  } catch (error) {
    logger.error('Erreur export Excel commandes', { error: error.message });
    throw error;
  }
};

/**
 * Exporter les commandes en CSV
 */
const exportOrdersToCSV = async (orders, filename = 'commandes') => {
  try {
    // Créer le contenu CSV manuellement
    const headers = [
      'ID Commande',
      'Date',
      'Magasin',
      'Ville',
      'Statut',
      'Statut Paiement',
      'Total HT',
      'Total TVA',
      'Total TTC',
      'Nb Produits',
    ];

    const rows = orders.map(order => {
      const date = new Date(order.createdAt);
      return [
        order.id.substring(0, 8),
        date.toLocaleDateString('fr-FR'),
        (order.shop?.name || 'N/A').replace(/"/g, '""'),
        (order.shop?.city || 'N/A').replace(/"/g, '""'),
        getStatusLabel(order.status),
        getPaymentStatusLabel(order.paymentStatus),
        order.totalHT.toFixed(2).replace('.', ','),
        order.totalTVA.toFixed(2).replace('.', ','),
        order.totalTTC.toFixed(2).replace('.', ','),
        order.items?.length || 0,
      ];
    });

    // Formater en CSV (avec guillemets pour les champs contenant des virgules)
    const csvRows = [
      headers.map(h => `"${h}"`).join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';')),
    ];

    return csvRows.join('\n');
  } catch (error) {
    logger.error('Erreur export CSV commandes', { error: error.message });
    throw error;
  }
};

/**
 * Exporter les statistiques en Excel
 */
const exportStatisticsToExcel = async (stats, period, filename = 'statistiques') => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Feuille 1: Résumé
    const summarySheet = workbook.addWorksheet('Résumé');
    summarySheet.columns = [
      { header: 'Métrique', key: 'metric', width: 30 },
      { header: 'Valeur', key: 'value', width: 20 },
    ];

    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF28a745' },
    };
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    summarySheet.addRow({ metric: 'Période', value: period });
    summarySheet.addRow({ metric: 'Total Commandes', value: stats.totalOrders || 0 });
    summarySheet.addRow({ metric: 'Total HT', value: `€ ${(stats.totalHT || 0).toFixed(2)}` });
    summarySheet.addRow({ metric: 'Total TVA', value: `€ ${(stats.totalTVA || 0).toFixed(2)}` });
    summarySheet.addRow({ metric: 'Total TTC', value: `€ ${(stats.totalTTC || 0).toFixed(2)}` });

    // Feuille 2: Totaux par magasin
    if (stats.totalsByShop && stats.totalsByShop.length > 0) {
      const shopsSheet = workbook.addWorksheet('Totaux par Magasin');
      shopsSheet.columns = [
        { header: 'Magasin', key: 'shopName', width: 25 },
        { header: 'Ville', key: 'city', width: 20 },
        { header: 'Nb Commandes', key: 'nbOrders', width: 15 },
        { header: 'Total HT', key: 'totalHT', width: 15 },
        { header: 'Total TVA', key: 'totalTVA', width: 15 },
        { header: 'Total TTC', key: 'totalTTC', width: 15 },
      ];

      shopsSheet.getRow(1).font = { bold: true };
      shopsSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF28a745' },
      };
      shopsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      stats.totalsByShop.forEach(item => {
        shopsSheet.addRow({
          shopName: item.shopName,
          city: item.shopCity,
          nbOrders: item.count || 0,
          totalHT: item.totalHT.toFixed(2),
          totalTVA: item.totalTVA.toFixed(2),
          totalTTC: item.totalTTC.toFixed(2),
        });
      });

      shopsSheet.getColumn('totalHT').numFmt = '#,##0.00 €';
      shopsSheet.getColumn('totalTVA').numFmt = '#,##0.00 €';
      shopsSheet.getColumn('totalTTC').numFmt = '#,##0.00 €';
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  } catch (error) {
    logger.error('Erreur export Excel statistiques', { error: error.message });
    throw error;
  }
};

/**
 * Helper pour les labels de statut
 */
const getStatusLabel = (status) => {
  const labels = {
    NEW: 'Nouvelle',
    PREPARATION: 'En préparation',
    LIVRAISON: 'En livraison',
    LIVREE: 'Livrée',
    ANNULEE: 'Annulée',
  };
  return labels[status] || status;
};

/**
 * Helper pour les labels de statut de paiement
 */
const getPaymentStatusLabel = (status) => {
  const labels = {
    EN_ATTENTE: 'En attente',
    PAYE: 'Payé',
    IMPAYE: 'Impayé',
    REMBOURSE: 'Remboursé',
  };
  return labels[status] || status;
};

module.exports = {
  exportOrdersToExcel,
  exportOrdersToCSV,
  exportStatisticsToExcel,
};

