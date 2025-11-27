# Service Enhancements - Document Printing & Claim Methods

## 🎉 New Features Implemented

### 1. **Document Printing Enhancements** 📄

#### Page Count Detection
- **Automatic PDF page detection** - System reads PDF files and detects page count
- **Visual page count display** - Shows detected pages in a highlighted box
- **Accurate pricing** - Price calculated based on actual page count
- **Fallback handling** - Defaults to 1 page if detection fails or for non-PDF files

#### Color Printing Option
- **Black & White** (default) - Standard pricing
- **Colored** - Additional ₱3 per page surcharge
- **Clear pricing display** - Shows cost difference in dropdown

#### Enhanced Pricing Formula
```
Total = (Base Price + Color Surcharge) × Pages × Copies + Delivery Fee
```

**Example:**
- Paper: A4 (₱2/page)
- Color: Colored (+₱3/page)
- Pages: 10
- Copies: 2
- Delivery: Yes (+₱50)
- **Total: ₱150** = (2 + 3) × 10 × 2 + 50

---

### 2. **Universal Claim Method** 🚚

All services now include claim method selection:

#### Pickup Option
- **Free** - No additional charge
- Customer picks up from shop
- Available for all services

#### Delivery Option
- **Service-specific fees:**
  - Documents: +₱50
  - Photos: +₱50
  - Stickers: +₱50
  - Customized Items: +₱50
  - Tarpaulin: +₱100 (larger items)
  - Shirts: Included in review pricing

#### Services with Claim Method
✅ Document Printing
✅ Photo Printing
✅ Tarpaulin Printing
✅ Sticker Printing
✅ Customized Items
✅ T-Shirt Printing (already had it)

---

## 📋 Updated Order Forms

### Document Printing Form
```
1. Upload Document (PDF, DOCX, DOC, TXT)
   └─ Shows page count for PDFs
2. Paper Size (A4, A3, A5, Letter, Legal)
3. Print Color (Black & White / Colored)
4. Number of Copies
5. Claim Method (Pickup / Delivery)
6. Payment Method
```

### Photo Printing Form
```
1. Upload Photo (JPG, PNG)
2. Photo Size (Small, Medium, Large)
3. Copies
4. Claim Method (Pickup / Delivery) ← NEW
5. Payment Method
```

### Tarpaulin Printing Form
```
1. Upload Artwork (optional)
2. Tarpaulin Size (Small, Medium, Large)
3. Quantity
4. Claim Method (Pickup / Delivery) ← NEW
5. Notes (optional)
6. Payment Method
```

### Sticker Printing Form
```
1. Upload Artwork (optional)
2. Quantity
3. Claim Method (Pickup / Delivery) ← NEW
4. Notes (size/material)
5. Payment Method
```

### Customized Items Form
```
1. Upload Design
2. Quantity
3. Claim Method (Pickup / Delivery) ← NEW
4. Payment Method
```

---

## 💰 Updated Pricing Structure

### Document Printing
```javascript
{
  a4: ₱2/page,
  a3: ₱15/page,
  a5: ₱3/page,
  letter: ₱5/page,
  legal: ₱7/page,
  colorSurcharge: +₱3/page,
  deliveryFee: +₱50
}
```

### Photo Printing
```javascript
{
  small: ₱25,
  medium: ₱50,
  large: ₱100,
  deliveryFee: +₱50
}
```

### Tarpaulin Printing
```javascript
{
  small: ₱500,
  medium: ₱1000,
  large: ₱2000,
  deliveryFee: +₱100
}
```

### Sticker Printing
```javascript
{
  perPiece: ₱15,
  deliveryFee: +₱50
}
```

### Customized Items
```javascript
{
  base: ₱150,
  deliveryFee: +₱50
}
```

---

## 🔧 Technical Implementation

### PDF Page Count Detection

**Function:** `detectPDFPageCount(file)`

**How it works:**
1. Reads PDF file as text
2. Searches for `/Type /Page` patterns
3. Counts occurrences
4. Fallback: Looks for `/Count` in Pages object
5. Default: Returns 1 if detection fails

**Limitations:**
- Works for most standard PDFs
- May not work for heavily encrypted PDFs
- Compressed PDFs might not be readable
- Non-PDF files default to 1 page

**Example:**
```javascript
const pageCount = await detectPDFPageCount(pdfFile);
// Returns: 15 (for a 15-page PDF)
```

### Document File Upload Handler

**Function:** `handleDocumentFileUpload(event)`

**Features:**
- Validates file size (max 10MB)
- Detects PDF page count automatically
- Updates UI with page count
- Stores page count for pricing
- Handles multiple file types

**Flow:**
```
User uploads PDF
    ↓
Validate file size
    ↓
Detect page count
    ↓
Display page count badge
    ↓
Store in documentPages field
    ↓
Calculate price automatically
```

### Price Calculation Updates

**Function:** `calculatePrice()`

**Enhanced logic:**
```javascript
if (service === 'document') {
  // Get all values
  const pages = parseInt(documentPages) || 1;
  const copies = parseInt(copies) || 1;
  const printColor = printColor || 'bw';
  const claimMethod = claimMethod;
  
  // Calculate base price
  let pricePerPage = basePriceForSize;
  
  // Add color surcharge
  if (printColor === 'color') {
    pricePerPage += 3;
  }
  
  // Calculate total
  let total = pricePerPage × pages × copies;
  
  // Add delivery fee
  if (claimMethod === 'Delivery') {
    total += deliveryFee;
  }
  
  return total;
}
```

---

## 📊 Order Data Structure Updates

### Document Order
```javascript
{
  orderId: "ORD-123...",
  product: "Document Printing",
  type: "A4 - Colored",  // ← Enhanced
  pages: 10,             // ← NEW
  printColor: "color",   // ← NEW
  quantity: 2,           // (copies)
  price: 5,              // (per page with color)
  total: 150,            // (calculated)
  claimMethod: "Delivery", // ← NEW
  notes: "File: doc.pdf\nPages: 10\nColor: Colored\nClaim: Delivery",
  // ... other fields
}
```

### Generic Order (Photo/Tarpaulin/Stickers/Custom)
```javascript
{
  orderId: "ORD-123...",
  product: "Photo Printing",
  claimMethod: "Pickup",  // ← NEW
  total: 50,              // (includes delivery if selected)
  notes: "File: photo.jpg\nClaim: Pickup",
  // ... other fields
}
```

---

## 🎨 UI Enhancements

### Page Count Display
```html
<div id="pageCountDisplay" style="display: none;">
  <i class="fas fa-file-alt"></i>
  <span>Pages detected: <span id="pageCount">0</span></span>
</div>
```

**Styling:**
- Purple/indigo theme
- Icon indicator
- Bold page count
- Only shows for PDFs

### Color Selection Dropdown
```html
<select id="printColor">
  <option value="bw">Black & White</option>
  <option value="color">Colored (+₱3/page)</option>
</select>
```

**Features:**
- Clear pricing indication
- Default to B&W
- Updates price on change

### Claim Method Dropdown
```html
<select id="claimMethod">
  <option value="">Select Method</option>
  <option value="Pickup">Pickup</option>
  <option value="Delivery">Delivery (+₱50)</option>
</select>
```

**Features:**
- Required field
- Shows delivery fee
- Consistent across all services
- Updates price on change

---

## ✅ Validation Updates

### Document Order Validation
```javascript
// Check file uploaded
if (!selectedFile) {
  showErrorModal('Missing File', 'Please upload a document');
  return;
}

// Check payment method
if (!selectedPayment) {
  showErrorModal('Missing Information', 'Please select a payment method');
  return;
}

// Check claim method ← NEW
if (!claimMethod) {
  showErrorModal('Missing Information', 'Please select a claim method');
  return;
}
```

### All Services Now Require
1. ✅ File upload (where applicable)
2. ✅ Service-specific options
3. ✅ Claim method ← NEW
4. ✅ Payment method

---

## 📱 User Experience

### Document Printing Flow
```
1. User uploads PDF
   ↓
2. System detects 15 pages
   ↓
3. Badge shows "Pages detected: 15"
   ↓
4. User selects A4 paper
   ↓
5. User selects "Colored"
   ↓
6. User enters 2 copies
   ↓
7. User selects "Delivery"
   ↓
8. Price updates: ₱200
   (5 × 15 × 2 + 50)
   ↓
9. User submits order
   ↓
10. Success! Order placed
```

### Pricing Transparency
- **Real-time updates** - Price changes as user selects options
- **Clear breakdown** - Shows what affects price
- **No surprises** - All fees shown upfront
- **Accurate totals** - Based on actual page count

---

## 🧪 Testing Scenarios

### Test 1: PDF Page Detection
```
1. Upload 10-page PDF
2. Verify page count shows "10"
3. Select A4 (₱2/page)
4. Select B&W
5. Enter 1 copy
6. Select Pickup
7. Verify total: ₱20 (2 × 10 × 1)
```

### Test 2: Colored Printing
```
1. Upload 5-page PDF
2. Select A4 (₱2/page)
3. Select Colored (+₱3/page)
4. Enter 1 copy
5. Select Pickup
6. Verify total: ₱25 (5 × 5 × 1)
```

### Test 3: Delivery Fee
```
1. Upload 1-page PDF
2. Select A4 (₱2/page)
3. Select B&W
4. Enter 1 copy
5. Select Delivery (+₱50)
6. Verify total: ₱52 (2 × 1 × 1 + 50)
```

### Test 4: Combined
```
1. Upload 20-page PDF
2. Select A3 (₱15/page)
3. Select Colored (+₱3/page)
4. Enter 3 copies
5. Select Delivery (+₱50)
6. Verify total: ₱1130 (18 × 20 × 3 + 50)
```

### Test 5: Non-PDF File
```
1. Upload DOCX file
2. Verify page count NOT shown
3. System defaults to 1 page
4. Pricing works normally
```

### Test 6: Claim Method Required
```
1. Fill out photo order
2. Don't select claim method
3. Try to submit
4. Verify error: "Please select a claim method"
```

---

## 🔄 Migration Notes

### Existing Orders
- Old orders without `claimMethod` field will show "-"
- Old orders without `pages` field will show quantity as copies
- Old orders without `printColor` will show type only
- All new orders include these fields

### Backward Compatibility
- ✅ Old order display still works
- ✅ Admin can view old orders
- ✅ No data loss
- ✅ Smooth transition

---

## 📈 Benefits

### For Customers
- ✅ **Accurate pricing** - Know exact cost before ordering
- ✅ **Flexible delivery** - Choose pickup or delivery
- ✅ **Color options** - Choose B&W or colored printing
- ✅ **Transparency** - See page count and pricing breakdown
- ✅ **Convenience** - Delivery option for all services

### For Business
- ✅ **Accurate quotes** - No manual page counting
- ✅ **Delivery revenue** - Additional income stream
- ✅ **Better tracking** - Know delivery vs pickup orders
- ✅ **Customer satisfaction** - Clear pricing and options
- ✅ **Reduced errors** - Automated page detection

---

## 🚀 Future Enhancements

### Potential Additions
- [ ] **Advanced PDF reader** - Show preview of document
- [ ] **Page range selection** - Print specific pages only
- [ ] **Double-sided printing** - Option for duplex printing
- [ ] **Binding options** - Staple, spiral, etc.
- [ ] **Delivery tracking** - Track delivery status
- [ ] **Delivery zones** - Different fees by location
- [ ] **Bulk discounts** - Discounts for large orders
- [ ] **Scheduled delivery** - Choose delivery date/time

---

## 📞 Support

### Common Questions

**Q: Why doesn't my PDF show page count?**
A: Some encrypted or compressed PDFs can't be read. System defaults to 1 page. You can manually note the page count in order notes.

**Q: Can I change claim method after ordering?**
A: Contact admin through messaging system to update claim method.

**Q: Is delivery available in my area?**
A: Currently delivery is available for all orders. Specific zones may be added later.

**Q: What if page count is wrong?**
A: Admin will verify actual page count and adjust pricing if needed before processing.

---

**Last Updated:** November 28, 2025
**Version:** 3.0
**Status:** ✅ Fully Implemented and Tested
