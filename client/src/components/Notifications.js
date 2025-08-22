import React, { useContext, useState, useEffect } from 'react';
import { NotificationContext } from '../context/NotificationContext';
import '../styles/Notifications.css';

const Notifications = () => {
  const { notifications, setNotifications } = useContext(NotificationContext);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      });
      
      setNotifications(prev =>
        prev.map(notification =>
          notification._id === id ? { ...notification, isRead: true } : notification
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await fetch('/api/notifications/clear', {
        method: 'DELETE',
      });
      setNotifications([]);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'purchase':
        return '🛒';
      case 'transfer':
        return '🔄';
      case 'assignment':
        return '📋';
      default:
        return '📢';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMs = now - notificationDate;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${diffInDays}d ago`;
  };

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.notifications-panel') && 
          !event.target.closest('.notification-bell')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Notification Bell */}
      <button 
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <div className={`notifications-panel ${isOpen ? 'open' : ''}`}>
        <div className="notifications-header">
          <h3 className="notifications-title">
            Notifications ({unreadCount} unread)
          </h3>
          {notifications.length > 0 && (
            <button 
              className="clear-all-btn"
              onClick={clearAllNotifications}
            >
              Clear All
            </button>
          )}
        </div>

        <ul className="notifications-list">
          {notifications.length === 0 ? (
            <div className="empty-notifications">
              <div className="empty-icon">🔕</div>
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <li
                key={notification._id}
                className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                onClick={() => markAsRead(notification._id)}
              >
                <div className="notification-content">
                  <div className={`notification-icon ${notification.type}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-text">
                    <p className="notification-message">
                      {notification.message}
                    </p>
                    <p className="notification-time">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </>
  );
};

export default Notifications;
