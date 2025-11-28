# 🔔 FREENT Notification System

## Overview
Real-time notification system that alerts users when admins update order status or send messages.

## Features

### 1. **Notification Bell Icon**
- 🔔 Located in header next to user name
- 💎 Gold-themed design matching FREENT
- 🔴 Red badge showing unread count
- ✨ Pulse animation on badge
- 📱 Responsive on all devices

### 2. **Notification Dropdown**
- 📋 Shows last 5 notifications
- 🎨 Dark theme with gold accents
- ⚡ Real-time updates (no refresh needed)
- 👆 Click notification to view order details
- ✅ "Mark all as read" button
- 🔗 "View All" link to full notifications page

### 3. **Full Notifications Page (user.html)**
- 📜 Complete notification history
- 🔍 Filter by read/unread
- 📊 Organized by date
- 💬 Shows full message content
- 🎯 Click to view order tracking

### 4. **Notification Types**
- 📦 **Status Update** - Order status changed
- 💬 **Message** - Admin sent a message
- ✅ **Order Complete** - Order delivered

## Admin Integration

### When Admin Updates Order Status:
1. Admin changes status in dashboard
2. System creates notification with:
   - `userEmail`: Customer's email
   - `orderId`: Order ID
   - `title`: "Order Status Updated"
   - `message`: Status-specific message
   - `type`: "status-update"
   - `timestamp`: Server timestamp

### When Admin Sends Message:
1. Admin sends message in conversation
2. System creates notification with:
   - `userEmail`: Customer's email
   - `orderId`: Related order ID
   - `title`: "New Message from Admin"
   - `message`: Message preview (first 100 chars)
   - `type`: "message"
   - `timestamp`: Server timestamp

### Status Messages:
- **Pending**: "Your order is being reviewed."
- **On Production**: "Your order is now in production!"
- **On Delivery**: "Your order is out for delivery!"
- **Delivered**: "Your order has been delivered!"
- **Complete**: "Your order is complete. Thank you for your business!"

## How It Works

### For Users:
1. **Receive Notifications**
   - Bell icon appears when logged in
   - Badge shows unread count
   - Real-time updates (instant)

2. **View Notifications**
   - Click bell icon for dropdown
   - See recent notifications
   - Click "View All" for full page

3. **Interact with Notifications**
   - Click notification → redirects to order tracking
   - Automatically marks as read
   - "Mark all read" clears all unread

### For Admins:
When admin updates order status or sends message, system automatically:
1. Creates notification in Firestore
2. User sees it instantly (real-time)
3. Badge updates with count
4. User gets notified

## Database Structure

### Notifications Collection
```javascript
{
  userEmail: "user@example.com",
  orderId: "ORD-123456",
  type: "status-update", // or "message", "order-complete"
  title: "Order Status Updated",
  message: "Your order is now in production",
  timestamp: Firestore.Timestamp,
  read: false
}
```

**Note:** Notifications are sorted by timestamp in JavaScript (client-side) to avoid requiring a Firestore composite index. This keeps the setup simple while maintaining performance.

## Files Modified

### HTML Files:
- ✅ `index.html` - Added notification bell
- ✅ `dashboard.html` - Added notification bell
- ✅ `user.html` - Added notification bell + full page

### CSS Files:
- ✅ `css-files/index.css` - Notification styles

### JavaScript Files:
- ✅ `js-files/notifications.js` - Complete notification system

## Usage

### Initialize Notifications
```javascript
// Automatically initializes on page load
// Shows bell icon only when user is logged in
```

### Toggle Dropdown
```javascript
toggleNotificationDropdown()
```

### Mark All as Read
```javascript
markAllNotificationsRead()
```

### Handle Notification Click
```javascript
handleNotificationClick(notificationId, orderId)
// Marks as read and redirects to order tracking
```

## Styling

### Colors:
- **Primary**: Gold (#FFD700)
- **Background**: Dark gradient (#1a1a1a to #2d2d2d)
- **Badge**: Red gradient (#ef4444 to #dc2626)
- **Unread**: Gold highlight

### Animations:
- Badge pulse effect
- Dropdown slide down
- Hover effects on items

## Real-Time Updates

Uses Firebase Firestore `onSnapshot` for real-time listening:
- No page refresh needed
- Instant notification delivery
- Automatic UI updates
- Badge count updates live

## Mobile Responsive

- ✅ Bell icon scales properly
- ✅ Dropdown adjusts to screen width
- ✅ Touch-friendly tap targets
- ✅ Scrollable notification list

## Future Enhancements

Potential additions:
- 🔊 Sound notifications
- 📧 Email notifications
- 🔔 Push notifications (PWA)
- 🎯 Notification preferences
- 📅 Notification history archive
- 🔍 Search notifications

## Testing

To test the notification system:
1. Login as a user
2. Place an order
3. Login as admin
4. Update order status or send message
5. Check user's notification bell
6. Badge should show count
7. Click to see notification
8. Click notification to view order

## Notes

- Notifications are user-specific (filtered by email)
- Real-time updates require active internet connection
- Notifications persist in database
- Read status syncs across all devices
- Dropdown closes when clicking outside
