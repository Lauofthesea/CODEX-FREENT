# Order Management System Guide

## Overview
Complete order handling system for Lines Printing Services with user authentication, real-time tracking, admin management, and notifications.

---

## 🎯 Key Features

### User Side
- ✅ **Authentication Required** - Users must login to place orders
- ✅ **Multiple Service Types** - Documents, T-shirts, Photos, Tarpaulin, Stickers, Custom items
- ✅ **Real-time Order Tracking** - Track orders by Order ID
- ✅ **Notification System** - Get notified of order status changes
- ✅ **Order History** - View all past orders in dashboard
- ✅ **File Upload** - Upload design files with orders

### Admin Side
- ✅ **Dashboard Analytics** - View total orders, pending, revenue
- ✅ **Order Management** - View, filter, sort, and update orders
- ✅ **Shirt Print Review** - Special workflow for custom shirt orders
- ✅ **Status Updates** - Update order status with automatic notifications
- ✅ **Customer History** - View customer's previous orders
- ✅ **Export Orders** - Export all orders to CSV
- ✅ **Messaging System** - Direct communication with customers
- ✅ **Advanced Filtering** - Filter by status, date, customer

---

## 📋 Order Flow

### 1. User Places Order
```
User Login → Browse Services → Select Service → Fill Form → Upload Files → Submit Order
```

**Authentication Check:**
- Triggered when opening order modal
- Triggered when submitting order
- Redirects to login page if not authenticated

**Order Data Stored:**
```javascript
{
  orderId: "ORD-1234567890-ABCDE",
  customer: "John Doe",
  email: "john@example.com",
  product: "T-Shirt Printing",
  type: "DTF",
  quantity: 10,
  price: 250,
  total: 2500,
  status: "Pending",
  date: "Nov 28, 2025, 10:30 AM",
  paymentMethod: "GCASH",
  notes: "Design instructions...",
  files: [{ name: "design.png", url: "...", size: 1024 }]
}
```

### 2. Admin Reviews Order
```
Admin Dashboard → Orders Section → View Order Details → Update Status/Price
```

**Admin Actions:**
- View complete order details
- See customer order history
- Update order status
- Set pricing (for shirt orders)
- Send custom messages to customers
- Export order data

### 3. User Tracks Order
```
User Dashboard → Track Orders → Enter Order ID → View Status Timeline
```

**Status Timeline:**
1. **Order Received** (Pending)
2. **In Production** (On Production)
3. **Out for Delivery** (On Delivery)
4. **Delivered/Complete** (Delivered/Complete)

### 4. Notifications
```
Status Change → Create Notification → User Sees in Dashboard
```

**Notification Types:**
- `order_submitted` - Order placed successfully
- `order_updated` - Status changed
- `order_completed` - Order completed
- `price_updated` - Price set for shirt orders

---

## 🔐 Authentication System

### Session Storage Keys
```javascript
sessionStorage.setItem('userLoggedIn', 'true');
sessionStorage.setItem('username', 'John Doe');
sessionStorage.setItem('userEmail', 'john@example.com');
sessionStorage.setItem('userRole', 'user'); // or 'admin'
```

### Protected Actions
1. **Opening Order Modal** - Requires login
2. **Submitting Orders** - Requires login
3. **Using 3D Designer** - Requires login
4. **Tracking Orders** - Requires login
5. **Viewing Dashboard** - Requires login
6. **Admin Panel** - Requires admin role

---

## 📊 Admin Dashboard Features

### Dashboard Section
- **Total Orders Today** - Count of all orders
- **Pending Orders** - Orders awaiting action
- **Revenue Today** - Total from completed orders
- **Recent Orders Table** - Latest orders overview

### Orders Section
**Filtering Options:**
- All Orders
- Recent (Last 7 days)
- Pending
- In Production
- On Delivery

**Sorting Options:**
- Date (Newest/Oldest)
- Quantity (High/Low)
- Status
- Customer Name (A-Z)

**Search:**
- Search by Order ID, Customer, Email, or Product

**Export:**
- Export all orders to CSV file
- Includes all order details

### Shirt Print Section
**Special Features:**
- View all shirt print orders
- See size breakdown
- View uploaded design files
- Download design files
- Set custom pricing
- Add admin messages
- Update status with notification

**Shirt Order Details:**
- Print method (DTF, Sublimation, Vinyl)
- Shirt color
- Sizes and quantities
- Design instructions
- Uploaded files
- Claim method (Pickup/Delivery)

### Order Details Modal
**Information Displayed:**
- Customer info (Name, Email, Contact)
- Product details (Type, Size, Dimensions)
- Pricing (Quantity, Price per item, Total)
- Order notes
- Customer order history
- Status update controls

---

## 🔔 Notification System

### Creating Notifications
```javascript
await addDoc(collection(db, "notifications"), {
  userId: "user@example.com",
  orderId: "ORD-123",
  title: "Order Status Updated",
  message: "Your order is now in production!",
  type: "order_updated",
  read: false,
  timestamp: new Date().toISOString()
});
```

### Notification Display
- **Unread Badge** - Shows count of unread notifications
- **Real-time Updates** - Uses Firestore onSnapshot
- **Mark as Read** - Click notification to mark as read
- **Mark All Read** - Button to mark all as read
- **Time Ago** - Shows relative time (e.g., "2h ago")

---

## 📁 File Upload System

### Supported File Types
- **Documents:** PDF, DOCX, DOC, TXT
- **Images:** JPG, PNG
- **Design Files:** PDF, JPG, PNG

### File Size Limits
- **Documents:** 10MB per file
- **Shirt Designs:** 20MB per file
- **Other Services:** 10MB per file

### Upload Process
1. User selects files
2. Files validated (size, type)
3. Files uploaded to Firebase Storage
4. Download URLs stored in order
5. Admin can download files from dashboard

---

## 🎨 Service Types

### 1. Document Printing
- Paper sizes: A4, A3, A5, Letter, Legal
- Pricing per page
- Multiple copies support
- File upload required

### 2. T-Shirt Printing
- Methods: DTF, Sublimation, Vinyl
- Multiple sizes and quantities
- Design file upload
- Custom pricing (admin review)
- Design instructions

### 3. Photo Printing
- Sizes: Small, Medium, Large
- Fixed pricing per size
- Multiple copies
- Image upload required

### 4. Tarpaulin Printing
- Sizes: Small, Medium, Large
- Fixed pricing per size
- Optional artwork upload
- Custom notes

### 5. Sticker Printing
- Price per piece
- Quantity-based pricing
- Optional artwork upload
- Size/material notes

### 6. Customized Items
- Base price per item
- Design upload required
- Quantity support
- Custom specifications

---

## 💾 Database Structure

### Collections

#### orders
```javascript
{
  orderId: string,
  customer: string,
  email: string,
  contact: string,
  product: string,
  type: string,
  size: string,
  quantity: number,
  price: number,
  total: number,
  status: string,
  date: string,
  paymentMethod: string,
  notes: string,
  files: array,
  // Shirt-specific fields
  shirtColor: string,
  claimMethod: string,
  designInstructions: string,
  sizes: string (JSON),
  // Metadata
  lastUpdated: string,
  reviewedAt: string
}
```

#### notifications
```javascript
{
  userId: string (email),
  orderId: string,
  title: string,
  message: string,
  type: string,
  read: boolean,
  timestamp: string,
  details: object (optional)
}
```

#### conversations
```javascript
{
  clientName: string,
  clientEmail: string,
  clientPhone: string,
  orderId: string,
  lastMessage: string,
  lastUpdated: timestamp,
  unreadCount: number,
  product: string,
  quantity: string,
  total: string,
  status: string
}
```

---

## 🚀 Usage Examples

### User: Place a Shirt Order
```javascript
1. Login to account
2. Navigate to Services page
3. Click "T-Shirt Printing"
4. Select print method (DTF/Sublimation/Vinyl)
5. Choose shirt color
6. Upload design files
7. Add sizes and quantities
8. Enter design instructions
9. Select claim method
10. Submit order
11. Receive order confirmation with Order ID
```

### Admin: Review Shirt Order
```javascript
1. Login to admin panel
2. Go to "Shirt Print" section
3. Click "Review" on pending order
4. View all order details and files
5. Download design files if needed
6. Set price per item
7. Add message to customer (optional)
8. Update status
9. Click "Update & Notify Customer"
10. Customer receives notification
```

### User: Track Order
```javascript
1. Login to account
2. Go to "Track Orders" page
3. Enter Order ID
4. View order details and status timeline
5. See current status highlighted
6. Check notifications for updates
```

---

## 🔧 Maintenance & Troubleshooting

### Common Issues

**Issue: User can't place order**
- Check if user is logged in
- Verify sessionStorage has userLoggedIn = 'true'
- Check if all required fields are filled
- Verify file size limits

**Issue: Admin can't see orders**
- Check admin authentication (userRole = 'admin')
- Verify Firebase connection
- Check Firestore rules

**Issue: Notifications not showing**
- Verify user email matches in sessionStorage
- Check Firestore notifications collection
- Ensure onSnapshot listener is active

**Issue: Files not uploading**
- Check file size limits
- Verify Firebase Storage rules
- Check CORS configuration
- Fallback: Store file info without URLs

---

## 📈 Future Enhancements

### Planned Features
- [ ] Email notifications (in addition to in-app)
- [ ] SMS notifications for order updates
- [ ] Payment gateway integration
- [ ] Invoice generation
- [ ] Customer reviews and ratings
- [ ] Bulk order discounts
- [ ] Loyalty points system
- [ ] Advanced analytics dashboard
- [ ] Automated status updates
- [ ] Order templates for repeat customers

---

## 📞 Support

For technical support or questions:
- Email: linesprintingservices@gmail.com
- Location: E. Locson Drive, Talon-talon, Zamboanga City

---

**Last Updated:** November 28, 2025
**Version:** 2.0
