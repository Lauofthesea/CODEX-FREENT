import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

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
const storage = getStorage(app);

let selectedFile = null;
let selectedPayment = null;
let currentService = null;

// ========== USER DATA HELPER FUNCTIONS ==========
function getUserEmail() {
  return sessionStorage.getItem('userEmail') || 'guest@example.com';
}

function getCustomerName() {
  return sessionStorage.getItem('username') || 'Guest User';
}

// ========== FILE UPLOAD TO FIREBASE STORAGE ==========
async function uploadFilesToStorage(files, orderId) {
  const uploadedFiles = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const timestamp = Date.now();
    const fileName = `${orderId}_${timestamp}_${file.name}`;
    const storageRef = ref(storage, `orders/${orderId}/${fileName}`);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      uploadedFiles.push({
        name: file.name,
        url: downloadURL,
        size: file.size,
        type: file.type
      });
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error);
    }
  }
  
  return uploadedFiles;
}
// ================================================

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
    showShirtUploadForm();
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
      <input type="file" id="fileInput" accept=".pdf,.docx,.doc,.txt" onchange="handleGenericFileUpload(event, 'document')" />
      <div id="uploadedFilesList" class="uploaded-files-list"></div>
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
  selectedFile = null;
  window.uploadedFiles = [];
  calculatePrice();
  updateSubmitButton();
}

// Enhanced Shirt Upload Form with file management and size selection
function showShirtUploadForm() {
  const formContainer = document.getElementById('dynamicFormContainer');
  formContainer.innerHTML = `
    <style>
      .uploaded-files-list {
        margin-top: 1rem;
        max-height: 200px;
        overflow-y: auto;
      }
      .file-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background: rgba(255, 215, 0, 0.1);
        border-radius: 6px;
        margin-bottom: 0.5rem;
        border: 1px solid rgba(255, 215, 0, 0.3);
      }
      .file-item i {
        color: #FFD700;
        font-size: 1.2rem;
      }
      .file-item-info {
        flex: 1;
        color: #fff;
      }
      .file-item-name {
        font-weight: 600;
        margin-bottom: 0.2rem;
      }
      .file-item-size {
        font-size: 0.85rem;
        opacity: 0.8;
      }
      .file-remove-btn {
        background: #dc2626;
        color: white;
        border: none;
        padding: 0.4rem 0.8rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: background 0.3s ease;
      }
      .file-remove-btn:hover {
        background: #b91c1c;
      }
      .size-selection-container {
        margin-top: 1rem;
        padding: 1rem;
        background: rgba(79, 70, 229, 0.1);
        border-radius: 8px;
        border: 2px solid rgba(79, 70, 229, 0.3);
      }
      .size-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        margin-bottom: 0.5rem;
      }
      .size-item select {
        flex: 1;
        padding: 0.5rem;
        border-radius: 4px;
        border: 1px solid #d1d5db;
        background: #fff;
        color: #000;
      }
      .size-item input {
        width: 80px;
        padding: 0.5rem;
        border-radius: 4px;
        border: 1px solid #d1d5db;
      }
      .add-size-btn {
        width: 100%;
        padding: 0.6rem;
        background: #10b981;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        margin-top: 0.5rem;
        transition: background 0.3s ease;
      }
      .add-size-btn:hover {
        background: #059669;
      }
      .remove-size-btn {
        background: #ef4444;
        color: white;
        border: none;
        padding: 0.4rem 0.8rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
      }
      .remove-size-btn:hover {
        background: #dc2626;
      }
    </style>

    <div class="form-group">
      <label>Upload Design Files</label>
      <div class="file-upload-area" onclick="document.getElementById('shirtDesignUpload').click()">
        <i class="fas fa-cloud-upload-alt"></i>
        <p>Click to upload design files</p>
        <small>JPG, PNG, PDF (Max 20MB per file)</small>
      </div>
      <input type="file" id="shirtDesignUpload" accept="image/*,.pdf" multiple onchange="handleShirtFilesUpload(event)" style="display: none;" />
      <div id="uploadedFilesList" class="uploaded-files-list"></div>
    </div>

    <div class="form-group">
      <label for="printMethod">Printing Method</label>
      <select id="printMethod" onchange="updateShirtForm()">
        <option value="">Select Method</option>
        <option value="dtf">DTF (Direct to Film)</option>
        <option value="sublimation">Sublimation</option>
        <option value="vinyl">Vinyl Heat Transfer</option>
      </select>
    </div>

    <div class="form-group">
      <label for="shirtColorSelect">Shirt Color</label>
      <select id="shirtColorSelect" onchange="updateShirtForm()">
        <option value="">Select Color</option>
        <option value="White">White</option>
        <option value="Black">Black</option>
        <option value="Navy Blue">Navy Blue</option>
        <option value="Red">Red</option>
        <option value="Green">Green</option>
        <option value="Gray">Gray</option>
        <option value="Yellow">Yellow</option>
        <option value="Pink">Pink</option>
        <option value="Purple">Purple</option>
        <option value="Orange">Orange</option>
      </select>
    </div>

    <div class="form-group">
      <label for="claimMethod">Claim Method</label>
      <select id="claimMethod" onchange="updateShirtForm()">
        <option value="">Select Method</option>
        <option value="Pickup">Pickup</option>
        <option value="Delivery">Delivery</option>
      </select>
    </div>

    <div class="form-group">
      <label>Shirt Sizes & Quantities</label>
      <div id="sizeSelectionContainer" class="size-selection-container">
        <p style="color: #fff; margin-bottom: 1rem; font-size: 0.9rem;">
          <i class="fas fa-info-circle"></i> Add sizes and quantities for your order
        </p>
        <div id="sizesList"></div>
        <button type="button" class="add-size-btn" onclick="addSizeRow()">
          <i class="fas fa-plus"></i> Add Size
        </button>
      </div>
    </div>

    <div class="form-group">
      <label for="designInstructions">Design Instructions</label>
      <textarea id="designInstructions" rows="4" placeholder="Describe your design requirements, placement, colors, etc..." 
        style="resize: none; background: rgba(255, 255, 255, 0.05); color: #fff; border: 1px solid rgba(255, 215, 0, 0.3); border-radius: 8px; padding: 0.75rem; font-family: inherit;"></textarea>
    </div>

    <input type="hidden" id="quantity" value="0" />
  `;
  
  selectedFile = [];
  window.uploadedFiles = [];
  window.shirtSizes = [];
  calculatePrice();
  updateSubmitButton();
}

// Generic file upload handler for all services
function handleGenericFileUpload(event, serviceType) {
  const files = Array.from(event.target.files);
  const maxSize = serviceType === 'shirt' ? 20 : 10;
  
  if (!window.uploadedFiles) {
    window.uploadedFiles = [];
  }
  
  files.forEach(file => {
    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    
    if (parseFloat(fileSize) > maxSize) {
      alert(`File "${file.name}" is too large. Maximum size is ${maxSize}MB per file.`);
      return;
    }
    
    window.uploadedFiles.push(file);
  });
  
  updateUploadedFilesList();
  selectedFile = window.uploadedFiles;
  updateSubmitButton();
  if (typeof calculatePrice === 'function') {
    calculatePrice();
  }
}

// Handle multiple file uploads for shirt (backward compatibility)
function handleShirtFilesUpload(event) {
  handleGenericFileUpload(event, 'shirt');
}

// Update uploaded files list display
function updateUploadedFilesList() {
  const filesList = document.getElementById('uploadedFilesList');
  
  if (!window.uploadedFiles || window.uploadedFiles.length === 0) {
    filesList.innerHTML = '';
    return;
  }
  
  let html = '';
  window.uploadedFiles.forEach((file, index) => {
    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    html += `
      <div class="file-item">
        <i class="fas fa-file-image"></i>
        <div class="file-item-info">
          <div class="file-item-name">${file.name}</div>
          <div class="file-item-size">${fileSize} MB</div>
        </div>
        <button type="button" class="file-remove-btn" onclick="removeUploadedFile(${index})">
          <i class="fas fa-times"></i> Remove
        </button>
      </div>
    `;
  });
  
  filesList.innerHTML = html;
}

// Remove uploaded file
function removeUploadedFile(index) {
  if (window.uploadedFiles) {
    window.uploadedFiles.splice(index, 1);
    updateUploadedFilesList();
    selectedFile = window.uploadedFiles;
    updateSubmitButton();
  }
}

// Add size row
function addSizeRow() {
  if (!window.shirtSizes) {
    window.shirtSizes = [];
  }
  
  const sizeIndex = window.shirtSizes.length;
  window.shirtSizes.push({ size: '', quantity: 1 });
  
  updateSizesList();
}

// Update sizes list display
function updateSizesList() {
  const sizesList = document.getElementById('sizesList');
  
  if (!window.shirtSizes || window.shirtSizes.length === 0) {
    sizesList.innerHTML = '<p style="color: #aaa; text-align: center; padding: 1rem;">No sizes added yet</p>';
    document.getElementById('quantity').value = 0;
    return;
  }
  
  let html = '';
  let totalQty = 0;
  
  window.shirtSizes.forEach((item, index) => {
    totalQty += parseInt(item.quantity) || 0;
    html += `
      <div class="size-item">
        <select onchange="updateSizeValue(${index}, 'size', this.value)">
          <option value="">Select Size</option>
          <option value="XS" ${item.size === 'XS' ? 'selected' : ''}>Extra Small (XS)</option>
          <option value="S" ${item.size === 'S' ? 'selected' : ''}>Small (S)</option>
          <option value="M" ${item.size === 'M' ? 'selected' : ''}>Medium (M)</option>
          <option value="L" ${item.size === 'L' ? 'selected' : ''}>Large (L)</option>
          <option value="XL" ${item.size === 'XL' ? 'selected' : ''}>Extra Large (XL)</option>
          <option value="2XL" ${item.size === '2XL' ? 'selected' : ''}>2XL</option>
          <option value="3XL" ${item.size === '3XL' ? 'selected' : ''}>3XL</option>
        </select>
        <input type="number" min="1" value="${item.quantity}" onchange="updateSizeValue(${index}, 'quantity', this.value)" placeholder="Qty" />
        <button type="button" class="remove-size-btn" onclick="removeSizeRow(${index})">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
  });
  
  sizesList.innerHTML = html;
  document.getElementById('quantity').value = totalQty;
}

// Update size value
function updateSizeValue(index, field, value) {
  if (window.shirtSizes && window.shirtSizes[index]) {
    window.shirtSizes[index][field] = field === 'quantity' ? parseInt(value) || 1 : value;
    updateSizesList();
  }
}

// Remove size row
function removeSizeRow(index) {
  if (window.shirtSizes) {
    window.shirtSizes.splice(index, 1);
    updateSizesList();
  }
}

// Update shirt form
function updateShirtForm() {
  updateSubmitButton();
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
        <input type="file" id="fileInput" accept="image/*" multiple onchange="handleGenericFileUpload(event, 'photo')" />
        <div id="uploadedFilesList" class="uploaded-files-list"></div>
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
          <small>PDF, JPG, PNG (Max 10MB)</small>
        </div>
        <input type="file" id="fileInput" accept=".pdf,image/*" multiple onchange="handleGenericFileUpload(event, 'tarpaulin')" />
        <div id="uploadedFilesList" class="uploaded-files-list"></div>
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
        <textarea id="tarpaulinNotes" rows="3" placeholder="Any special instructions..." 
          style="resize: none; background: rgba(255, 255, 255, 0.05); color: #fff; border: 1px solid rgba(255, 215, 0, 0.3); border-radius: 8px; padding: 0.75rem; font-family: inherit;"></textarea>
      </div>
    `;
  } else if (service === 'stickers') {
    html = `
      <div class="form-group">
        <label>Upload Artwork (optional)</label>
        <div class="file-upload-area" onclick="document.getElementById('fileInput').click()">
          <i class="fas fa-cloud-upload-alt"></i>
          <p>Click to upload</p>
          <small>PDF, JPG, PNG (Max 10MB)</small>
        </div>
        <input type="file" id="fileInput" accept="image/*,application/pdf" multiple onchange="handleGenericFileUpload(event, 'stickers')" />
        <div id="uploadedFilesList" class="uploaded-files-list"></div>
      </div>

      <div class="form-group">
        <label for="stickerQty">Quantity</label>
        <input type="number" id="stickerQty" min="1" value="10" onchange="calculatePrice()" />
      </div>

      <div class="form-group">
        <label for="stickerNotes">Notes (size/material)</label>
        <textarea id="stickerNotes" rows="3" placeholder="Sticker size, finish, or other notes" 
          style="resize: none; background: rgba(255, 255, 255, 0.05); color: #fff; border: 1px solid rgba(255, 215, 0, 0.3); border-radius: 8px; padding: 0.75rem; font-family: inherit;"></textarea>
      </div>
    `;
  } else if (service === 'customized') {
    html = `
      <div class="form-group">
        <label>Upload Design</label>
        <div class="file-upload-area" onclick="document.getElementById('fileInput').click()">
          <i class="fas fa-cloud-upload-alt"></i>
          <p>Click to upload</p>
          <small>PDF, JPG, PNG (Max 10MB)</small>
        </div>
        <input type="file" id="fileInput" accept=".pdf,image/*" multiple onchange="handleGenericFileUpload(event, 'customized')" />
        <div id="uploadedFilesList" class="uploaded-files-list"></div>
      </div>

      <div class="form-group">
        <label for="customQty">Quantity</label>
        <input type="number" id="customQty" min="1" value="1" onchange="calculatePrice()" />
      </div>
    `;
  }

  formContainer.innerHTML = html;
  selectedFile = null;
  window.uploadedFiles = [];
  calculatePrice();
  updateSubmitButton();
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
    // For shirt orders, no price calculation - pending admin review
    document.getElementById('totalPrice').textContent = 'Pending Review';
    return;
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

  if (currentService === 'shirt') {
    // For shirt orders, check if design files are uploaded and required fields are filled
    submitBtn.disabled = !selectedFile;
    return;
  }

  if (!selectedPayment) {
    submitBtn.disabled = true;
    return;
  }

  if (currentService === 'document' || currentService === 'photo' || currentService === 'customized') {
    submitBtn.disabled = !selectedFile;
    return;
  }

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

// ========== UPDATED: Document order with user email ==========
async function submitShirtOrder() {
  try {
    const printMethod = document.getElementById('printMethod').value;
    const shirtColorSelect = document.getElementById('shirtColorSelect').value;
    const claimMethod = document.getElementById('claimMethod').value;
    const quantity = document.getElementById('quantity').value;
    const designInstructions = document.getElementById('designInstructions').value;
    
    if (!printMethod) {
      alert('Please select a printing method');
      return;
    }
    if (!shirtColorSelect) {
      alert('Please select a shirt color');
      return;
    }
    if (!claimMethod) {
      alert('Please select a claim method (Pickup or Delivery)');
      return;
    }
    if (!window.shirtSizes || window.shirtSizes.length === 0) {
      alert('Please add at least one size');
      return;
    }
    
    // Validate all sizes are selected
    const invalidSizes = window.shirtSizes.filter(s => !s.size);
    if (invalidSizes.length > 0) {
      alert('Please select a size for all entries');
      return;
    }
    
    if (!designInstructions.trim()) {
      alert('Please provide design instructions');
      return;
    }
    if (!selectedFile || selectedFile.length === 0) {
      alert('Please upload at least one design file');
      return;
    }
    
    // Show uploading message
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting order...';
    
    // Generate order ID first
    const orderId = generateOrderId();
    
    // Try to upload files to Firebase Storage (optional - may fail due to CORS)
    let uploadedFiles = [];
    try {
      if (selectedFile && selectedFile.length > 0) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading files...';
        uploadedFiles = await uploadFilesToStorage(selectedFile, orderId);
      }
    } catch (error) {
      console.warn("File upload failed (CORS issue), storing file info only:", error);
      // Store file info without URLs as fallback
      uploadedFiles = Array.from(selectedFile).map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        url: null // Will need manual upload or different storage solution
      }));
    }
    
    // Format sizes for display
    let sizesText = '';
    window.shirtSizes.forEach(item => {
      sizesText += `${item.size}: ${item.quantity} pcs\n`;
    });
    
    const orderData = {
      orderId: orderId,
      customer: getCustomerName(),
      contact: '-',
      email: getUserEmail(),
      product: 'T-Shirt Printing',
      type: printMethod.toUpperCase(),
      size: 'Multiple',
      quantity: parseInt(quantity),
      price: 0,
      total: 0,
      notes: `Shirt Color: ${shirtColorSelect}\nClaim Method: ${claimMethod}\n\nSizes:\n${sizesText}\nInstructions:\n${designInstructions}`,
      status: 'Pending Review',
      date: getCurrentDate(),
      paymentMethod: 'Pending',
      claimMethod: claimMethod,
      shirtColor: shirtColorSelect,
      designInstructions: designInstructions,
      sizes: JSON.stringify(window.shirtSizes),
      files: uploadedFiles,
      height: '-',
      width: '-'
    };
    
    await addDoc(collection(db, "orders"), orderData);
    
    // Create notification for user
    await addDoc(collection(db, "notifications"), {
      userId: getUserEmail(),
      orderId: orderId,
      title: 'Order Submitted',
      message: `Your shirt print order (${orderId}) has been submitted and is pending review.`,
      type: 'order_submitted',
      read: false,
      timestamp: new Date().toISOString()
    });
    
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    
    alert(`T-Shirt Design Submitted Successfully!\n\nOrder ID: ${orderData.orderId}\nMethod: ${printMethod.toUpperCase()}\nShirt Color: ${shirtColorSelect}\nTotal Quantity: ${quantity}\nFiles Uploaded: ${uploadedFiles.length}\n\nOur team will review your design and contact you with pricing and payment details. Thank you!`);
    
    closeModal();
  } catch (error) {
    console.error("Error submitting order:", error);
    alert("Error placing order. Please try again.");
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Place Order';
    }
  }
}


// ========== DOCUMENT ORDER SUBMISSION ==========
async function submitDocumentOrder() {
  try {
    if (!selectedFile) {
      alert('Please upload a document');
      return;
    }
    
    if (!selectedPayment) {
      alert('Please select a payment method');
      return;
    }
    
    const paperSize = document.getElementById('paperSize').value;
    const copies = parseInt(document.getElementById('copies').value) || 1;
    const pricePerPage = prices.document[paperSize] || 0;
    const total = pricePerPage * copies;
    
    const orderData = {
      orderId: generateOrderId(),
      customer: getCustomerName(),
      contact: '-',
      email: getUserEmail(),
      product: 'Document Printing',
      type: paperSize.toUpperCase(),
      size: paperSize.toUpperCase(),
      quantity: copies,
      price: pricePerPage,
      total: total,
      notes: `File: ${selectedFile.name}`,
      status: 'Pending',
      date: getCurrentDate(),
      paymentMethod: selectedPayment.toUpperCase(),
      height: '-',
      width: '-'
    };
    
    await addDoc(collection(db, "orders"), orderData);
    
    alert(`Order Placed Successfully!\n\nOrder ID: ${orderData.orderId}\nDocument: ${selectedFile.name}\nPaper Size: ${paperSize.toUpperCase()}\nCopies: ${copies}\nPayment: ${selectedPayment.toUpperCase()}\nTotal: ₱${total.toFixed(2)}\n\nThank you for your order!`);
    
    closeModal();
  } catch (error) {
    console.error("Error submitting order:", error);
    alert("Error placing order. Please try again.");
  }
}


// ========== GENERIC ORDER SUBMISSION (Photo, Tarpaulin, Stickers, Customized) ==========
async function submitGenericOrder(service) {
  try {
    if (!selectedPayment) {
      alert('Please select a payment method');
      return;
    }
    
    let orderData = {
      orderId: generateOrderId(),
      customer: getCustomerName(),
      contact: '-',
      email: getUserEmail(),
      status: 'Pending',
      date: getCurrentDate(),
      paymentMethod: selectedPayment.toUpperCase(),
      height: '-',
      width: '-'
    };
    
    if (service === 'photo') {
      if (!selectedFile) {
        alert('Please upload a photo');
        return;
      }
      const size = document.getElementById('photoSize').value;
      const qty = parseInt(document.getElementById('photoCopies').value) || 1;
      const pricePer = prices.photo[size] || 0;
      const total = pricePer * qty;
      
      orderData.product = 'Photo Printing';
      orderData.type = size.toUpperCase();
      orderData.size = size.toUpperCase();
      orderData.quantity = qty;
      orderData.price = pricePer;
      orderData.total = total;
      orderData.notes = `File: ${selectedFile.name}`;
      
    } else if (service === 'tarpaulin') {
      const size = document.getElementById('tarpaulinSize').value;
      const qty = parseInt(document.getElementById('tarpaulinQty').value) || 1;
      const notes = document.getElementById('tarpaulinNotes').value;
      const pricePer = prices.tarpaulin[size] || 0;
      const total = pricePer * qty;
      
      orderData.product = 'Tarpaulin Printing';
      orderData.type = size.toUpperCase();
      orderData.size = size.toUpperCase();
      orderData.quantity = qty;
      orderData.price = pricePer;
      orderData.total = total;
      orderData.notes = notes || (selectedFile ? `File: ${selectedFile.name}` : '-');
      
    } else if (service === 'stickers') {
      const qty = parseInt(document.getElementById('stickerQty').value) || 1;
      const notes = document.getElementById('stickerNotes').value;
      const total = prices.stickers.perPiece * qty;
      
      orderData.product = 'Stickers';
      orderData.type = 'Custom';
      orderData.size = 'Custom';
      orderData.quantity = qty;
      orderData.price = prices.stickers.perPiece;
      orderData.total = total;
      orderData.notes = notes || (selectedFile ? `File: ${selectedFile.name}` : '-');
      
    } else if (service === 'customized') {
      if (!selectedFile) {
        alert('Please upload a design');
        return;
      }
      const qty = parseInt(document.getElementById('customQty').value) || 1;
      const total = prices.customized.base * qty;
      
      orderData.product = 'Customized Item';
      orderData.type = 'Custom';
      orderData.size = 'Custom';
      orderData.quantity = qty;
      orderData.price = prices.customized.base;
      orderData.total = total;
      orderData.notes = `File: ${selectedFile.name}`;
    }
    
    await addDoc(collection(db, "orders"), orderData);
    
    alert(`Order Placed Successfully!\n\nOrder ID: ${orderData.orderId}\nProduct: ${orderData.product}\nQuantity: ${orderData.quantity}\nPayment: ${selectedPayment.toUpperCase()}\nTotal: ₱${orderData.total.toFixed(2)}\n\nThank you for your order!`);
    
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
window._openModal = openModal;
window._closeModal = closeModal;
window._closeModalOnOverlay = closeModalOnOverlay;
window._selectPayment = selectPayment;
window._handleSubmit = handleSubmit;

// Also assign to non-prefixed for direct access
window.openModal = openModal;
window.closeModal = closeModal;
window.closeModalOnOverlay = closeModalOnOverlay;
window.scrollToServices = scrollToServices;
window.handleFileSelect = handleFileSelect;
window.selectPayment = selectPayment;
window.handleSubmit = handleSubmit;
window.handleSearch = handleSearch;
window.calculatePrice = calculatePrice;
window.updateSubmitButton = updateSubmitButton;
window.handleGenericFileUpload = handleGenericFileUpload;
window.handleShirtFilesUpload = handleShirtFilesUpload;
window.removeUploadedFile = removeUploadedFile;
window.addSizeRow = addSizeRow;
window.updateSizeValue = updateSizeValue;
window.removeSizeRow = removeSizeRow;
window.updateShirtForm = updateShirtForm;

// Dispatch event to signal module is ready
window.dispatchEvent(new Event('servicesModuleReady'));
console.log('Services module functions registered');