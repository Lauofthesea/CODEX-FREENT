# Admin Quick Reference Guide

## 🔐 Login
- URL: `/pages/login.html`
- Use admin credentials
- Role must be set to 'admin'

---

## 📊 Dashboard Overview

### Key Metrics
- **Total Orders Today** - All orders received today
- **Pending Orders** - Orders awaiting action
- **Revenue Today** - Sum of completed orders

### Quick Actions
- View recent orders
- Jump to specific sections
- Monitor order flow

---

## 📦 Managing Orders

### View All Orders
1. Click **"Orders"** in sidebar
2. Use tabs to filter:
   - **All** - Every order
   - **Recent** - Last 7 days
   - **Pending** - Needs attention
   - **In Production** - Being made
   - **On Delivery** - Out for delivery

### Search Orders
- Search by: Order ID, Customer Name, Email, Product
- Real-time filtering as you type

### Sort Orders
- Date (Newest/Oldest)
- Quantity (High/Low)
- Status
- Customer Name (A-Z)

### View Order Details
1. Click any order row
2. Modal shows:
   - Customer information
   - Product details
   - Pricing breakdown
   - Order notes
   - Customer order history
3. Update status from dropdown
4. Click "Update Status"
5. Customer gets notified automatically

---

## 👕 Shirt Print Orders

### Special Workflow
1. Click **"Shirt Print"** in sidebar
2. See all shirt orders pending review
3. Click **"Review"** on any order

### Review Process
1. **View Details:**
   - Print method (DTF/Sublimation/Vinyl)
   - Shirt color
   - Sizes breakdown
   - Design instructions
   - Uploaded files

2. **Download Files:**
   - Click download button on each file
   - Review designs before production

3. **Set Pricing:**
   - Enter price per item
   - Total auto-calculates
   - Based on quantity

4. **Add Message (Optional):**
   - Custom note to customer
   - Special instructions
   - Delivery details

5. **Update Status:**
   - Pending Review
   - Processing
   - On Production
   - Ready for Pickup
   - Completed

6. **Submit:**
   - Click "Update & Notify Customer"
   - Customer receives notification
   - Order moves to production

---

## 🔄 Status Workflow

### Status Progression
```
Pending → On Production → On Delivery → Delivered/Complete
```

### Status Meanings
- **Pending** - Order received, awaiting review
- **Pending Review** - Shirt orders needing pricing
- **Processing** - Order being prepared
- **On Production** - Actively being made
- **On Delivery** - Out for delivery
- **Ready for Pickup** - Available for customer pickup
- **Delivered** - Successfully delivered
- **Complete** - Order finished

### Automatic Notifications
When you update status, customer receives:
- In-app notification
- Status-specific message
- Order ID reference
- Timestamp

---

## 💬 Messaging System

### Start Conversation
1. Click **"Messages"** in sidebar
2. Click **"+ New"** button
3. Enter:
   - Client name (required)
   - Email (optional)
   - Phone (optional)
   - Order ID (optional)
4. Click "Create Conversation"

### Send Messages
1. Select conversation from list
2. Type message in input box
3. Press Enter or click "Send"
4. Messages appear in real-time

### View Order Context
- If conversation linked to order
- Order details show in header
- Quick reference while chatting

---

## 📤 Export Orders

### Export to CSV
1. Go to **"Orders"** section
2. Click **"Export CSV"** button
3. File downloads automatically
4. Includes all order data

### CSV Contents
- Order ID
- Customer name and email
- Product and type
- Quantity and pricing
- Status and payment method
- Date and notes

### Use Cases
- Accounting records
- Inventory management
- Customer analysis
- Reporting

---

## 📈 Transaction History

### View Completed Orders
1. Click **"Transaction History"** in sidebar
2. See all delivered/completed orders
3. Review past transactions
4. Track revenue

---

## 🎯 Best Practices

### Daily Routine
1. **Morning:**
   - Check pending orders
   - Review shirt print requests
   - Respond to messages

2. **Throughout Day:**
   - Update order statuses
   - Download design files
   - Communicate with customers

3. **End of Day:**
   - Export daily orders
   - Review completed orders
   - Check revenue metrics

### Order Processing
- ✅ Review orders within 24 hours
- ✅ Update status regularly
- ✅ Download files before production
- ✅ Set accurate pricing
- ✅ Add helpful messages
- ✅ Notify customers promptly

### Customer Communication
- ✅ Be professional and friendly
- ✅ Respond to messages quickly
- ✅ Provide clear instructions
- ✅ Set realistic timelines
- ✅ Follow up on issues

### Quality Control
- ✅ Verify design files before production
- ✅ Confirm sizes and quantities
- ✅ Check customer instructions
- ✅ Review pricing calculations
- ✅ Update status accurately

---

## ⚠️ Common Tasks

### Task: Update Order Status
```
1. Go to Orders section
2. Click order row
3. Select new status from dropdown
4. Click "Update Status"
5. Confirm in modal
6. Done! Customer notified
```

### Task: Review Shirt Order
```
1. Go to Shirt Print section
2. Click "Review" on order
3. Download design files
4. Set price per item
5. Add message (optional)
6. Select status
7. Click "Update & Notify Customer"
8. Done!
```

### Task: Find Customer Orders
```
1. Go to Orders section
2. Type customer email in search
3. View all their orders
4. Or click any order to see history
```

### Task: Export Monthly Report
```
1. Go to Orders section
2. Sort by date (oldest first)
3. Filter to desired month
4. Click "Export CSV"
5. Open in Excel/Sheets
6. Generate report
```

---

## 🆘 Troubleshooting

### Can't See Orders
- Refresh page
- Check internet connection
- Verify admin login
- Clear browser cache

### Status Won't Update
- Check internet connection
- Verify order ID
- Try refreshing page
- Check Firebase connection

### Files Won't Download
- Check file URL exists
- Verify storage permissions
- Try different browser
- Contact customer for re-upload

### Customer Not Notified
- Verify customer email in order
- Check notifications collection
- Ensure status was updated
- Customer may need to refresh

---

## 🔑 Keyboard Shortcuts

- **Esc** - Close modal
- **Enter** - Send message (in chat)
- **Ctrl+F** - Focus search box

---

## 📱 Mobile Access

The admin panel works on mobile devices:
- Responsive design
- Touch-friendly buttons
- Scrollable tables
- Mobile-optimized modals

---

## 🔒 Security

### Best Practices
- ✅ Never share admin credentials
- ✅ Logout when done
- ✅ Use secure connection (HTTPS)
- ✅ Don't access from public computers
- ✅ Keep browser updated

### Session Management
- Sessions stored in browser
- Auto-logout on browser close
- Re-login required after logout
- Role verified on each action

---

## 📞 Need Help?

**Technical Issues:**
- Check this guide first
- Try refreshing the page
- Clear browser cache
- Contact IT support

**Business Questions:**
- Refer to pricing guidelines
- Check order policies
- Contact management

---

**Quick Tips:**
- 💡 Use search to find orders quickly
- 💡 Export data regularly for backup
- 💡 Update statuses promptly
- 💡 Add messages for clarity
- 💡 Check customer history before responding

---

**Last Updated:** November 28, 2025
