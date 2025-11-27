# Firebase Rules Deployment Guide

## Files Created:
- `firestore.rules` - Firestore database security rules
- `storage.rules` - Firebase Storage security rules
- `firebase.json` - Firebase configuration
- `firestore.indexes.json` - Database indexes for better query performance

## How to Deploy:

### Option 1: Using Firebase CLI (Recommended)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done):
   ```bash
   firebase init
   ```
   - Select: Firestore, Storage
   - Use existing files when prompted

4. **Deploy the rules**:
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```

### Option 2: Manual Deployment via Console

Once you regain access to Firebase Console:

**For Firestore Rules:**
1. Go to Firebase Console → Firestore Database → Rules
2. Copy the content from `firestore.rules`
3. Paste and publish

**For Storage Rules:**
1. Go to Firebase Console → Storage → Rules
2. Copy the content from `storage.rules`
3. Paste and publish

## What These Rules Do:

### Firestore Rules:
- ✅ Anyone can read orders (for order tracking)
- ✅ Anyone can create orders (for customer submissions)
- ✅ Only authenticated users can update/delete orders (admin only)
- ✅ Notifications are readable by the user they belong to
- ✅ Conversations/messages require authentication

### Storage Rules:
- ✅ Anyone can upload files to `/orders/{orderId}/` (for order submissions)
- ✅ Anyone can read/download files (for admin review)
- ✅ 20MB file size limit
- ✅ Only authenticated users can delete files

## Security Notes:

⚠️ **Current Setup**: These rules are permissive for development and allow public access for order submissions.

🔒 **For Production**: Consider implementing proper authentication and tightening these rules:
- Require authentication for order creation
- Add user ID validation
- Implement role-based access control (RBAC)

## Testing:

After deployment, test by:
1. Submitting a shirt print order with files
2. Check if files upload successfully
3. Verify admin can download files
4. Check notifications appear for users

## Troubleshooting:

If you still get CORS errors after deployment:
1. Wait 5-10 minutes for rules to propagate
2. Clear browser cache
3. Try in incognito mode
4. Check Firebase Console for rule deployment status
