import React, { useState } from 'react';
import api, { getServerBaseURL } from '../../services/api';
import { toast } from 'react-toastify';
import './AdminReports.css';

const AdminReports = () => {
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async (format = 'json') => {
    if (!startDate || !endDate) {
      toast.error('Veuillez sélectionner une période');
      return;
    }

    try {
      setLoading(true);
      const params = {
        startDate,
        endDate,
        format,
      };

      if (reportType === 'sales') {
        const url = `${getServerBaseURL()}/api/reports/sales?${new URLSearchParams(params)}`;
        if (format === 'excel') {
          window.open(url, '_blank');
          toast.success('Téléchargement du rapport Excel...');
        } else {
          const response = await api.get('/reports/sales', { params: { startDate, endDate } });
          // Afficher les données dans une modal ou une section
          console.log('Rapport:', response.data);
          toast.success('Rapport généré avec succès');
        }
      } else if (reportType === 'products') {
        const response = await api.get('/reports/products', { params: { startDate, endDate } });
        console.log('Rapport produits:', response.data);
        toast.success('Rapport généré avec succès');
      }
    } catch (error) {
      toast.error('Erreur lors de la génération du rapport');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-reports">
      <h1>📊 Rapports</h1>

      <div className="reports-container">
        <div className="reports-filters">
          <div className="form-group">
            <label>Type de rapport</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="sales">Rapport de ventes</option>
              <option value="products">Rapport des produits</option>
            </select>
          </div>

          <div className="form-group">
            <label>Date de début</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Date de fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="reports-actions">
          <button
            className="btn btn-primary"
            onClick={() => handleGenerateReport('json')}
            disabled={loading}
          >
            {loading ? 'Génération...' : '📊 Générer (JSON)'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleGenerateReport('excel')}
            disabled={loading}
          >
            📥 Générer (Excel)
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
