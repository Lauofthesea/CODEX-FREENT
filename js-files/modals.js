// Custom Modal System

// Create modal HTML structure
function createModalHTML() {
  const modalHTML = `
    <div id="customModalOverlay" class="custom-modal-overlay">
      <div class="custom-modal">
        <div class="custom-modal-header">
          <div id="customModalIcon" class="custom-modal-icon">
            <i id="customModalIconSymbol"></i>
          </div>
          <h2 id="customModalTitle" class="custom-modal-title"></h2>
        </div>
        <div id="customModalBody" class="custom-modal-body"></div>
        <div id="customModalFooter" class="custom-modal-footer"></div>
      </div>
    </div>
  `;
  
  // Insert modal into body if it doesn't exist
  if (!document.getElementById('customModalOverlay')) {
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }
}

// Show success modal
function showSuccessModal(title, message, callback) {
  createModalHTML();
  
  const overlay = document.getElementById('customModalOverlay');
  const icon = document.getElementById('customModalIcon');
  const iconSymbol = document.getElementById('customModalIconSymbol');
  const titleEl = document.getElementById('customModalTitle');
  const body = document.getElementById('customModalBody');
  const footer = document.getElementById('customModalFooter');
  
  icon.className = 'custom-modal-icon success';
  iconSymbol.className = 'fas fa-check-circle';
  titleEl.textContent = title;
  body.innerHTML = message;
  
  footer.innerHTML = `
    <button class="custom-modal-btn success" onclick="closeCustomModal(${callback ? 'successCallback' : 'null'})">
      <i class="fas fa-check"></i> OK
    </button>
  `;
  
  if (callback) {
    window.successCallback = callback;
  }
  
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Show error modal
function showErrorModal(title, message) {
  createModalHTML();
  
  const overlay = document.getElementById('customModalOverlay');
  const icon = document.getElementById('customModalIcon');
  const iconSymbol = document.getElementById('customModalIconSymbol');
  const titleEl = document.getElementById('customModalTitle');
  const body = document.getElementById('customModalBody');
  const footer = document.getElementById('customModalFooter');
  
  icon.className = 'custom-modal-icon error';
  iconSymbol.className = 'fas fa-times-circle';
  titleEl.textContent = title;
  body.innerHTML = message;
  
  footer.innerHTML = `
    <button class="custom-modal-btn danger" onclick="closeCustomModal()">
      <i class="fas fa-times"></i> Close
    </button>
  `;
  
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Show confirm modal
function showConfirmModal(title, message, onConfirm, onCancel) {
  createModalHTML();
  
  const overlay = document.getElementById('customModalOverlay');
  const icon = document.getElementById('customModalIcon');
  const iconSymbol = document.getElementById('customModalIconSymbol');
  const titleEl = document.getElementById('customModalTitle');
  const body = document.getElementById('customModalBody');
  const footer = document.getElementById('customModalFooter');
  
  icon.className = 'custom-modal-icon warning';
  iconSymbol.className = 'fas fa-exclamation-triangle';
  titleEl.textContent = title;
  body.innerHTML = message;
  
  footer.innerHTML = `
    <button class="custom-modal-btn secondary" onclick="closeCustomModal(${onCancel ? 'cancelCallback' : 'null'})">
      <i class="fas fa-times"></i> Cancel
    </button>
    <button class="custom-modal-btn primary" onclick="closeCustomModal(confirmCallback)">
      <i class="fas fa-check"></i> Confirm
    </button>
  `;
  
  window.confirmCallback = onConfirm;
  if (onCancel) {
    window.cancelCallback = onCancel;
  }
  
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Show info modal
function showInfoModal(title, message) {
  createModalHTML();
  
  const overlay = document.getElementById('customModalOverlay');
  const icon = document.getElementById('customModalIcon');
  const iconSymbol = document.getElementById('customModalIconSymbol');
  const titleEl = document.getElementById('customModalTitle');
  const body = document.getElementById('customModalBody');
  const footer = document.getElementById('customModalFooter');
  
  icon.className = 'custom-modal-icon info';
  iconSymbol.className = 'fas fa-info-circle';
  titleEl.textContent = title;
  body.innerHTML = message;
  
  footer.innerHTML = `
    <button class="custom-modal-btn primary" onclick="closeCustomModal()">
      <i class="fas fa-check"></i> Got it
    </button>
  `;
  
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Close modal
function closeCustomModal(callback) {
  const overlay = document.getElementById('customModalOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    if (callback && typeof callback === 'function') {
      callback();
    }
  }
}

// Close on overlay click
document.addEventListener('click', function(event) {
  const overlay = document.getElementById('customModalOverlay');
  if (overlay && event.target === overlay) {
    closeCustomModal();
  }
});

// Close on Escape key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const overlay = document.getElementById('customModalOverlay');
    if (overlay && overlay.classList.contains('active')) {
      closeCustomModal();
    }
  }
});

// Make functions globally accessible
window.showSuccessModal = showSuccessModal;
window.showErrorModal = showErrorModal;
window.showConfirmModal = showConfirmModal;
window.showInfoModal = showInfoModal;
window.closeCustomModal = closeCustomModal;
