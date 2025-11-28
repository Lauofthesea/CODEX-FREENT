// Notification System for FREENT
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, onSnapshot, updateDoc, doc, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAao4TBFvMR099d5sEfvX1I65d0LCAJUZw",
  authDomain: "lineshub-98e0f.firebaseapp.com",
  projectId: "lineshub-98e0f",
  storageBucket: "lineshub-98e0f.appspot.com",
  messagingSenderId: "427905073524",
  appId: "1:427905073524:web:95cb66ffeabf011087ec21"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let notificationUnsubscribe = null;

// Initialize notification system
export function initNotifications() {
  const userEmail = sessionStorage.getItem('userEmail');
  const isLoggedIn = sessionStorage.getItem('userLoggedIn');
  
  if (!isLoggedIn || !userEmail) {
    return;
  }
  
  // Show notification bell
  const notificationBell = document.getElementById('notificationBell');
  if (notificationBell) {
    notificationBell.style.display = 'block';
  }
  
  // Listen for real-time notifications
  listenForNotifications(userEmail);
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notificationDropdown');
    const btn = document.querySelector('.notification-btn');
    
    if (dropdown && !dropdown.contains(e.target) && !btn.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });
}

// Listen for real-time notifications
function listenForNotifications(userEmail) {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userEmail', '==', userEmail)
  );
  
  notificationUnsubscribe = onSnapshot(q, (snapshot) => {
    const notifications = [];
    snapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by timestamp in JavaScript instead of Firestore
    notifications.sort((a, b) => {
      const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
      const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
      return timeB - timeA; // Descending order (newest first)
    });
    
    updateNotificationUI(notifications);
  }, (error) => {
    console.error('Error listening to notifications:', error);
    // Show empty state on error
    updateNotificationUI([]);
  });
}

// Update notification UI
function updateNotificationUI(notifications) {
  const badge = document.getElementById('notificationBadge');
  const dropdownList = document.getElementById('notificationDropdownList');
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Update badge
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }
  
  // Update dropdown list
  if (dropdownList) {
    if (notifications.length === 0) {
      dropdownList.innerHTML = `
        <div class="notification-empty">
          <i class="fas fa-bell-slash"></i>
          <p>No notifications yet</p>
        </div>
      `;
    } else {
      dropdownList.innerHTML = notifications.slice(0, 5).map(notif => `
        <div class="notification-dropdown-item ${notif.read ? '' : 'unread'}" onclick="handleNotificationClick('${notif.id}', '${notif.orderId}')">
          <div class="notification-icon ${notif.type}">
            <i class="fas ${getNotificationIcon(notif.type)}"></i>
          </div>
          <div class="notification-content">
            <div class="notification-title">${notif.title}</div>
            <div class="notification-message">${notif.message}</div>
            <div class="notification-time">${formatTime(notif.timestamp)}</div>
          </div>
        </div>
      `).join('');
    }
  }
  
  // Update full notifications page if on user.html
  updateFullNotificationsPage(notifications);
}

// Get notification icon based on type
function getNotificationIcon(type) {
  switch (type) {
    case 'status-update':
      return 'fa-sync-alt';
    case 'message':
      return 'fa-comment';
    case 'order-complete':
      return 'fa-check-circle';
    default:
      return 'fa-bell';
  }
}

// Format timestamp
function formatTime(timestamp) {
  if (!timestamp) return 'Just now';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // seconds
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  
  return date.toLocaleDateString();
}

// Toggle notification dropdown
window.toggleNotificationDropdown = function() {
  const dropdown = document.getElementById('notificationDropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
};

// Handle notification click
window.handleNotificationClick = async function(notificationId, orderId) {
  // Mark as read
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
  
  // Redirect to user.html with order ID
  window.location.href = `user.html?orderId=${orderId}`;
};

// Mark all notifications as read
window.markAllNotificationsRead = async function() {
  const userEmail = sessionStorage.getItem('userEmail');
  if (!userEmail) return;
  
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userEmail', '==', userEmail),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(q);
    const updates = [];
    
    snapshot.forEach((docSnap) => {
      updates.push(updateDoc(doc(db, 'notifications', docSnap.id), { read: true }));
    });
    
    await Promise.all(updates);
    
    // Close dropdown
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
      dropdown.classList.remove('active');
    }
  } catch (error) {
    console.error('Error marking all as read:', error);
  }
};

// Update full notifications page (user.html)
function updateFullNotificationsPage(notifications) {
  const notificationsList = document.getElementById('notificationsList');
  if (!notificationsList) return; // Not on user.html
  
  if (notifications.length === 0) {
    notificationsList.innerHTML = `
      <div class="no-notifications">
        <i class="fas fa-bell-slash"></i>
        <h3>No Notifications</h3>
        <p>You're all caught up! We'll notify you when there are updates to your orders.</p>
      </div>
    `;
  } else {
    notificationsList.innerHTML = notifications.map(notif => `
      <div class="notification-item ${notif.read ? '' : 'unread'}" onclick="handleNotificationClick('${notif.id}', '${notif.orderId}')">
        <div class="notification-header-row">
          <div class="notification-title">
            <i class="fas ${getNotificationIcon(notif.type)}"></i>
            ${notif.title}
          </div>
          <div class="notification-time">${formatTime(notif.timestamp)}</div>
        </div>
        <div class="notification-message">${notif.message}</div>
        <div class="notification-order-id">Order: ${notif.orderId}</div>
      </div>
    `).join('');
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotifications);
} else {
  initNotifications();
}
