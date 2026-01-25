import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import './Messages.css';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageType, setMessageType] = useState('received');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    toUserId: '',
    subject: '',
    content: '',
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchMessages();
    if (showForm) {
      fetchUsers();
    }
  }, [messageType, showForm]);

  const fetchMessages = async () => {
    try {
      const response = await api.get('/messages', { params: { type: messageType } });
      setMessages(response.data.messages || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/messages', formData);
      toast.success('Message envoyé avec succès');
      setShowForm(false);
      setFormData({ toUserId: '', subject: '', content: '' });
      fetchMessages();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/messages/${id}/read`);
      setMessages(prev =>
        prev.map(m => (m.id === id ? { ...m, read: true, readAt: new Date() } : m))
      );
    } catch (error) {
      toast.error('Erreur lors du marquage');
    }
  };

  return (
    <div className="messages">
      <div className="messages-header">
        <h1>💬 Messagerie</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '+ Nouveau message'}
        </button>
      </div>

      <div className="messages-tabs">
        <button
          className={`tab ${messageType === 'received' ? 'active' : ''}`}
          onClick={() => { setMessageType('received'); setShowForm(false); }}
        >
          Reçus
        </button>
        <button
          className={`tab ${messageType === 'sent' ? 'active' : ''}`}
          onClick={() => { setMessageType('sent'); setShowForm(false); }}
        >
          Envoyés
        </button>
      </div>

      {showForm && (
        <div className="message-form-container">
          <h2>Nouveau message</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Destinataire</label>
              <select
                value={formData.toUserId}
                onChange={(e) => setFormData({ ...formData, toUserId: e.target.value })}
                required
              >
                <option value="">Sélectionner un utilisateur</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Sujet</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows="6"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Envoyer</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : messages.length === 0 ? (
        <div className="empty-state">Aucun message</div>
      ) : (
        <div className="messages-list">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-item ${!message.read && messageType === 'received' ? 'unread' : ''}`}
              onClick={() => messageType === 'received' && !message.read && handleMarkAsRead(message.id)}
            >
              <div className="message-header">
                <div>
                  <strong>{messageType === 'received' ? message.fromUser?.name : message.toUser?.name}</strong>
                  {message.subject && <span className="message-subject"> - {message.subject}</span>}
                </div>
                <span className="message-date">
                  {format(new Date(message.createdAt), 'PPpp', { locale: fr })}
                </span>
              </div>
              <div className="message-content">{message.content}</div>
              {!message.read && messageType === 'received' && (
                <span className="unread-badge">Non lu</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages;
