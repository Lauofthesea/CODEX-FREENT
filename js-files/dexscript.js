function scrollToSamples() {
  document.getElementById('samples-section').scrollIntoView({ behavior: 'smooth' });
}

function handleSearch(event) {
  event.preventDefault();
  const query = document.getElementById('search-input').value.trim();
  if (query) {
    alert('Searching for: ' + query);
    // Replace with actual search logic or redirect
  }
}
