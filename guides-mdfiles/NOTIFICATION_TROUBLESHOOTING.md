# 🔔 Notification Bell Troubleshooting

## Bell Should Appear On:
✅ index.html
✅ dashboard.html  
✅ user.html
✅ pages/services.html

## Requirements for Bell to Show:
1. User must be logged in
2. `sessionStorage.getItem('userLoggedIn')` must be true
3. `sessionStorage.getItem('userEmail')` must exist

## How to Test:

### 1. Check if Logged In
Open browser console (F12) and run:
```javascript
console.log('Logged in:', sessionStorage.getItem('userLoggedIn'));
console.log('Email:', sessionStorage.getItem('userEmail'));
```

### 2. Check if Bell Element Exists
```javascript
console.log('Bell element:', document.getElementById('notificationBell'));
```

### 3. Check if CSS is Loaded
```javascript
const bell = document.getElementById('notificationBell');
console.log('Bell display:', bell ? window.getComputedStyle(bell).display : 'not found');
```

### 4. Manually Show Bell (for testing)
```javascript
const bell = document.getElementById('notificationBell');
if (bell) {
  bell.style.display = 'block';
  console.log('Bell shown!');
}
```

## Common Issues:

### Issue 1: Not Logged In
**Symptom:** Bell never appears
**Solution:** Login first at `/pages/login.html`

### Issue 2: CSS Not Loaded
**Symptom:** Bell appears but looks broken
**Solution:** Check if `css-files/index.css` is linked in the page

### Issue 3: JavaScript Not Running
**Symptom:** Bell HTML exists but stays hidden
**Solution:** Check browser console for errors

### Issue 4: Wrong Path
**Symptom:** Bell works on some pages but not others
**Solution:** Check if notification script path is correct:
- Root pages: `./js-files/notifications.js`
- Pages folder: `../js-files/notifications.js`

## Files to Check:

### HTML Files (Bell HTML):
- ✅ index.html - Line 55
- ✅ dashboard.html - Line 39
- ✅ user.html - Line 42
- ✅ pages/services.html - Line 65

### CSS Files (Bell Styles):
- ✅ css-files/index.css - Line 819+

### JavaScript Files (Bell Logic):
- ✅ js-files/notifications.js - initNotifications()

## Quick Fix:

If bell still doesn't show, add this to browser console:
```javascript
// Force show bell
document.getElementById('notificationBell').style.display = 'block';

// Check for notifications
import('./js-files/notifications.js').then(module => {
  console.log('Notifications loaded');
});
```

## Verification Checklist:

- [ ] User is logged in (check sessionStorage)
- [ ] Bell HTML exists on page (check with getElementById)
- [ ] index.css is linked (check Network tab)
- [ ] notifications.js is loaded (check Network tab)
- [ ] No JavaScript errors (check Console tab)
- [ ] Bell display is not 'none' (check Computed styles)

## Expected Behavior:

1. **Not Logged In:** Bell is hidden
2. **Logged In:** Bell appears with gold styling
3. **Has Notifications:** Red badge shows count
4. **Click Bell:** Dropdown opens with notifications
5. **Click Notification:** Redirects to user.html with order details

## Still Not Working?

Check these in order:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh page (Ctrl+F5)
3. Check if Firebase is connected (Network tab)
4. Verify user email in sessionStorage
5. Check browser console for errors
