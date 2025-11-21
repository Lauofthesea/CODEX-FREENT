// T-Shirt Designer using Fabric.js
// Lines Hub - FREENT System with Firebase Integration

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

let canvas = null;
let selectedFile = null;
let selectedPayment = null;
let currentService = null;
let shirtColor = '#ffffff';

// Pricing structures
const prices = {
  document: {
    a4: 2,
    a3: 15,
    a5: 3,
    letter: 5,
    legal: 7
  },
  shirt: {
    dtf: 250,
    sublimation: 200,
    vinyl: 150
  },
  photo: {
    small: 25,
    medium: 50,
    large: 100
  },
  tarpaulin: {
    small: 500,
    medium: 1000,
    large: 2000
  },
  stickers: {
    perPiece: 15
  },
  customized: {
    base: 150
  }
};

// Service configurations
const serviceConfig = {
  document: {
    title: 'Document Printing Order',
    icon: 'fas fa-file-alt'
  },
  shirt: {
    title: 'T-Shirt Designer',
    icon: 'fas fa-tshirt'
  },
  photo: { title: 'Photo Printing', icon: 'fas fa-image' },
  tarpaulin: { title: 'Tarpaulin Printing', icon: 'fas fa-rectangle-ad' },
  stickers: { title: 'Sticker Printing', icon: 'fas fa-sticky-note' },
  customized: { title: 'Customized Item Order', icon: 'fas fa-gift' }
};

function scrollToServices() {
  const servicesSection = document.getElementById('services-cards');
  if (servicesSection) {
    servicesSection.scrollIntoView({ behavior: 'smooth' });
  }
}

function openModal(service) {
  currentService = service;
  const modalOverlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalIcon = document.querySelector('.modal-header h2 i');
  
  if (serviceConfig[service]) {
    modalIcon.className = serviceConfig[service].icon;
    modalTitle.textContent = serviceConfig[service].title;
  }
  
  if (service === 'document') {
    showDocumentForm();
  } else if (service === 'shirt') {
    showShirtDesigner();
  } else if (service === 'photo' || service === 'tarpaulin' || service === 'stickers' || service === 'customized') {
    showGenericForm(service);
  }
  
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = 'auto';
  
  // Dispose canvas if it exists
  if (canvas) {
    canvas.dispose();
    canvas = null;
  }
  
  resetForm();
}

function closeModalOnOverlay(event) {
  if (event.target.id === 'modalOverlay') {
    closeModal();
  }
}

// Show document printing form
function showDocumentForm() {
  const formContainer = document.getElementById('dynamicFormContainer');
  formContainer.innerHTML = `
    <div class="form-group">
      <label>Upload Document</label>
      <div class="file-upload-area" onclick="document.getElementById('fileInput').click()">
        <i class="fas fa-cloud-upload-alt"></i>
        <p>Click to upload or drag and drop</p>
        <small>PDF, DOCX, DOC, TXT (Max 10MB)</small>
      </div>
      <input type="file" id="fileInput" accept=".pdf,.docx,.doc,.txt" onchange="handleFileSelect(event)" />
      <div id="fileInfo" class="file-info" style="display: none;"></div>
    </div>

    <div class="form-group">
      <label for="paperSize">Paper Size</label>
      <select id="paperSize" onchange="calculatePrice()">
        <option value="a4">A4 (210 × 297 mm) - ₱2/page</option>
        <option value="a3">A3 (297 × 420 mm) - ₱15/page</option>
        <option value="a5">A5 (148 × 210 mm) - ₱3/page</option>
        <option value="letter">Letter (8.5 × 11 in) - ₱5/page</option>
        <option value="legal">Legal (8.5 × 14 in) - ₱7/page</option>
      </select>
    </div>

    <div class="form-group">
      <label for="copies">Number of Copies</label>
      <input type="number" id="copies" min="1" max="1000" value="1" onchange="calculatePrice()" />
    </div>
  `;
  calculatePrice();
}

// Show T-Shirt Designer
function showShirtDesigner() {
  const formContainer = document.getElementById('dynamicFormContainer');
  formContainer.innerHTML = `
    <div class="shirt-designer-container">
      <!-- Designer Canvas Area -->
      <div class="designer-workspace">
        <div class="shirt-mockup-container">
          <canvas id="tshirtCanvas"></canvas>
        </div>
        
        <!-- Design Tools -->
        <div class="design-tools">
          <button type="button" class="tool-btn" onclick="addText()" title="Add Text">
            <i class="fas fa-font"></i> Add Text
          </button>
          <button type="button" class="tool-btn" onclick="document.getElementById('designUpload').click()" title="Upload Image">
            <i class="fas fa-image"></i> Upload Image
          </button>
          <input type="file" id="designUpload" accept="image/*" style="display: none;" onchange="handleImageUpload(event)" />
          <button type="button" class="tool-btn" onclick="deleteSelected()" title="Delete Selected">
            <i class="fas fa-trash"></i> Delete
          </button>
          <button type="button" class="tool-btn" onclick="clearCanvas()" title="Clear All">
            <i class="fas fa-eraser"></i> Clear All
          </button>
        </div>
      </div>

      <!-- Shirt Configuration -->
      <div class="shirt-config">
        <div class="form-group">
          <label for="shirtColorPicker">Shirt Color</label>
          <div class="color-picker-container">
            <input type="color" id="shirtColorPicker" value="#ffffff" onchange="changeShirtColor(this.value)">
            <div class="color-presets">
              <button type="button" class="color-preset" style="background: #ffffff;" onclick="changeShirtColor('#ffffff')" title="White"></button>
              <button type="button" class="color-preset" style="background: #000000;" onclick="changeShirtColor('#000000')" title="Black"></button>
              <button type="button" class="color-preset" style="background: #1e3a8a;" onclick="changeShirtColor('#1e3a8a')" title="Navy"></button>
              <button type="button" class="color-preset" style="background: #dc2626;" onclick="changeShirtColor('#dc2626')" title="Red"></button>
              <button type="button" class="color-preset" style="background: #16a34a;" onclick="changeShirtColor('#16a34a')" title="Green"></button>
              <button type="button" class="color-preset" style="background: #6b7280;" onclick="changeShirtColor('#6b7280')" title="Gray"></button>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="printMethod">Printing Method</label>
          <select id="printMethod" onchange="calculatePrice()">
            <option value="">Select Method</option>
            <option value="dtf">DTF (Direct to Film) - ₱250/shirt</option>
            <option value="sublimation">Sublimation - ₱200/shirt</option>
            <option value="vinyl">Vinyl Heat Transfer - ₱150/shirt</option>
          </select>
        </div>

        <div class="form-group">
          <label for="shirtSize">Shirt Size</label>
          <select id="shirtSize">
            <option value="">Select Size</option>
            <option value="xs">Extra Small (XS)</option>
            <option value="s">Small (S)</option>
            <option value="m">Medium (M)</option>
            <option value="l">Large (L)</option>
            <option value="xl">Extra Large (XL)</option>
            <option value="2xl">2XL</option>
            <option value="3xl">3XL</option>
          </select>
        </div>

        <div class="form-group">
          <label for="quantity">Quantity</label>
          <input type="number" id="quantity" min="1" max="500" value="1" onchange="calculatePrice()" />
        </div>

        <div class="form-group">
          <label for="shirtNotes">Additional Notes (optional)</label>
          <textarea id="shirtNotes" rows="2" placeholder="Any special instructions..."></textarea>
        </div>
      </div>
    </div>
  `;
  
  // Initialize Fabric.js canvas
  setTimeout(() => {
    initShirtCanvas();
  }, 100);
  
  selectedFile = 'custom-design'; // Mark as having a design
  calculatePrice();
}

// Show generic forms for photo, tarpaulin, stickers, customized
function showGenericForm(service) {
  const formContainer = document.getElementById('dynamicFormContainer');
  let html = '';

  if (service === 'photo') {
    html = `
      <div class="form-group">
        <label>Upload Photo</label>
        <div class="file-upload-area" onclick="document.getElementById('fileInput').click()">
          <i class="fas fa-cloud-upload-alt"></i>
          <p>Click to upload or drag and drop</p>
          <small>JPG, PNG (Max 10MB)</small>
        </div>
        <input type="file" id="fileInput" accept="image/*" onchange="handleFileSelect(event)" />
        <div id="fileInfo" class="file-info" style="display: none;"></div>
      </div>

      <div class="form-group">
        <label for="photoSize">Photo Size</label>
        <select id="photoSize" onchange="calculatePrice()">
          <option value="small">Small - ₱25</option>
          <option value="medium">Medium - ₱50</option>
          <option value="large">Large - ₱100</option>
        </select>
      </div>

      <div class="form-group">
        <label for="photoCopies">Copies</label>
        <input type="number" id="photoCopies" min="1" value="1" onchange="calculatePrice()" />
      </div>
    `;
  } else if (service === 'tarpaulin') {
    html = `
      <div class="form-group">
        <label>Upload Artwork (optional)</label>
        <div class="file-upload-area" onclick="document.getElementById('fileInput').click()">
          <i class="fas fa-cloud-upload-alt"></i>
          <p>Click to upload</p>
          <small>PDF, JPG, PNG (Max 20MB)</small>
        </div>
        <input type="file" id="fileInput" accept=".pdf,image/*" onchange="handleFileSelect(event)" />
        <div id="fileInfo" class="file-info" style="display: none;"></div>
      </div>

      <div class="form-group">
        <label for="tarpaulinSize">Tarpaulin Size</label>
        <select id="tarpaulinSize" onchange="calculatePrice()">
          <option value="small">Small - ₱500</option>
          <option value="medium">Medium - ₱1000</option>
          <option value="large">Large - ₱2000</option>
        </select>
      </div>

      <div class="form-group">
        <label for="tarpaulinQty">Quantity</label>
        <input type="number" id="tarpaulinQty" min="1" value="1" onchange="calculatePrice()" />
      </div>

      <div class="form-group">
        <label for="tarpaulinNotes">Notes (optional)</label>
        <textarea id="tarpaulinNotes" rows="2" placeholder="Any special instructions..."></textarea>
      </div>
    `;
  } else if (service === 'stickers') {
    html = `
      <div class="form-group">
        <label for="stickerQty">Quantity</label>
        <input type="number" id="stickerQty" min="1" value="10" onchange="calculatePrice()" />
      </div>

      <div class="form-group">
        <label for="stickerNotes">Notes (size/material)</label>
        <textarea id="stickerNotes" rows="2" placeholder="Sticker size, finish, or other notes"></textarea>
      </div>

      <div class="form-group">
        <label>Upload Artwork (optional)</label>
        <div class="file-upload-area" onclick="document.getElementById('fileInput').click()">
          <i class="fas fa-cloud-upload-alt"></i>
          <p>Click to upload</p>
        </div>
        <input type="file" id="fileInput" accept="image/*,application/pdf" onchange="handleFileSelect(event)" />
        <div id="fileInfo" class="file-info" style="display: none;"></div>
      </div>
    `;
  } else if (service === 'customized') {
    html = `
      <div class="form-group">
        <label>Upload Design</label>
        <div class="file-upload-area" onclick="document.getElementById('fileInput').click()">
          <i class="fas fa-cloud-upload-alt"></i>
          <p>Click to upload</p>
          <small>PDF, JPG, PNG (Max 15MB)</small>
        </div>
        <input type="file" id="fileInput" accept=".pdf,image/*" onchange="handleFileSelect(event)" />
        <div id="fileInfo" class="file-info" style="display: none;"></div>
      </div>

      <div class="form-group">
        <label for="customQty">Quantity</label>
        <input type="number" id="customQty" min="1" value="1" onchange="calculatePrice()" />
      </div>
    `;
  }

  formContainer.innerHTML = html;
  // reset selection state
  selectedFile = null;
  calculatePrice();
  updateSubmitButton();
}

// Initialize Fabric.js Canvas
function initShirtCanvas() {
  const canvasEl = document.getElementById('tshirtCanvas');
  if (!canvasEl) return;
  
  canvas = new fabric.Canvas('tshirtCanvas', {
    width: 400,
    height: 500,
    backgroundColor: '#ffffff'
  });
  
  // Draw T-shirt outline
  drawTShirtOutline();
  
  // Add keyboard delete support
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Delete' && canvas) {
      deleteSelected();
    }
  });
}

// Draw T-shirt outline on canvas
function drawTShirtOutline() {
  const shirtPath = new fabric.Path(
    'M 200 50 L 180 100 L 150 120 L 150 450 L 250 450 L 250 120 L 220 100 Z',
    {
      fill: shirtColor,
      stroke: '#cccccc',
      strokeWidth: 2,
      selectable: false,
      evented: false
    }
  );
  
  canvas.add(shirtPath);
  canvas.sendToBack(shirtPath);
}

// Change shirt color
function changeShirtColor(color) {
  shirtColor = color;
  document.getElementById('shirtColorPicker').value = color;
  
  if (canvas) {
    const objects = canvas.getObjects();
    const shirtOutline = objects[0]; // First object is the shirt
    if (shirtOutline) {
      shirtOutline.set('fill', color);
      canvas.renderAll();
    }
  }
}

// Add text to canvas
function addText() {
  if (!canvas) return;
  
  const text = new fabric.IText('Your Text', {
    left: 200,
    top: 250,
    fontSize: 30,
    fill: '#000000',
    fontFamily: 'Arial'
  });
  
  canvas.add(text);
  canvas.setActiveObject(text);
  canvas.renderAll();
}

// Handle image upload
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    fabric.Image.fromURL(e.target.result, function(img) {
      img.scale(0.5);
      img.set({
        left: 200,
        top: 250,
        originX: 'center',
        originY: 'center'
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    });
  };
  reader.readAsDataURL(file);
}

// Delete selected object
function deleteSelected() {
  if (!canvas) return;
  
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length) {
    activeObjects.forEach(obj => {
      // Don't delete the shirt outline (first object)
      if (canvas.getObjects().indexOf(obj) !== 0) {
        canvas.remove(obj);
      }
    });
    canvas.discardActiveObject();
    canvas.renderAll();
  }
}

// Clear all designs (keep shirt outline)
function clearCanvas() {
  if (!canvas) return;
  
  const objects = canvas.getObjects().slice(1); // Skip shirt outline
  objects.forEach(obj => canvas.remove(obj));
  canvas.renderAll();
}

// Handle document file select
function handleFileSelect(event) {
  const file = event.target.files[0];
  const fileInfo = document.getElementById('fileInfo');
  
  if (file) {
    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    const maxSize = 10;
    
    if (fileSize > maxSize) {
      alert('File size must be less than 10MB');
      event.target.value = '';
      selectedFile = null;
      fileInfo.style.display = 'none';
      updateSubmitButton();
      return;
    }
    
    selectedFile = file;
    fileInfo.style.display = 'block';
    fileInfo.innerHTML = `
      <i class="fas fa-file"></i> 
      <strong>${file.name}</strong> (${fileSize} MB)
    `;
    
    updateSubmitButton();
    calculatePrice();
  }
}

function selectPayment(method, el) {
  selectedPayment = method;
  const pm = document.getElementById('paymentMethod');
  if (pm) pm.value = method;

  document.querySelectorAll('.payment-option').forEach(option => {
    option.classList.remove('selected');
  });
  if (el && el.classList) el.classList.add('selected');

  updateSubmitButton();
}

function calculatePrice() {
  let total = 0;

  if (currentService === 'document') {
    if (!selectedFile) {
      document.getElementById('totalPrice').textContent = '₱0.00';
      return;
    }

    const paperSize = document.getElementById('paperSize').value;
    const copies = parseInt(document.getElementById('copies').value) || 1;
    const pricePerPage = prices.document[paperSize] || 0;
    total = pricePerPage * copies;
  } else if (currentService === 'shirt') {
    const printMethod = document.getElementById('printMethod')?.value;
    const quantity = parseInt(document.getElementById('quantity')?.value) || 1;

    if (printMethod) {
      const pricePerShirt = prices.shirt[printMethod] || 0;
      total = pricePerShirt * quantity;
    }
  } else if (currentService === 'photo') {
    if (!selectedFile) {
      document.getElementById('totalPrice').textContent = '₱0.00';
      return;
    }
    const size = document.getElementById('photoSize')?.value || 'small';
    const qty = parseInt(document.getElementById('photoCopies')?.value) || 1;
    const pricePer = prices.photo[size] || 0;
    total = pricePer * qty;
  } else if (currentService === 'tarpaulin') {
    const size = document.getElementById('tarpaulinSize')?.value || 'small';
    const qty = parseInt(document.getElementById('tarpaulinQty')?.value) || 1;
    const pricePer = prices.tarpaulin[size] || 0;
    total = pricePer * qty;
  } else if (currentService === 'stickers') {
    const qty = parseInt(document.getElementById('stickerQty')?.value) || 1;
    total = prices.stickers.perPiece * qty;
  } else if (currentService === 'customized') {
    const qty = parseInt(document.getElementById('customQty')?.value) || 1;
    total = prices.customized.base * qty;
  }

  document.getElementById('totalPrice').textContent = `₱${total.toFixed(2)}`;
}

function updateSubmitButton() {
  const submitBtn = document.getElementById('submitBtn');
  
  if (!submitBtn) return;

  // require payment for all
  if (!selectedPayment) {
    submitBtn.disabled = true;
    return;
  }

  // services that require a file upload
  if (currentService === 'document' || currentService === 'photo' || currentService === 'customized') {
    submitBtn.disabled = !selectedFile;
    return;
  }

  // for others (shirt, tarpaulin, stickers) allow when payment selected
  submitBtn.disabled = false;
}

async function handleSubmit(event) {
  event.preventDefault();
  
  if (currentService === 'document') {
    await submitDocumentOrder();
  } else if (currentService === 'shirt') {
    await submitShirtOrder();
  } else if (currentService === 'photo' || currentService === 'tarpaulin' || currentService === 'stickers' || currentService === 'customized') {
    await submitGenericOrder(currentService);
  }
}

// Generic submit handler for other services
async function submitGenericOrder(service) {
  try {
    let productName = '';
    let type = '-';
    let quantity = 1;
    let notes = '-';
    let price = 0;
    const totalPrice = document.getElementById('totalPrice').textContent.replace('₱', '') || '0';

    if (service === 'photo') {
      productName = 'Photo Printing';
      type = document.getElementById('photoSize')?.value || 'small';
      quantity = parseInt(document.getElementById('photoCopies')?.value) || 1;
      price = prices.photo[type] || 0;
      notes = selectedFile?.name || '-';
    } else if (service === 'tarpaulin') {
      productName = 'Tarpaulin Printing';
      type = document.getElementById('tarpaulinSize')?.value || 'small';
      quantity = parseInt(document.getElementById('tarpaulinQty')?.value) || 1;
      price = prices.tarpaulin[type] || 0;
      notes = document.getElementById('tarpaulinNotes')?.value || '-';
    } else if (service === 'stickers') {
      productName = 'Stickers';
      quantity = parseInt(document.getElementById('stickerQty')?.value) || 1;
      price = prices.stickers.perPiece;
      notes = document.getElementById('stickerNotes')?.value || '-';
    } else if (service === 'customized') {
      productName = 'Customized Item';
      quantity = parseInt(document.getElementById('customQty')?.value) || 1;
      price = prices.customized.base;
      notes = selectedFile?.name || '-';
    }

    const orderData = {
      orderId: generateOrderId(),
      customer: 'Guest User',
      contact: '-',
      email: '-',
      product: productName,
      type: type.toString().toUpperCase(),
      size: type.toString().toUpperCase(),
      quantity: parseInt(quantity),
      price: price,
      total: parseFloat(totalPrice),
      notes: notes,
      status: 'Pending',
      date: getCurrentDate(),
      paymentMethod: selectedPayment,
      height: '-',
      width: '-'
    };

    await addDoc(collection(db, "orders"), orderData);

    alert(`Order Placed Successfully!\n\nOrder ID: ${orderData.orderId}\nProduct: ${productName}\nQuantity: ${quantity}\nPayment: ${selectedPayment.toUpperCase()}\nTotal: ₱${totalPrice}`);
    closeModal();
  } catch (error) {
    console.error('Error submitting generic order:', error);
    alert('Error placing order. Please try again.');
  }
}

// Generate unique order ID
function generateOrderId() {
  return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// Get current date string
function getCurrentDate() {
  const now = new Date();
  return now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function submitDocumentOrder() {
  try {
    const paperSize = document.getElementById('paperSize').value;
    const copies = document.getElementById('copies').value;
    const totalPrice = document.getElementById('totalPrice').textContent.replace('₱', '');
    
    const orderData = {
      orderId: generateOrderId(),
      customer: 'Guest User',
      contact: '-',
      email: '-',
      product: 'Document Printing',
      type: paperSize.toUpperCase(),
      size: paperSize.toUpperCase(),
      quantity: parseInt(copies),
      price: prices.document[paperSize],
      total: parseFloat(totalPrice),
      notes: selectedFile.name,
      status: 'Pending',
      date: getCurrentDate(),
      paymentMethod: selectedPayment,
      height: '-',
      width: '-'
    };
    
    // Save to Firebase
    await addDoc(collection(db, "orders"), orderData);
    
    alert(`Order Placed Successfully!\n\nOrder ID: ${orderData.orderId}\nFile: ${selectedFile.name}\nPaper Size: ${paperSize.toUpperCase()}\nCopies: ${copies}\nPayment: ${selectedPayment.toUpperCase()}\nTotal: ₱${totalPrice}\n\nYou can track your order using the Order ID.`);
    
    closeModal();
  } catch (error) {
    console.error("Error submitting order:", error);
    alert("Error placing order. Please try again.");
  }
}

async function submitShirtOrder() {
  try {
    const printMethod = document.getElementById('printMethod').value;
    const shirtSize = document.getElementById('shirtSize').value;
    const quantity = document.getElementById('quantity').value;
    const totalPrice = document.getElementById('totalPrice').textContent.replace('₱', '');
    const notes = document.getElementById('shirtNotes')?.value || '-';
    
    if (!printMethod) {
      alert('Please select a printing method');
      return;
    }
    if (!shirtSize) {
      alert('Please select a shirt size');
      return;
    }
    
    // Export design as image
    let designDataURL = '';
    if (canvas) {
      designDataURL = canvas.toDataURL({
        format: 'png',
        quality: 1
      });
    }
    
    const orderData = {
      orderId: generateOrderId(),
      customer: 'Guest User',
      contact: '-',
      email: '-',
      product: 'T-Shirt Printing',
      type: printMethod.toUpperCase(),
      size: shirtSize.toUpperCase(),
      quantity: parseInt(quantity),
      price: prices.shirt[printMethod],
      total: parseFloat(totalPrice),
      notes: notes,
      status: 'Pending',
      date: getCurrentDate(),
      paymentMethod: selectedPayment,
      shirtColor: shirtColor,
      designImage: designDataURL.substring(0, 1000),
      height: '-',
      width: '-'
    };
    
    // Save to Firebase
    await addDoc(collection(db, "orders"), orderData);
    
    alert(`T-Shirt Order Placed Successfully!\n\nOrder ID: ${orderData.orderId}\nMethod: ${printMethod.toUpperCase()}\nSize: ${shirtSize.toUpperCase()}\nShirt Color: ${shirtColor}\nQuantity: ${quantity}\nPayment: ${selectedPayment.toUpperCase()}\nTotal: ₱${totalPrice}\n\nYour custom design has been saved!\nYou can track your order using the Order ID.`);
    
    closeModal();
  } catch (error) {
    console.error("Error submitting order:", error);
    alert("Error placing order. Please try again.");
  }
}

function resetForm() {
  const form = document.getElementById('orderForm');
  if (form) form.reset();
  
  selectedFile = null;
  selectedPayment = null;
  currentService = null;
  shirtColor = '#ffffff';
  
  document.querySelectorAll('.payment-option').forEach(option => {
    option.classList.remove('selected');
  });
  
  document.getElementById('totalPrice').textContent = '₱0.00';
}

function handleSearch(event) {
  event.preventDefault();
  const searchInput = document.getElementById('search-input').value;
  if (searchInput.trim()) {
    alert(`Search functionality coming soon!\nYou searched for: ${searchInput}`);
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay && modalOverlay.classList.contains('active')) {
      closeModal();
    }
  }
});

// Make functions globally accessible
window.openModal = openModal;
window.closeModal = closeModal;
window.closeModalOnOverlay = closeModalOnOverlay;
window.scrollToServices = scrollToServices;
window.handleFileSelect = handleFileSelect;
window.selectPayment = selectPayment;
window.handleSubmit = handleSubmit;
window.handleSearch = handleSearch;
window.addText = addText;
window.handleImageUpload = handleImageUpload;
window.deleteSelected = deleteSelected;
window.clearCanvas = clearCanvas;
window.changeShirtColor = changeShirtColor;