
let selectedFile = null;
let selectedPayment = null;

const prices = {
  a4: 2,
  a3: 15,
  a5: 3,
  letter: 5,
  legal: 7
};

function scrollToServices() {
  const servicesSection = document.getElementById('services-cards');
  if (servicesSection) {
    servicesSection.scrollIntoView({ behavior: 'smooth' });
  }
}

function openModal(service) {
  if (service === 'document') {
    document.getElementById('modalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = 'auto';
  resetForm();
}

function closeModalOnOverlay(event) {
  if (event.target.id === 'modalOverlay') {
    closeModal();
  }
}

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

function selectPayment(method) {
  selectedPayment = method;
  document.getElementById('paymentMethod').value = method;
  
  document.querySelectorAll('.payment-option').forEach(option => {
    option.classList.remove('selected');
  });
  event.currentTarget.classList.add('selected');
  
  updateSubmitButton();
}

function calculatePrice() {
  if (!selectedFile) {
    document.getElementById('totalPrice').textContent = '₱0.00';
    return;
  }
  
  const paperSize = document.getElementById('paperSize').value;
  const copies = parseInt(document.getElementById('copies').value) || 1;
  const pricePerPage = prices[paperSize];
  const total = pricePerPage * copies;
  
  document.getElementById('totalPrice').textContent = `₱${total.toFixed(2)}`;
}

function updateSubmitButton() {
  const submitBtn = document.getElementById('submitBtn');
  if (selectedFile && selectedPayment) {
    submitBtn.disabled = false;
  } else {
    submitBtn.disabled = true;
  }
}

function handleSubmit(event) {
  event.preventDefault();
  
  const paperSize = document.getElementById('paperSize').value;
  const copies = document.getElementById('copies').value;
  const totalPrice = document.getElementById('totalPrice').textContent;
  
  alert(`Order Placed Successfully!\n\nFile: ${selectedFile.name}\nPaper Size: ${paperSize.toUpperCase()}\nCopies: ${copies}\nPayment: ${selectedPayment.toUpperCase()}\nTotal: ${totalPrice}\n\nThank you for your order!`);
  
  closeModal();
}

function resetForm() {
  document.getElementById('orderForm').reset();
  document.getElementById('fileInput').value = '';
  document.getElementById('fileInfo').style.display = 'none';
  document.getElementById('totalPrice').textContent = '₱0.00';
  selectedFile = null;
  selectedPayment = null;
  
  document.querySelectorAll('.payment-option').forEach(option => {
    option.classList.remove('selected');
  });
  
  updateSubmitButton();
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

document.addEventListener('DOMContentLoaded', () => {
  console.log('services active (loaded)');
});

document.addEventListener("DOMContentLoaded", () => {
    const isLoggedIn = localStorage.getItem("freentLoggedIn");
    if (!isLoggedIn) {
      console.log("User not logged in");
    }
  });

  // Attach this to your print button
  function handlePrintClick() {
    const isLoggedIn = localStorage.getItem("freentLoggedIn");
    if (!isLoggedIn) {
      alert("Please log in first to access Print Document.");
      window.location.href = "login.html";
    } else {
      alert("Redirecting to print function...");
      // Replace this with your print page later
      window.location.href = "print.html";
    }
  }