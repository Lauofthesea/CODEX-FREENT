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

// ========== FILE UPLOAD TO CLOUDINARY ==========
const CLOUDINARY_CLOUD_NAME = 'djyyvuh3d';
const CLOUDINARY_UPLOAD_PRESET = 'lines_printing_orders';

async function uploadFilesToStorage(files, orderId) {
  const uploadedFiles = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      // Create form data for Cloudinary upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', `orders/${orderId}`);
      formData.append('public_id', `${orderId}_${Date.now()}_${file.name.split('.')[0]}`);
      
      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: 'POST',
          body: formData
        }
      );
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      uploadedFiles.push({
        name: file.name,
        url: data.secure_url,
        size: file.size,
        type: file.type,
        cloudinaryId: data.public_id
      });
      
      console.log(`✅ Uploaded ${file.name} to Cloudinary`);
    } catch (error) {
      console.error(`❌ Error uploading ${file.name}:`, error);
      // Add file info even if upload fails
      uploadedFiles.push({
        name: file.name,
        url: null,
        size: file.size,
        type: file.type,
        error: error.message
      });
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
    legal: 7,
    colorSurcharge: 5, // Additional cost per page for colored printing
    deliveryFee: 50
  },
  shirt: {
    dtf: 250,
    sublimation: 200,
    vinyl: 150
  },
  photo: {
    small: 25,
    medium: 50,
    large: 100,
    deliveryFee: 50
  },
  tarpaulin: {
    small: 500,
    medium: 1000,
    large: 2000,
    deliveryFee: 100
  },
  stickers: {
    perPiece: 15,
    deliveryFee: 50
  },
  customized: {
    base: 150,
    deliveryFee: 50
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
  // Check if user is logged in before opening order modal
  const isLoggedIn = sessionStorage.getItem('userLoggedIn');
  if (!isLoggedIn) {
    showConfirmModal(
      'Login Required',
      'You need to be logged in to place an order. Would you like to go to the login page?',
      function() {
        window.location.href = './login.html';
      }
    );
    return;
  }

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
      <input type="file" id="fileInput" accept=".pdf,.docx,.doc,.txt" onchange="handleDocumentFileUpload(event)" />
      <div id="uploadedFilesList" class="uploaded-files-list"></div>
      <div id="pageCountDisplay" style="display: none; margin-top: 0.5rem; padding: 0.75rem; background: rgba(79, 70, 229, 0.1); border-radius: 8px; border: 1px solid rgba(79, 70, 229, 0.3);">
        <i class="fas fa-file-alt" style="color: #4F46E5;"></i>
        <span style="color: #fff; font-weight: 600; margin-left: 0.5rem;">Pages detected: <span id="pageCount">0</span></span>
      </div>
    </div>

    <div class="form-group">
      <label for="paperSize">Paper Size</label>
      <select id="paperSize" onchange="calculatePrice()" oninput="calculatePrice()">
        <option value="a4">A4 (210 × 297 mm) - ₱2/page</option>
        <option value="a3">A3 (297 × 420 mm) - ₱15/page</option>
        <option value="a5">A5 (148 × 210 mm) - ₱3/page</option>
        <option value="letter">Letter (8.5 × 11 in) - ₱5/page</option>
        <option value="legal">Legal (8.5 × 14 in) - ₱7/page</option>
      </select>
    </div>

    <div class="form-group">
      <label for="printColor">Print Color</label>
      <select id="printColor" onchange="calculatePrice()" oninput="calculatePrice()">
        <option value="bw">Black & White</option>
        <option value="color">Colored (+₱3/page)</option>
      </select>
    </div>

    <div class="form-group">
      <label for="copies">Number of Copies</label>
      <input type="number" id="copies" min="1" max="1000" value="1" onchange="calculatePrice()" oninput="calculatePrice()" />
    </div>

    <div class="form-group">
      <label for="claimMethod">Claim Method</label>
      <select id="claimMethod" onchange="calculatePrice()" oninput="calculatePrice()">
        <option value="">Select Method</option>
        <option value="Pickup">Pickup</option>
        <option value="Delivery">Delivery (+₱50)</option>
      </select>
    </div>

    <input type="hidden" id="documentPages" value="1" />
  `;
  selectedFile = null;
  window.uploadedFiles = [];
  window.documentPageCount = 1;
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

// Document file upload with page count detection
async function handleDocumentFileUpload(event) {
  const files = Array.from(event.target.files);
  const maxSize = 10;
  
  if (!window.uploadedFiles) {
    window.uploadedFiles = [];
  }
  
  for (const file of files) {
    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    
    if (parseFloat(fileSize) > maxSize) {
      showErrorModal('File Too Large', `File "${file.name}" is too large. Maximum size is ${maxSize}MB per file.`);
      continue;
    }
    
    window.uploadedFiles.push(file);
    
    // Try to detect page count for PDF files
    if (file.type === 'application/pdf') {
      try {
        const pageCount = await detectPDFPageCount(file);
        window.documentPageCount = pageCount;
        document.getElementById('documentPages').value = pageCount;
        document.getElementById('pageCount').textContent = pageCount;
        document.getElementById('pageCountDisplay').style.display = 'block';
      } catch (error) {
        console.warn('Could not detect page count:', error);
        // Default to 1 page if detection fails
        window.documentPageCount = 1;
        document.getElementById('documentPages').value = 1;
      }
    } else {
      // For non-PDF files, default to 1 page
      window.documentPageCount = 1;
      document.getElementById('documentPages').value = 1;
      document.getElementById('pageCountDisplay').style.display = 'none';
    }
  }
  
  updateUploadedFilesList();
  selectedFile = window.uploadedFiles;
  updateSubmitButton();
  calculatePrice();
}

// Detect PDF page count
async function detectPDFPageCount(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const contents = e.target.result;
      
      // Simple page count detection using /Type /Page pattern
      // This is a basic method and may not work for all PDFs
      const matches = contents.match(/\/Type\s*\/Page[^s]/g);
      
      if (matches) {
        resolve(matches.length);
      } else {
        // Fallback: try to find /Count in Pages object
        const countMatch = contents.match(/\/Count\s+(\d+)/);
        if (countMatch) {
          resolve(parseInt(countMatch[1]));
        } else {
          resolve(1); // Default to 1 if can't detect
        }
      }
    };
    
    reader.onerror = function() {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
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
      showErrorModal('File Too Large', `File "${file.name}" is too large. Maximum size is ${maxSize}MB per file.`);
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
        <select id="photoSize" onchange="calculatePrice()" oninput="calculatePrice()">
          <option value="small">Small - ₱25</option>
          <option value="medium">Medium - ₱50</option>
          <option value="large">Large - ₱100</option>
        </select>
      </div>

      <div class="form-group">
        <label for="photoCopies">Copies</label>
        <input type="number" id="photoCopies" min="1" value="1" onchange="calculatePrice()" oninput="calculatePrice()" />
      </div>

      <div class="form-group">
        <label for="photoClaimMethod">Claim Method</label>
        <select id="photoClaimMethod" onchange="calculatePrice()" oninput="calculatePrice()">
          <option value="">Select Method</option>
          <option value="Pickup">Pickup</option>
          <option value="Delivery">Delivery (+₱50)</option>
        </select>
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
        <select id="tarpaulinSize" onchange="calculatePrice()" oninput="calculatePrice()">
          <option value="small">Small - ₱500</option>
          <option value="medium">Medium - ₱1000</option>
          <option value="large">Large - ₱2000</option>
        </select>
      </div>

      <div class="form-group">
        <label for="tarpaulinQty">Quantity</label>
        <input type="number" id="tarpaulinQty" min="1" value="1" onchange="calculatePrice()" oninput="calculatePrice()" />
      </div>

      <div class="form-group">
        <label for="tarpaulinClaimMethod">Claim Method</label>
        <select id="tarpaulinClaimMethod" onchange="calculatePrice()" oninput="calculatePrice()">
          <option value="">Select Method</option>
          <option value="Pickup">Pickup</option>
          <option value="Delivery">Delivery (+₱100)</option>
        </select>
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
        <input type="number" id="stickerQty" min="1" value="10" onchange="calculatePrice()" oninput="calculatePrice()" />
      </div>

      <div class="form-group">
        <label for="stickerClaimMethod">Claim Method</label>
        <select id="stickerClaimMethod" onchange="calculatePrice()" oninput="calculatePrice()">
          <option value="">Select Method</option>
          <option value="Pickup">Pickup</option>
          <option value="Delivery">Delivery (+₱50)</option>
        </select>
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
        <input type="number" id="customQty" min="1" value="1" onchange="calculatePrice()" oninput="calculatePrice()" />
      </div>

      <div class="form-group">
        <label for="customClaimMethod">Claim Method</label>
        <select id="customClaimMethod" onchange="calculatePrice()" oninput="calculatePrice()">
          <option value="">Select Method</option>
          <option value="Pickup">Pickup</option>
          <option value="Delivery">Delivery (+₱50)</option>
        </select>
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
      showErrorModal('File Too Large', 'File size must be less than 10MB');
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
    const printColor = document.getElementById('printColor')?.value || 'bw';
    const copies = parseInt(document.getElementById('copies').value) || 1;
    const pages = parseInt(document.getElementById('documentPages')?.value) || 1;
    const claimMethod = document.getElementById('claimMethod')?.value;
    
    // Base price per page
    let pricePerPage = prices.document[paperSize] || 0;
    
    // Add color surcharge if colored printing
    if (printColor === 'color') {
      pricePerPage += prices.document.colorSurcharge;
    }
    
    // Calculate: (price per page × pages × copies)
    total = pricePerPage * pages * copies;
    
    // Add delivery fee if delivery selected
    if (claimMethod === 'Delivery') {
      total += prices.document.deliveryFee;
    }
  } else if (currentService === 'shirt') {
    
    document.getElementById('totalPrice').textContent = 'This order will be reviewed for pricing.';
    return;
  } else if (currentService === 'photo') {
    if (!selectedFile) {
      document.getElementById('totalPrice').textContent = '₱0.00';
      return;
    }
    const size = document.getElementById('photoSize')?.value || 'small';
    const qty = parseInt(document.getElementById('photoCopies')?.value) || 1;
    const claimMethod = document.getElementById('photoClaimMethod')?.value;
    
    let pricePer = prices.photo[size] || 0;
    total = pricePer * qty;
    
    // Add delivery fee if delivery selected
    if (claimMethod === 'Delivery') {
      total += prices.photo.deliveryFee;
    }
  } else if (currentService === 'tarpaulin') {
    const size = document.getElementById('tarpaulinSize')?.value || 'small';
    const qty = parseInt(document.getElementById('tarpaulinQty')?.value) || 1;
    const claimMethod = document.getElementById('tarpaulinClaimMethod')?.value;
    
    let pricePer = prices.tarpaulin[size] || 0;
    total = pricePer * qty;
    
    // Add delivery fee if delivery selected
    if (claimMethod === 'Delivery') {
      total += prices.tarpaulin.deliveryFee;
    }
  } else if (currentService === 'stickers') {
    const qty = parseInt(document.getElementById('stickerQty')?.value) || 1;
    const claimMethod = document.getElementById('stickerClaimMethod')?.value;
    
    total = prices.stickers.perPiece * qty;
    
    // Add delivery fee if delivery selected
    if (claimMethod === 'Delivery') {
      total += prices.stickers.deliveryFee;
    }
  } else if (currentService === 'customized') {
    const qty = parseInt(document.getElementById('customQty')?.value) || 1;
    const claimMethod = document.getElementById('customClaimMethod')?.value;
    
    total = prices.customized.base * qty;
    
    // Add delivery fee if delivery selected
    if (claimMethod === 'Delivery') {
      total += prices.customized.deliveryFee;
    }
  }

  document.getElementById('totalPrice').textContent = `₱${total.toFixed(2)}`;
  
  // Update payment method availability based on total
  updatePaymentMethods(total);
}

// Update payment method availability based on order total
function updatePaymentMethods(total) {
  const cardOption = document.getElementById('payment-card');
  const bankOption = document.getElementById('payment-bank');
  const minAmount = 999;
  
  if (cardOption && bankOption) {
    if (total < minAmount) {
      // Disable card and bank transfer for orders under ₱999
      cardOption.classList.add('disabled');
      cardOption.style.opacity = '0.5';
      cardOption.style.cursor = 'not-allowed';
      cardOption.onclick = function(e) {
        e.stopPropagation();
        showErrorModal('Minimum Amount Required', `Card payment requires a minimum order of ₱${minAmount}. Your current total is ₱${total.toFixed(2)}.`);
      };
      
      bankOption.classList.add('disabled');
      bankOption.style.opacity = '0.5';
      bankOption.style.cursor = 'not-allowed';
      bankOption.onclick = function(e) {
        e.stopPropagation();
        showErrorModal('Minimum Amount Required', `Bank transfer requires a minimum order of ₱${minAmount}. Your current total is ₱${total.toFixed(2)}.`);
      };
      
      // If card or bank was selected, clear selection
      if (selectedPayment === 'card' || selectedPayment === 'bank') {
        selectedPayment = null;
        document.querySelectorAll('.payment-option').forEach(option => {
          option.classList.remove('selected');
        });
        updateSubmitButton();
      }
    } else {
      // Enable card and bank transfer for orders ₱999 and above
      cardOption.classList.remove('disabled');
      cardOption.style.opacity = '1';
      cardOption.style.cursor = 'pointer';
      cardOption.onclick = function() { selectPayment('card', this); };
      
      bankOption.classList.remove('disabled');
      bankOption.style.opacity = '1';
      bankOption.style.cursor = 'pointer';
      bankOption.onclick = function() { selectPayment('bank', this); };
    }
  }
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
  // Check if user is logged in
  const isLoggedIn = sessionStorage.getItem('userLoggedIn');
  if (!isLoggedIn) {
    showConfirmModal(
      'Login Required',
      'You need to be logged in to place an order. Would you like to go to the login page?',
      function() {
        window.location.href = './login.html';
      }
    );
    return;
  }

  try {
    const printMethod = document.getElementById('printMethod').value;
    const shirtColorSelect = document.getElementById('shirtColorSelect').value;
    const claimMethod = document.getElementById('claimMethod').value;
    const quantity = document.getElementById('quantity').value;
    const designInstructions = document.getElementById('designInstructions').value;
    
    if (!printMethod) {
      showErrorModal('Missing Information', 'Please select a printing method');
      return;
    }
    if (!shirtColorSelect) {
      showErrorModal('Missing Information', 'Please select a shirt color');
      return;
    }
    if (!claimMethod) {
      showErrorModal('Missing Information', 'Please select a claim method (Pickup or Delivery)');
      return;
    }
    if (!window.shirtSizes || window.shirtSizes.length === 0) {
      showErrorModal('Missing Information', 'Please add at least one size');
      return;
    }
    
    // Validate all sizes are selected
    const invalidSizes = window.shirtSizes.filter(s => !s.size);
    if (invalidSizes.length > 0) {
      showErrorModal('Invalid Selection', 'Please select a size for all entries');
      return;
    }
    
    if (!designInstructions.trim()) {
      showErrorModal('Missing Information', 'Please provide design instructions');
      return;
    }
    if (!selectedFile || selectedFile.length === 0) {
      showErrorModal('Missing Files', 'Please upload at least one design file');
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
    
    showSuccessModal(
      'Order Submitted Successfully!',
      `<strong>Order ID:</strong> ${orderData.orderId}<br>
       <strong>Method:</strong> ${printMethod.toUpperCase()}<br>
       <strong>Shirt Color:</strong> ${shirtColorSelect}<br>
       <strong>Total Quantity:</strong> ${quantity}<br>
       <strong>Files Uploaded:</strong> ${uploadedFiles.length}<br><br>
       Our team will review your design and contact you with pricing and payment details. Thank you!`,
      closeModal
    );
  } catch (error) {
    console.error("Error submitting order:", error);
    showErrorModal('Error', 'Error placing order. Please try again.');
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Place Order';
    }
  }
}


// ========== DOCUMENT ORDER SUBMISSION ==========
async function submitDocumentOrder() {
  // Check if user is logged in
  const isLoggedIn = sessionStorage.getItem('userLoggedIn');
  if (!isLoggedIn) {
    showConfirmModal(
      'Login Required',
      'You need to be logged in to place an order. Would you like to go to the login page?',
      function() {
        window.location.href = './login.html';
      }
    );
    return;
  }

  try {
    if (!selectedFile) {
      showErrorModal('Missing File', 'Please upload a document');
      return;
    }
    
    if (!selectedPayment) {
      showErrorModal('Missing Information', 'Please select a payment method');
      return;
    }
    
    const claimMethod = document.getElementById('claimMethod')?.value;
    if (!claimMethod) {
      showErrorModal('Missing Information', 'Please select a claim method (Pickup or Delivery)');
      return;
    }
    
    const paperSize = document.getElementById('paperSize').value;
    const printColor = document.getElementById('printColor')?.value || 'bw';
    const copies = parseInt(document.getElementById('copies').value) || 1;
    const pages = parseInt(document.getElementById('documentPages')?.value) || 1;
    
    // Calculate price
    let pricePerPage = prices.document[paperSize] || 0;
    if (printColor === 'color') {
      pricePerPage += prices.document.colorSurcharge;
    }
    
    let total = pricePerPage * pages * copies;
    if (claimMethod === 'Delivery') {
      total += prices.document.deliveryFee;
    }
    
    const colorText = printColor === 'color' ? 'Colored' : 'Black & White';
    const filesArray = Array.isArray(selectedFile) ? selectedFile : [selectedFile];
    const fileName = filesArray[0].name;
    
    // Generate order ID first
    const orderId = generateOrderId();
    
    // Upload files to Cloudinary
    let uploadedFiles = [];
    try {
      uploadedFiles = await uploadFilesToStorage(filesArray, orderId);
    } catch (error) {
      console.warn("File upload failed, storing file info only:", error);
      uploadedFiles = filesArray.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        url: null
      }));
    }
    
    const orderData = {
      orderId: orderId,
      customer: getCustomerName(),
      contact: '-',
      email: getUserEmail(),
      product: 'Document Printing',
      type: `${paperSize.toUpperCase()} - ${colorText}`,
      size: paperSize.toUpperCase(),
      quantity: copies,
      price: pricePerPage,
      total: total,
      notes: `File: ${fileName}\nPages: ${pages}\nColor: ${colorText}\nClaim: ${claimMethod}`,
      status: 'Pending',
      date: getCurrentDate(),
      paymentMethod: selectedPayment.toUpperCase(),
      claimMethod: claimMethod,
      printColor: printColor,
      pages: pages,
      files: uploadedFiles,
      height: '-',
      width: '-'
    };
    
    await addDoc(collection(db, "orders"), orderData);
    
    // Create notification
    await addDoc(collection(db, "notifications"), {
      userId: getUserEmail(),
      orderId: orderData.orderId,
      title: 'Order Submitted',
      message: `Your document printing order (${orderData.orderId}) has been submitted successfully.`,
      type: 'order_submitted',
      read: false,
      timestamp: new Date().toISOString()
    });
    
    showSuccessModal(
      'Order Placed Successfully!',
      `<strong>Order ID:</strong> ${orderData.orderId}<br>
       <strong>Document:</strong> ${fileName}<br>
       <strong>Pages:</strong> ${pages}<br>
       <strong>Paper Size:</strong> ${paperSize.toUpperCase()}<br>
       <strong>Color:</strong> ${colorText}<br>
       <strong>Copies:</strong> ${copies}<br>
       <strong>Claim Method:</strong> ${claimMethod}<br>
       <strong>Payment:</strong> ${selectedPayment.toUpperCase()}<br>
       <strong>Total:</strong> ₱${total.toFixed(2)}<br><br>
       Thank you for your order!`,
      closeModal
    );
  } catch (error) {
    console.error("Error submitting order:", error);
    alert("Error placing order. Please try again.");
  }
}


// ========== GENERIC ORDER SUBMISSION (Photo, Tarpaulin, Stickers, Customized) ==========
async function submitGenericOrder(service) {
  // Check if user is logged in
  const isLoggedIn = sessionStorage.getItem('userLoggedIn');
  if (!isLoggedIn) {
    showConfirmModal(
      'Login Required',
      'You need to be logged in to place an order. Would you like to go to the login page?',
      function() {
        window.location.href = './login.html';
      }
    );
    return;
  }

  try {
    if (!selectedPayment) {
      showErrorModal('Missing Information', 'Please select a payment method');
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
        showErrorModal('Missing File', 'Please upload a photo');
        return;
      }
      const claimMethod = document.getElementById('photoClaimMethod')?.value;
      if (!claimMethod) {
        showErrorModal('Missing Information', 'Please select a claim method');
        return;
      }
      
      const size = document.getElementById('photoSize').value;
      const qty = parseInt(document.getElementById('photoCopies').value) || 1;
      let pricePer = prices.photo[size] || 0;
      let total = pricePer * qty;
      
      if (claimMethod === 'Delivery') {
        total += prices.photo.deliveryFee;
      }
      
      const fileName = Array.isArray(selectedFile) ? selectedFile[0].name : selectedFile.name;
      
      orderData.product = 'Photo Printing';
      orderData.type = size.toUpperCase();
      orderData.size = size.toUpperCase();
      orderData.quantity = qty;
      orderData.price = pricePer;
      orderData.total = total;
      orderData.claimMethod = claimMethod;
      orderData.notes = `File: ${fileName}\nClaim: ${claimMethod}`;
      
    } else if (service === 'tarpaulin') {
      const claimMethod = document.getElementById('tarpaulinClaimMethod')?.value;
      if (!claimMethod) {
        showErrorModal('Missing Information', 'Please select a claim method');
        return;
      }
      
      const size = document.getElementById('tarpaulinSize').value;
      const qty = parseInt(document.getElementById('tarpaulinQty').value) || 1;
      const notes = document.getElementById('tarpaulinNotes').value;
      let pricePer = prices.tarpaulin[size] || 0;
      let total = pricePer * qty;
      
      if (claimMethod === 'Delivery') {
        total += prices.tarpaulin.deliveryFee;
      }
      
      orderData.product = 'Tarpaulin Printing';
      orderData.type = size.toUpperCase();
      orderData.size = size.toUpperCase();
      orderData.quantity = qty;
      orderData.price = pricePer;
      orderData.total = total;
      orderData.claimMethod = claimMethod;
      orderData.notes = `${notes || ''}\nClaim: ${claimMethod}${selectedFile ? `\nFile: ${selectedFile.name}` : ''}`;
      
    } else if (service === 'stickers') {
      const claimMethod = document.getElementById('stickerClaimMethod')?.value;
      if (!claimMethod) {
        showErrorModal('Missing Information', 'Please select a claim method');
        return;
      }
      
      const qty = parseInt(document.getElementById('stickerQty').value) || 1;
      const notes = document.getElementById('stickerNotes').value;
      let total = prices.stickers.perPiece * qty;
      
      if (claimMethod === 'Delivery') {
        total += prices.stickers.deliveryFee;
      }
      
      orderData.product = 'Stickers';
      orderData.type = 'Custom';
      orderData.size = 'Custom';
      orderData.quantity = qty;
      orderData.price = prices.stickers.perPiece;
      orderData.total = total;
      orderData.claimMethod = claimMethod;
      orderData.notes = `${notes || ''}\nClaim: ${claimMethod}${selectedFile ? `\nFile: ${selectedFile.name}` : ''}`;
      
    } else if (service === 'customized') {
      if (!selectedFile) {
        showErrorModal('Missing File', 'Please upload a design');
        return;
      }
      const claimMethod = document.getElementById('customClaimMethod')?.value;
      if (!claimMethod) {
        showErrorModal('Missing Information', 'Please select a claim method');
        return;
      }
      
      const qty = parseInt(document.getElementById('customQty').value) || 1;
      let total = prices.customized.base * qty;
      
      if (claimMethod === 'Delivery') {
        total += prices.customized.deliveryFee;
      }
      
      const fileName = Array.isArray(selectedFile) ? selectedFile[0].name : selectedFile.name;
      
      orderData.product = 'Customized Item';
      orderData.type = 'Custom';
      orderData.size = 'Custom';
      orderData.quantity = qty;
      orderData.price = prices.customized.base;
      orderData.total = total;
      orderData.claimMethod = claimMethod;
      orderData.notes = `File: ${fileName}\nClaim: ${claimMethod}`;
    }
    
    // Upload files if any
    if (selectedFile && window.uploadedFiles && window.uploadedFiles.length > 0) {
      try {
        const uploadedFiles = await uploadFilesToStorage(window.uploadedFiles, orderData.orderId);
        orderData.files = uploadedFiles;
      } catch (error) {
        console.warn("File upload failed, storing file info only:", error);
        orderData.files = window.uploadedFiles.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          url: null
        }));
      }
    }
    
    await addDoc(collection(db, "orders"), orderData);
    
    // Create notification
    await addDoc(collection(db, "notifications"), {
      userId: getUserEmail(),
      orderId: orderData.orderId,
      title: 'Order Submitted',
      message: `Your ${orderData.product.toLowerCase()} order (${orderData.orderId}) has been submitted successfully.`,
      type: 'order_submitted',
      read: false,
      timestamp: new Date().toISOString()
    });
    
    showSuccessModal(
      'Order Placed Successfully!',
      `<strong>Order ID:</strong> ${orderData.orderId}<br>
       <strong>Product:</strong> ${orderData.product}<br>
       <strong>Quantity:</strong> ${orderData.quantity}<br>
       <strong>Claim Method:</strong> ${orderData.claimMethod}<br>
       <strong>Payment:</strong> ${selectedPayment.toUpperCase()}<br>
       <strong>Total:</strong> ₱${orderData.total.toFixed(2)}<br><br>
       Thank you for your order!`,
      closeModal
    );
  } catch (error) {
    console.error("Error submitting order:", error);
    showErrorModal('Error', 'Error placing order. Please try again.');
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

// Search data
const searchData = [
  { name: 'Document Printing', category: 'Service', icon: 'fas fa-file-alt', action: () => openModal('document') },
  { name: 'Photo Printing', category: 'Service', icon: 'fas fa-image', action: () => openModal('photo') },
  { name: 'Shirt Printing', category: 'Service', icon: 'fas fa-tshirt', action: () => openShirtDesignerChoice() },
  { name: 'Tarpaulin Printing', category: 'Service', icon: 'fas fa-rectangle-ad', action: () => openModal('tarpaulin') },
  { name: 'Signages', category: 'Service', icon: 'fas fa-sign', url: '#signages' },
  { name: 'Stickers', category: 'Service', icon: 'fas fa-sticky-note', action: () => openModal('stickers') },
  { name: 'Gift Boxes', category: 'Service', icon: 'fas fa-gift', url: '#gifts' },
  { name: 'Lanyards', category: 'Service', icon: 'fas fa-id-badge', url: '#lanyards' },
  { name: 'Invitations', category: 'Service', icon: 'fas fa-envelope', url: '#invitations' },
  { name: 'Customized Items', category: 'Service', icon: 'fas fa-magic', action: () => openModal('customized') }
];

// Show search suggestions
function showSearchSuggestions(event) {
  const query = event.target.value.trim().toLowerCase();
  const suggestionsDiv = document.getElementById('searchSuggestions');
  
  if (!suggestionsDiv) return;
  
  if (query.length === 0) {
    suggestionsDiv.classList.remove('active');
    return;
  }

  const filtered = searchData.filter(item => 
    item.name.toLowerCase().includes(query) || 
    item.category.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    suggestionsDiv.innerHTML = '<div class="no-results">No results found</div>';
    suggestionsDiv.classList.add('active');
    return;
  }

  suggestionsDiv.innerHTML = filtered.map((item, index) => `
    <div class="suggestion-item" onclick="selectSuggestion(${index}, '${query}')">
      <i class="${item.icon}"></i>
      <span class="suggestion-text">${item.name}</span>
      <span class="suggestion-category">${item.category}</span>
    </div>
  `).join('');
  
  suggestionsDiv.classList.add('active');
}

// Select suggestion
function selectSuggestion(index, query) {
  const filtered = searchData.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase()) || 
    item.category.toLowerCase().includes(query.toLowerCase())
  );
  
  const item = filtered[index];
  if (item) {
    if (item.action) {
      item.action();
    } else if (item.url) {
      window.location.href = item.url;
    }
  }
  
  // Close suggestions
  const suggestionsDiv = document.getElementById('searchSuggestions');
  if (suggestionsDiv) {
    suggestionsDiv.classList.remove('active');
  }
  
  // Clear search input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.value = '';
  }
}

function handleSearch(event) {
  event.preventDefault();
  const searchInput = document.getElementById('search-input').value.trim();
  if (searchInput) {
    // Try to find exact match
    const match = searchData.find(item => 
      item.name.toLowerCase() === searchInput.toLowerCase()
    );
    
    if (match) {
      if (match.action) {
        match.action();
      } else if (match.url) {
        window.location.href = match.url;
      }
    } else {
      showInfoModal('No Results', `No exact match found for: ${searchInput}`);
    }
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

// Close search suggestions when clicking outside
document.addEventListener('click', function(event) {
  const searchWrapper = document.querySelector('.search-wrapper');
  const suggestionsDiv = document.getElementById('searchSuggestions');
  if (searchWrapper && suggestionsDiv && !searchWrapper.contains(event.target)) {
    suggestionsDiv.classList.remove('active');
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
window.showSearchSuggestions = showSearchSuggestions;
window.selectSuggestion = selectSuggestion;
window.calculatePrice = calculatePrice;
window.updatePaymentMethods = updatePaymentMethods;
window.updateSubmitButton = updateSubmitButton;
window.handleGenericFileUpload = handleGenericFileUpload;
window.handleDocumentFileUpload = handleDocumentFileUpload;
window.handleShirtFilesUpload = handleShirtFilesUpload;
window.removeUploadedFile = removeUploadedFile;
window.addSizeRow = addSizeRow;
window.updateSizeValue = updateSizeValue;
window.removeSizeRow = removeSizeRow;
window.updateShirtForm = updateShirtForm;

// Dispatch event to signal module is ready
window.dispatchEvent(new Event('servicesModuleReady'));
console.log('Services module functions registered');