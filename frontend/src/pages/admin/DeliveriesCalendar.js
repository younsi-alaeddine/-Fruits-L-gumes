import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './AdminDeliveriesCalendar.css';

const localizer = momentLocalizer(moment);

const DeliveriesCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const response = await api.get('/deliveries/calendar', {
        params: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      });
      setEvents(response.data.events || []);
    } catch (error) {
      toast.error('Erreur lors du chargement du calendrier');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event) => {
    alert(`Livraison: ${event.title}\nClient: ${event.resource?.order?.shop?.name}`);
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="deliveries-calendar">
      <h1>🗓️ Calendrier des Livraisons</h1>
      <div className="calendar-container">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          onSelectEvent={handleSelectEvent}
          messages={{
            next: 'Suivant',
            previous: 'Précédent',
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour',
            agenda: 'Agenda',
            date: 'Date',
            time: 'Heure',
            event: 'Événement',
            noEventsInRange: 'Aucune livraison dans cette période',
          }}
        />
      </div>
    </div>
  );
};

export default DeliveriesCalendar;
