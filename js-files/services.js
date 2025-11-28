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
  
  // Close PDF viewer if open
  if (typeof closePdfViewer === 'function') {
    closePdfViewer();
  }
  
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
        <option value="color">Colored (+₱5/page)</option>
      </select>
    </div>

    <div class="form-group">
      <label for="pageRange">Page Range</label>
      <select id="pageRange" onchange="handlePageRangeChange()" oninput="handlePageRangeChange()">
        <option value="all">Print All Pages</option>
        <option value="custom">Custom Pages</option>
      </select>
    </div>

    <div class="form-group" id="customPagesGroup" style="display: none;">
      <label for="customPages">Custom Pages <small style="color: #aaa;">(e.g., 1-3, 5, 7-10)</small></label>
      <input type="text" id="customPages" placeholder="1-3, 5, 7-10" onchange="calculatePrice()" oninput="calculatePrice()" style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid #FFD700; background-color: #1a1a1a; color: #fff; font-size: 1rem;" />
      <div id="customPagesInfo" style="margin-top: 0.5rem; padding: 0.5rem; background: rgba(79, 70, 229, 0.1); border-radius: 6px; border: 1px solid rgba(79, 70, 229, 0.3); display: none;">
        <i class="fas fa-info-circle" style="color: #4F46E5;"></i>
        <span style="color: #fff; font-size: 0.85rem; margin-left: 0.5rem;">Pages to print: <span id="pagesToPrintCount">0</span></span>
      </div>
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
    <input type="hidden" id="pagesToPrint" value="1" />
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
      <label for="printMethod">
        <i class="fas fa-print"></i> Printing Method
        <span style="color: #FFD700; font-size: 0.85rem; margin-left: 0.5rem;">*Required</span>
      </label>
      <select id="printMethod" onchange="handlePrintMethodChange()">
        <option value="">Select Method</option>
        <option value="dtf">DTF (Direct to Film)</option>
        <option value="sublimation">Sublimation</option>
        <option value="vinyl">Vinyl Heat Transfer</option>
      </select>
    </div>

    <div class="form-group" id="shirtColorGroup" style="display: none;">
      <label for="shirtColorSelect">
        <i class="fas fa-palette"></i> Shirt Color
        <span id="colorLockIndicator" style="display: none; color: #FFD700; font-size: 0.85rem; margin-left: 0.5rem;">
          <i class="fas fa-lock"></i> Locked for Sublimation
        </span>
      </label>
      <select id="shirtColorSelect" onchange="handleColorChange()">
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
        <option value="Design Based">Design Based (Sublimation)</option>
      </select>
    </div>

    <div class="form-group" id="sizesSection" style="display: none;">
      <label>
        <i class="fas fa-tshirt"></i> Shirt Sizes & Quantities
        <span style="color: #FFD700; font-size: 0.85rem; margin-left: 0.5rem;">*Required</span>
      </label>
      <div id="sizeSelectionContainer" class="size-selection-container">
        <p style="color: #aaa; margin-bottom: 1rem; font-size: 0.9rem;">
          <i class="fas fa-info-circle"></i> Select size and quantity for each shirt
        </p>
        <div id="sizesList"></div>
        <button type="button" class="add-size-btn" onclick="addSizeRow()">
          <i class="fas fa-plus"></i> Add Another Size
        </button>
      </div>
      <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(255, 215, 0, 0.1); border-radius: 8px; border: 1px solid rgba(255, 215, 0, 0.3);">
        <span style="color: #FFD700; font-weight: 600;">Total Shirts: </span>
        <span id="totalShirtsDisplay" style="color: #fff; font-size: 1.2rem; font-weight: 700;">0</span>
      </div>
    </div>

    <div class="form-group" id="claimMethodGroup" style="display: none;">
      <label for="claimMethod">
        <i class="fas fa-shipping-fast"></i> Claim Method
      </label>
      <select id="claimMethod" onchange="updateShirtForm()">
        <option value="">Select Method</option>
        <option value="Pickup">Pickup</option>
        <option value="Delivery">Delivery (+₱50)</option>
      </select>
    </div>

    <div class="form-group" style="margin-top: 1.5rem; padding: 1.5rem; background: rgba(255, 215, 0, 0.05); border-radius: 12px; border: 2px dashed rgba(255, 215, 0, 0.3);">
      <label for="designInstructions" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
        <i class="fas fa-comment-dots" style="color: #FFD700; font-size: 1.2rem;"></i>
        <span style="color: #FFD700; font-weight: 600; font-size: 1.1rem;">Design Instructions</span>
        <span style="color: #aaa; font-size: 0.85rem; font-weight: normal; margin-left: 0.25rem;">(Optional)</span>
      </label>
      <textarea id="designInstructions" rows="4" placeholder="📝 Tell us about your design requirements...

Examples:
• Design placement (front, back, sleeve)
• Specific colors or text changes
• Size or position adjustments
• Any special requests" 
        style="width: 100%; resize: vertical; background: rgba(0, 0, 0, 0.3); color: #fff; border: 1px solid rgba(255, 215, 0, 0.4); border-radius: 8px; padding: 1rem; font-family: inherit; font-size: 0.95rem; line-height: 1.6;"></textarea>
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.75rem; padding: 0.75rem; background: rgba(255, 215, 0, 0.1); border-radius: 6px;">
        <i class="fas fa-lightbulb" style="color: #FFD700;"></i>
        <small style="color: #ddd; font-size: 0.85rem;">
          <strong style="color: #FFD700;">Tip:</strong> The more details you provide, the better we can match your vision!
        </small>
      </div>
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
    
    // Try to detect page count for PDF and DOCX files
    if (file.type === 'application/pdf') {
      try {
        const pageCount = await detectPDFPageCount(file);
        window.documentPageCount = pageCount;
        document.getElementById('documentPages').value = pageCount;
        document.getElementById('pageCount').textContent = pageCount;
        document.getElementById('pageCountDisplay').style.display = 'block';
        
        // Show PDF viewer for preview
        showPdfViewer(file);
      } catch (error) {
        console.warn('Could not detect page count:', error);
        // Default to 1 page if detection fails
        window.documentPageCount = 1;
        document.getElementById('documentPages').value = 1;
        document.getElementById('pageCountDisplay').style.display = 'block';
        document.getElementById('pageCount').textContent = '1 (estimated)';
      }
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               file.type === 'application/msword' ||
               file.name.toLowerCase().endsWith('.docx') ||
               file.name.toLowerCase().endsWith('.doc')) {
      // DOCX/DOC file - estimate page count and show viewer
      try {
        const pageCount = await estimateDOCXPageCount(file);
        window.documentPageCount = pageCount;
        document.getElementById('documentPages').value = pageCount;
        document.getElementById('pageCount').textContent = `${pageCount} (estimated)`;
        document.getElementById('pageCountDisplay').style.display = 'block';
        
        // Show DOCX viewer for preview
        const fileIndex = window.uploadedFiles.length - 1;
        await openDocxViewer(fileIndex);
      } catch (error) {
        console.warn('Could not estimate DOCX page count:', error);
        window.documentPageCount = 1;
        document.getElementById('documentPages').value = 1;
        document.getElementById('pageCountDisplay').style.display = 'block';
        document.getElementById('pageCount').textContent = '1 (estimated)';
      }
    } else {
      // For other files, default to 1 page
      window.documentPageCount = 1;
      document.getElementById('documentPages').value = 1;
      document.getElementById('pageCountDisplay').style.display = 'block';
      document.getElementById('pageCount').textContent = '1 (estimated)';
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

// Estimate DOCX page count based on file size and content
async function estimateDOCXPageCount(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async function(e) {
      try {
        const arrayBuffer = e.target.result;
        
        // Try to extract text content from DOCX using JSZip
        try {
          const JSZip = window.JSZip;
          if (JSZip) {
            const zip = await JSZip.loadAsync(arrayBuffer);
            const docXml = await zip.file('word/document.xml').async('string');
            
            // Count page breaks in the document
            const pageBreaks = (docXml.match(/<w:br w:type="page"\/>/g) || []).length;
            
            // Count paragraphs as a rough estimate
            const paragraphs = (docXml.match(/<w:p[ >]/g) || []).length;
            
            // Estimate: 1 page per 40 paragraphs or explicit page breaks + 1
            let estimatedPages = Math.max(
              pageBreaks + 1,
              Math.ceil(paragraphs / 40)
            );
            
            // Ensure at least 1 page
            estimatedPages = Math.max(1, estimatedPages);
            
            // Cap at reasonable maximum
            estimatedPages = Math.min(estimatedPages, 100);
            
            resolve(estimatedPages);
            return;
          }
        } catch (zipError) {
          console.warn('Could not parse DOCX structure:', zipError);
        }
        
        // Fallback: Basic estimation based on file size
        const fileSizeKB = file.size / 1024;
        
        let estimatedPages;
        if (fileSizeKB < 30) {
          estimatedPages = 1;
        } else if (fileSizeKB < 100) {
          estimatedPages = Math.ceil(fileSizeKB / 50);
        } else {
          estimatedPages = Math.ceil(fileSizeKB / 60);
        }
        
        // Cap at reasonable maximum
        estimatedPages = Math.min(estimatedPages, 100);
        
        resolve(estimatedPages);
      } catch (error) {
        console.warn('Error estimating page count:', error);
        resolve(1); // Default to 1 page on error
      }
    };
    
    reader.onerror = function() {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
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
    const isPdf = file.type === 'application/pdf';
    const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                   file.type === 'application/msword' ||
                   file.name.toLowerCase().endsWith('.docx') ||
                   file.name.toLowerCase().endsWith('.doc');
    const isImage = file.type.startsWith('image/');
    
    // Make PDF and DOCX files clickable for preview
    const isPreviewable = isPdf || isDocx;
    const clickHandler = isPreviewable ? `onclick="${isPdf ? 'reopenPdfViewer' : 'openDocxViewer'}(${index})"` : '';
    const clickableClass = isPreviewable ? 'clickable' : '';
    
    // Determine icon
    let icon = 'fa-file';
    if (isPdf) {
      icon = 'fa-file-pdf';
    } else if (isDocx) {
      icon = 'fa-file-word';
    } else if (isImage) {
      icon = 'fa-file-image';
    }
    
    const nameClass = isPdf ? 'pdf-file' : (isDocx ? 'docx-file' : '');
    const previewIcon = isPreviewable ? '<i class="fas fa-eye preview-icon"></i>' : '';
    
    html += `
      <div class="file-item ${clickableClass}" ${clickHandler}>
        <i class="fas ${icon}"></i>
        <div class="file-item-info">
          <div class="file-item-name ${nameClass}">
            ${file.name} ${previewIcon}
          </div>
          <div class="file-item-size">${fileSize} MB</div>
        </div>
        <button type="button" class="file-remove-btn" onclick="event.stopPropagation(); removeUploadedFile(${index})">
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
    selectedFile = window.uploadedFiles.length > 0 ? window.uploadedFiles : null;
    
    // Hide page count display if no files left
    if (window.uploadedFiles.length === 0) {
      const pageCountDisplay = document.getElementById('pageCountDisplay');
      if (pageCountDisplay) {
        pageCountDisplay.style.display = 'none';
      }
      
      // Close PDF viewer if open
      closePdfViewer();
      
      // Reset page count
      window.documentPageCount = 1;
      const documentPagesInput = document.getElementById('documentPages');
      if (documentPagesInput) {
        documentPagesInput.value = 1;
      }
    }
    
    updateSubmitButton();
    
    // Recalculate price if function exists
    if (typeof calculatePrice === 'function') {
      calculatePrice();
    }
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
  const totalShirtsDisplay = document.getElementById('totalShirtsDisplay');
  
  if (!window.shirtSizes || window.shirtSizes.length === 0) {
    sizesList.innerHTML = '<p style="color: #aaa; text-align: center; padding: 1rem;">Click "Add Another Size" to start</p>';
    if (totalShirtsDisplay) totalShirtsDisplay.textContent = '0';
    document.getElementById('quantity').value = 0;
    updateShirtForm();
    return;
  }
  
  let html = '';
  let totalQty = 0;
  
  window.shirtSizes.forEach((item, index) => {
    totalQty += parseInt(item.quantity) || 0;
    const isFirst = index === 0;
    html += `
      <div class="size-item">
        <div style="flex: 1; display: flex; align-items: center; gap: 0.5rem;">
          <i class="fas fa-tshirt" style="color: #FFD700; font-size: 1.2rem;"></i>
          <select onchange="updateSizeValue(${index}, 'size', this.value)" style="flex: 1;">
            <option value="">Select Size</option>
            <option value="XS" ${item.size === 'XS' ? 'selected' : ''}>Extra Small (XS)</option>
            <option value="S" ${item.size === 'S' ? 'selected' : ''}>Small (S)</option>
            <option value="M" ${item.size === 'M' ? 'selected' : ''}>Medium (M)</option>
            <option value="L" ${item.size === 'L' ? 'selected' : ''}>Large (L)</option>
            <option value="XL" ${item.size === 'XL' ? 'selected' : ''}>Extra Large (XL)</option>
            <option value="2XL" ${item.size === '2XL' ? 'selected' : ''}>2XL</option>
            <option value="3XL" ${item.size === '3XL' ? 'selected' : ''}>3XL</option>
          </select>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label style="color: #FFD700; font-size: 0.85rem; white-space: nowrap;">Qty:</label>
          <input type="number" min="1" max="1000" value="${item.quantity}" 
            onchange="updateSizeValue(${index}, 'quantity', this.value)" 
            style="width: 80px;" />
        </div>
        <button type="button" class="remove-size-btn" onclick="removeSizeRow(${index})" 
          ${isFirst && window.shirtSizes.length === 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
  });
  
  sizesList.innerHTML = html;
  if (totalShirtsDisplay) totalShirtsDisplay.textContent = totalQty;
  document.getElementById('quantity').value = totalQty;
  updateShirtForm();
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

// Handle print method change
function handlePrintMethodChange() {
  const printMethod = document.getElementById('printMethod').value;
  const shirtColorGroup = document.getElementById('shirtColorGroup');
  const shirtColorSelect = document.getElementById('shirtColorSelect');
  const colorLockIndicator = document.getElementById('colorLockIndicator');
  const sizesSection = document.getElementById('sizesSection');
  
  if (!printMethod) {
    // Hide everything if no method selected
    shirtColorGroup.style.display = 'none';
    sizesSection.style.display = 'none';
    return;
  }
  
  // Show color selection
  shirtColorGroup.style.display = 'block';
  
  if (printMethod === 'sublimation') {
    // Lock color to "Design Based" for sublimation
    shirtColorSelect.value = 'Design Based';
    shirtColorSelect.disabled = true;
    colorLockIndicator.style.display = 'inline';
    
    // Show sizes section immediately for sublimation
    sizesSection.style.display = 'block';
    if (!window.shirtSizes || window.shirtSizes.length === 0) {
      addSizeRow();
    }
  } else {
    // Unlock color selection for other methods
    shirtColorSelect.disabled = false;
    colorLockIndicator.style.display = 'none';
    if (shirtColorSelect.value === 'Design Based') {
      shirtColorSelect.value = '';
    }
    
    // Show sizes section after color is selected
    if (shirtColorSelect.value) {
      sizesSection.style.display = 'block';
      if (!window.shirtSizes || window.shirtSizes.length === 0) {
        addSizeRow();
      }
    } else {
      sizesSection.style.display = 'none';
    }
  }
  
  updateShirtForm();
}

// Handle color change
function handleColorChange() {
  const printMethod = document.getElementById('printMethod')?.value;
  const shirtColor = document.getElementById('shirtColorSelect')?.value;
  const sizesSection = document.getElementById('sizesSection');
  
  // Show sizes section when color is selected
  if (shirtColor) {
    sizesSection.style.display = 'block';
    if (!window.shirtSizes || window.shirtSizes.length === 0) {
      addSizeRow();
    }
  } else {
    sizesSection.style.display = 'none';
  }
  
  updateShirtForm();
}

// Update shirt form
function updateShirtForm() {
  const printMethod = document.getElementById('printMethod')?.value;
  const shirtColor = document.getElementById('shirtColorSelect')?.value;
  const claimMethodGroup = document.getElementById('claimMethodGroup');
  
  // Show claim method only after at least one size is added
  if (window.shirtSizes && window.shirtSizes.length > 0) {
    const hasValidSize = window.shirtSizes.some(s => s.size && s.quantity > 0);
    if (hasValidSize && claimMethodGroup) {
      claimMethodGroup.style.display = 'block';
    }
  } else {
    if (claimMethodGroup) claimMethodGroup.style.display = 'none';
  }
  
  updateSubmitButton();
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
    const pageRange = document.getElementById('pageRange')?.value || 'all';
    const totalPages = parseInt(document.getElementById('documentPages')?.value) || 1;
    const claimMethod = document.getElementById('claimMethod')?.value;
    
    // Determine pages to print based on range selection
    let pagesToPrint = totalPages;
    if (pageRange === 'custom') {
      const customPages = document.getElementById('customPages')?.value || '';
      pagesToPrint = parseCustomPageRange(customPages, totalPages);
      document.getElementById('pagesToPrint').value = pagesToPrint;
      
      // Update custom pages info display
      const customPagesInfo = document.getElementById('customPagesInfo');
      if (customPagesInfo && customPages) {
        customPagesInfo.style.display = 'block';
        document.getElementById('pagesToPrintCount').textContent = pagesToPrint;
      }
    } else {
      document.getElementById('pagesToPrint').value = totalPages;
    }
    
    // Base price per page
    let pricePerPage = prices.document[paperSize] || 0;
    
    // Add color surcharge if colored printing
    if (printColor === 'color') {
      pricePerPage += prices.document.colorSurcharge;
    }
    
    // Calculate: (price per page × pages to print × copies)
    total = pricePerPage * pagesToPrint * copies;
    
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

  // Check if files are uploaded for services that require them
  const hasFiles = window.uploadedFiles && window.uploadedFiles.length > 0;

  if (currentService === 'shirt') {
    // For shirt orders, check if design files are uploaded and required fields are filled
    submitBtn.disabled = !hasFiles;
    return;
  }

  if (!selectedPayment) {
    submitBtn.disabled = true;
    return;
  }

  if (currentService === 'document' || currentService === 'photo' || currentService === 'customized') {
    // Require files for these services
    submitBtn.disabled = !hasFiles;
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
window.handlePrintMethodChange = handlePrintMethodChange;
window.handleColorChange = handleColorChange;
window.updateShirtForm = updateShirtForm;
window.handlePageRangeChange = handlePageRangeChange;
window.parseCustomPageRange = parseCustomPageRange;

// ========== PAGE RANGE HANDLING ==========
function handlePageRangeChange() {
  const pageRange = document.getElementById('pageRange').value;
  const customPagesGroup = document.getElementById('customPagesGroup');
  const customPagesInfo = document.getElementById('customPagesInfo');
  
  if (pageRange === 'custom') {
    customPagesGroup.style.display = 'block';
  } else {
    customPagesGroup.style.display = 'none';
    if (customPagesInfo) {
      customPagesInfo.style.display = 'none';
    }
  }
  
  calculatePrice();
}

// Parse custom page range (e.g., "1-3, 5, 7-10")
function parseCustomPageRange(rangeString, totalPages) {
  if (!rangeString || !rangeString.trim()) {
    return totalPages; // Default to all pages if empty
  }
  
  const pages = new Set();
  const parts = rangeString.split(',');
  
  for (const part of parts) {
    const trimmed = part.trim();
    
    if (trimmed.includes('-')) {
      // Range like "1-3"
      const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
          pages.add(i);
        }
      }
    } else {
      // Single page like "5"
      const pageNum = parseInt(trimmed);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        pages.add(pageNum);
      }
    }
  }
  
  return pages.size > 0 ? pages.size : 1; // At least 1 page
}

// Dispatch event to signal module is ready
window.dispatchEvent(new Event('servicesModuleReady'));
console.log('Services module functions registered');

// ========== PDF VIEWER FUNCTIONALITY ==========
let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let pdfScale = 1.5;

// Configure PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

async function showPdfViewer(file) {
  if (!file) {
    console.warn('No file provided to PDF viewer');
    return;
  }
  
  const modalOverlay = document.getElementById('modalOverlay');
  const pdfViewerPanel = document.getElementById('pdfViewerPanel');
  
  if (!modalOverlay || !pdfViewerPanel) {
    console.warn('PDF viewer elements not found');
    return;
  }
  
  // Add classes for animation
  modalOverlay.classList.add('has-viewer');
  pdfViewerPanel.classList.add('active');
  
  // Load PDF
  try {
    const fileReader = new FileReader();
    fileReader.onload = async function(e) {
      const typedarray = new Uint8Array(e.target.result);
      
      // Load PDF document
      pdfDoc = await pdfjsLib.getDocument(typedarray).promise;
      totalPages = pdfDoc.numPages;
      currentPage = 1;
      
      // Update UI
      document.getElementById('totalPagesNum').textContent = totalPages;
      document.getElementById('currentPageNum').textContent = currentPage;
      
      // Render first page
      await renderPage(currentPage);
      
      // Update navigation buttons
      updateNavButtons();
    };
    fileReader.readAsArrayBuffer(file);
  } catch (error) {
    console.error('Error loading PDF:', error);
    showErrorModal('PDF Error', 'Could not load PDF file. Please try again.');
  }
}

async function renderPage(pageNum) {
  if (!pdfDoc) return;
  
  const canvas = document.getElementById('pdfCanvas');
  const ctx = canvas.getContext('2d');
  
  // Get page
  const page = await pdfDoc.getPage(pageNum);
  
  // Set scale based on container
  const viewport = page.getViewport({ scale: pdfScale });
  
  // Set canvas dimensions
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  // Render page
  const renderContext = {
    canvasContext: ctx,
    viewport: viewport
  };
  
  await page.render(renderContext).promise;
}

function closePdfViewer() {
  const modalOverlay = document.getElementById('modalOverlay');
  const pdfViewerPanel = document.getElementById('pdfViewerPanel');
  
  modalOverlay.classList.remove('has-viewer');
  pdfViewerPanel.classList.remove('active');
  
  // Reset
  pdfDoc = null;
  currentPage = 1;
  totalPages = 0;
}

async function nextPage() {
  if (currentPage >= totalPages) return;
  
  currentPage++;
  document.getElementById('currentPageNum').textContent = currentPage;
  await renderPage(currentPage);
  updateNavButtons();
}

async function previousPage() {
  if (currentPage <= 1) return;
  
  currentPage--;
  document.getElementById('currentPageNum').textContent = currentPage;
  await renderPage(currentPage);
  updateNavButtons();
}

function updateNavButtons() {
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
}

// Reopen PDF viewer for a specific file
function reopenPdfViewer(index) {
  if (window.uploadedFiles && window.uploadedFiles[index]) {
    const file = window.uploadedFiles[index];
    if (file.type === 'application/pdf') {
      showPdfViewer(file);
    }
  }
}

// ========== DOCX VIEWER ==========
async function openDocxViewer(index) {
  if (!window.uploadedFiles || !window.uploadedFiles[index]) {
    console.warn('No file found at index', index);
    return;
  }
  
  const file = window.uploadedFiles[index];
  const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 file.type === 'application/msword' ||
                 file.name.toLowerCase().endsWith('.docx') ||
                 file.name.toLowerCase().endsWith('.doc');
  
  if (!isDocx) {
    console.warn('File is not a DOCX document');
    return;
  }
  
  const modalOverlay = document.getElementById('modalOverlay');
  let docxViewerPanel = document.getElementById('docxViewerPanel');
  
  // Create DOCX viewer panel if it doesn't exist
  if (!docxViewerPanel) {
    docxViewerPanel = document.createElement('div');
    docxViewerPanel.id = 'docxViewerPanel';
    docxViewerPanel.className = 'pdf-viewer-panel';
    docxViewerPanel.innerHTML = `
      <div class="pdf-viewer-header">
        <h3><i class="fas fa-file-word"></i> Document Preview</h3>
        <button class="close-viewer-btn" onclick="closeDocxViewer()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="pdf-viewer-content" style="padding: 0;">
        <div class="pdf-page-info" id="docxFileName">
          Loading document...
        </div>
        <div id="docxContentContainer" style="flex: 1; overflow-y: auto; background: #fff; padding: 3rem 2rem;">
          <div id="docxContent" style="max-width: 850px; margin: 0 auto; color: #000; font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.6;"></div>
        </div>
      </div>
    `;
    document.body.appendChild(docxViewerPanel);
  }
  
  // Show the viewer
  modalOverlay.classList.add('has-viewer');
  docxViewerPanel.classList.add('active');
  
  // Update filename
  document.getElementById('docxFileName').innerHTML = `
    <i class="fas fa-file-word" style="color: #2B579A;"></i>
    <span style="color: #fff; font-weight: 600; margin-left: 0.5rem;">${file.name}</span>
  `;
  
  // Load and display DOCX content
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    if (typeof mammoth !== 'undefined') {
      const result = await mammoth.convertToHtml({ 
        arrayBuffer: arrayBuffer,
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Title'] => h1.title:fresh"
        ]
      });
      
      const docxContent = document.getElementById('docxContent');
      docxContent.innerHTML = result.value;
      
      // Apply proper Word-like styling
      const style = document.createElement('style');
      style.textContent = `
        #docxContent p {
          margin: 0 0 10pt 0;
          text-align: justify;
          line-height: 1.5;
        }
        #docxContent h1 {
          font-size: 18pt;
          font-weight: bold;
          margin: 16pt 0 8pt 0;
          color: #000;
          line-height: 1.3;
        }
        #docxContent h2 {
          font-size: 15pt;
          font-weight: bold;
          margin: 14pt 0 6pt 0;
          color: #000;
          line-height: 1.3;
        }
        #docxContent h3 {
          font-size: 13pt;
          font-weight: bold;
          margin: 12pt 0 6pt 0;
          color: #000;
          line-height: 1.3;
        }
        #docxContent ul, #docxContent ol {
          margin: 0 0 10pt 30pt;
          padding: 0;
        }
        #docxContent li {
          margin: 0 0 6pt 0;
          line-height: 1.5;
        }
        #docxContent table {
          border-collapse: collapse;
          margin: 10pt 0;
          width: 100%;
        }
        #docxContent td, #docxContent th {
          border: 1px solid #000;
          padding: 6pt 10pt;
          vertical-align: top;
        }
        #docxContent strong, #docxContent b {
          font-weight: bold;
        }
        #docxContent em, #docxContent i {
          font-style: italic;
        }
        #docxContent img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 10pt 0;
        }
        #docxContent a {
          color: #0563C1;
          text-decoration: underline;
        }
      `;
      
      if (!document.getElementById('docxViewerStyles')) {
        style.id = 'docxViewerStyles';
        document.head.appendChild(style);
      }
      
      // Filter out common non-critical warnings
      if (result.messages.length > 0) {
        const criticalMessages = result.messages.filter(msg => 
          !msg.message.includes('unrecognised element') && 
          !msg.message.includes('Unrecognised paragraph style')
        );
        
        if (criticalMessages.length > 0) {
          console.warn('DOCX conversion issues:', criticalMessages);
        }
      }
    } else {
      // Fallback if mammoth is not loaded
      document.getElementById('docxContent').innerHTML = `
        <div style="text-align: center; padding: 3rem; color: #666;">
          <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
          <p>Document viewer library not loaded.</p>
          <p style="font-size: 0.9rem; margin-top: 0.5rem;">The document will be uploaded for printing.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading DOCX:', error);
    document.getElementById('docxContent').innerHTML = `
      <div style="text-align: center; padding: 3rem; color: #666;">
        <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem; display: block; color: #ef4444;"></i>
        <p>Error loading document preview.</p>
        <p style="font-size: 0.9rem; margin-top: 0.5rem;">${error.message}</p>
      </div>
    `;
  }
}

function closeDocxViewer() {
  const modalOverlay = document.getElementById('modalOverlay');
  const docxViewerPanel = document.getElementById('docxViewerPanel');
  
  if (modalOverlay) {
    modalOverlay.classList.remove('has-viewer');
  }
  
  if (docxViewerPanel) {
    docxViewerPanel.classList.remove('active');
  }
}

// Export functions
window.showPdfViewer = showPdfViewer;
window.closePdfViewer = closePdfViewer;
window.nextPage = nextPage;
window.previousPage = previousPage;
window.reopenPdfViewer = reopenPdfViewer;
window.openDocxViewer = openDocxViewer;
window.closeDocxViewer = closeDocxViewer;
