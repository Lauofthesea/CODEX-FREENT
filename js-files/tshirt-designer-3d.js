import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Global variables
let scene, camera, renderer, controls;
let tshirtMesh, designMaterial;
let frontCanvas, backCanvas, activeCanvas;
let selectedObject = null;
let currentView = 'front';
let shirtColor = '#ffffff';

// Initialize 3D Viewer
function init3DViewer() {
  const container = document.getElementById('viewer-3d');
  if (!container) return;

  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x667eea);

  // Camera setup - positioned to view t-shirt upright
  camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 3);
  camera.lookAt(0, 0, 0);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
  fillLight.position.set(-5, 0, -5);
  scene.add(fillLight);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 0.5; // Allow closer zoom
  controls.maxDistance = 8;
  controls.maxPolarAngle = Math.PI / 1.5;

  // Load 3D Model
  loadTShirtModel();

  // Animation loop
  animate();

  // Handle window resize
  window.addEventListener('resize', onWindowResize);
}

// Load T-Shirt 3D Model
function loadTShirtModel() {
  const loader = new GLTFLoader();
  
  // Try to load the model from assets folder
  loader.load(
    '../assets/3Dmodels/front.glb',
    (gltf) => {
      tshirtMesh = gltf.scene;
      
      // Rotate and position the model to stand upright
      tshirtMesh.rotation.x = 0;
      tshirtMesh.rotation.y = 0;
      tshirtMesh.rotation.z = 0;
      tshirtMesh.position.set(0, -0.5, 0);
      tshirtMesh.scale.set(1, 1, 1);
      
      // Store all materials for color changing
      const materials = [];
      tshirtMesh.traverse((child) => {
        if (child.isMesh) {
          const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(shirtColor),
            roughness: 0.8,
            metalness: 0.1
          });
          child.material = material;
          child.castShadow = true;
          child.receiveShadow = true;
          materials.push(material);
        }
      });
      
      // Store reference to all materials
      tshirtMesh.userData.materials = materials;
      designMaterial = materials[0]; // Keep reference to first material
      
      scene.add(tshirtMesh);
      showToast('3D Model Loaded Successfully!');
    },
    (progress) => {
      console.log('Loading:', (progress.loaded / progress.total * 100) + '%');
    },
    (error) => {
      console.error('Error loading model:', error);
      // Create a fallback simple t-shirt geometry
      createFallbackTShirt();
    }
  );
}

// Create fallback t-shirt if model fails to load
function createFallbackTShirt() {
  const geometry = new THREE.BoxGeometry(1, 1.3, 0.1);
  designMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(shirtColor),
    roughness: 0.8,
    metalness: 0.1
  });
  tshirtMesh = new THREE.Mesh(geometry, designMaterial);
  tshirtMesh.position.set(0, 0, 0);
  tshirtMesh.userData.materials = [designMaterial]; // Store material reference
  scene.add(tshirtMesh);
  showToast('Using simplified t-shirt model');
}

// Initialize 2D Canvases for design
function initCanvases() {
  // Front canvas
  frontCanvas = new fabric.Canvas('canvas-2d', {
    width: 512,
    height: 512,
    backgroundColor: 'transparent'
  });

  // Back canvas (we'll create it dynamically when needed)
  backCanvas = new fabric.Canvas(document.createElement('canvas'), {
    width: 512,
    height: 512,
    backgroundColor: 'transparent'
  });

  activeCanvas = frontCanvas;

  // Listen for canvas changes
  frontCanvas.on('object:modified', updateTexture);
  frontCanvas.on('object:added', updateTexture);
  frontCanvas.on('object:removed', updateTexture);
  
  frontCanvas.on('selection:created', handleSelection);
  frontCanvas.on('selection:updated', handleSelection);
  frontCanvas.on('selection:cleared', clearSelection);
}

// Handle object selection
function handleSelection(e) {
  selectedObject = e.selected[0];
  
  if (selectedObject && selectedObject.type === 'i-text') {
    showTextProperties(selectedObject);
  } else {
    hideTextProperties();
  }
}

// Clear selection
function clearSelection() {
  selectedObject = null;
  hideTextProperties();
}

// Show text properties panel
function showTextProperties(textObj) {
  const panel = document.getElementById('textProperties');
  if (panel) {
    panel.classList.add('active');
    document.getElementById('textContent').value = textObj.text;
    document.getElementById('fontSize').value = textObj.fontSize;
    document.getElementById('textColor').value = textObj.fill;
  }
}

// Hide text properties panel
function hideTextProperties() {
  const panel = document.getElementById('textProperties');
  if (panel) {
    panel.classList.remove('active');
  }
}

// Update texture on 3D model
function updateTexture() {
  if (!tshirtMesh || !activeCanvas) return;
  
  const texture = new THREE.CanvasTexture(activeCanvas.getElement());
  texture.needsUpdate = true;
  
  if (designMaterial) {
    designMaterial.map = texture;
    designMaterial.needsUpdate = true;
  }
}

// Change shirt color
function changeShirtColor(color) {
  shirtColor = color;
  document.getElementById('shirtColor').value = color;
  
  // Update all materials in the t-shirt mesh
  if (tshirtMesh && tshirtMesh.userData.materials) {
    tshirtMesh.userData.materials.forEach(material => {
      material.color.set(color);
    });
  } else if (tshirtMesh) {
    // Fallback: traverse and update all mesh materials
    tshirtMesh.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.color.set(color);
      }
    });
  }
  
  showToast(`Color changed to ${color}`);
}

// Switch between front and back view
function switchView(view) {
  currentView = view;
  
  // Update button states
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Rotate camera/model
  if (tshirtMesh) {
    if (view === 'back') {
      tshirtMesh.rotation.y = Math.PI;
      activeCanvas = backCanvas;
    } else {
      tshirtMesh.rotation.y = 0;
      activeCanvas = frontCanvas;
    }
  }
  
  showToast(`Switched to ${view} view`);
}

// Add text to canvas
function addText() {
  if (!activeCanvas) return;
  
  const text = new fabric.IText('Your Text', {
    left: 256,
    top: 256,
    fontSize: 40,
    fill: '#000000',
    fontFamily: 'Arial',
    originX: 'center',
    originY: 'center'
  });
  
  activeCanvas.add(text);
  activeCanvas.setActiveObject(text);
  activeCanvas.renderAll();
  updateTexture();
  
  showToast('Text added!');
}

// Handle image upload
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file || !activeCanvas) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    fabric.Image.fromURL(e.target.result, function(img) {
      img.scale(0.3);
      img.set({
        left: 256,
        top: 256,
        originX: 'center',
        originY: 'center'
      });
      activeCanvas.add(img);
      activeCanvas.setActiveObject(img);
      activeCanvas.renderAll();
      updateTexture();
      showToast('Image added!');
    });
  };
  reader.readAsDataURL(file);
}

// Add shapes
function addShape(type) {
  if (!activeCanvas) return;
  
  let shape;
  
  if (type === 'circle') {
    shape = new fabric.Circle({
      radius: 50,
      fill: '#ff0000',
      left: 256,
      top: 256,
      originX: 'center',
      originY: 'center'
    });
  } else if (type === 'rectangle') {
    shape = new fabric.Rect({
      width: 100,
      height: 100,
      fill: '#00ff00',
      left: 256,
      top: 256,
      originX: 'center',
      originY: 'center'
    });
  } else if (type === 'line') {
    shape = new fabric.Line([50, 50, 200, 200], {
      stroke: '#0000ff',
      strokeWidth: 5,
      left: 256,
      top: 256,
      originX: 'center',
      originY: 'center'
    });
  }
  
  if (shape) {
    activeCanvas.add(shape);
    activeCanvas.setActiveObject(shape);
    activeCanvas.renderAll();
    updateTexture();
    showToast(`${type} added!`);
  }
}

// Delete selected object
function deleteSelected() {
  if (!activeCanvas) return;
  
  const activeObjects = activeCanvas.getActiveObjects();
  if (activeObjects.length) {
    activeObjects.forEach(obj => activeCanvas.remove(obj));
    activeCanvas.discardActiveObject();
    activeCanvas.renderAll();
    updateTexture();
    showToast('Object deleted!');
  }
}

// Clear canvas
function clearCanvas() {
  if (!activeCanvas) return;
  
  if (confirm('Are you sure you want to clear all designs?')) {
    activeCanvas.clear();
    activeCanvas.backgroundColor = 'transparent';
    activeCanvas.renderAll();
    updateTexture();
    showToast('Canvas cleared!');
  }
}

// Update text content
function updateTextContent(value) {
  if (selectedObject && selectedObject.type === 'i-text') {
    selectedObject.set('text', value);
    activeCanvas.renderAll();
    updateTexture();
  }
}

// Update font size
function updateFontSize(value) {
  if (selectedObject && selectedObject.type === 'i-text') {
    selectedObject.set('fontSize', parseInt(value));
    activeCanvas.renderAll();
    updateTexture();
  }
}

// Update font family
function updateFontFamily(value) {
  if (selectedObject && selectedObject.type === 'i-text') {
    const fontMap = {
      'arial': 'Arial',
      'calibri': 'Calibri',
      'times-new-roman': 'Times New Roman',
      'georgia': 'Georgia',
      'helvetica': 'Helvetica',
      'courier-new': 'Courier New',
      'verdana': 'Verdana',
      'tahoma': 'Tahoma',
      'trebuchet-ms': 'Trebuchet MS',
      'impact': 'Impact'
    };
    selectedObject.set('fontFamily', fontMap[value] || 'Arial');
    activeCanvas.renderAll();
    updateTexture();
  }
}

// Update text color
function updateTextColor(value) {
  if (selectedObject && selectedObject.type === 'i-text') {
    selectedObject.set('fill', value);
    activeCanvas.renderAll();
    updateTexture();
  }
}

// Export design
function exportDesign() {
  if (!activeCanvas) return;
  
  // Export front view
  const frontDataURL = frontCanvas.toDataURL({
    format: 'png',
    quality: 1
  });
  
  // Download front
  const link = document.createElement('a');
  link.download = 'tshirt-design-front.png';
  link.href = frontDataURL;
  link.click();
  
  // If back canvas has content, export it too
  if (backCanvas.getObjects().length > 0) {
    const backDataURL = backCanvas.toDataURL({
      format: 'png',
      quality: 1
    });
    
    setTimeout(() => {
      const backLink = document.createElement('a');
      backLink.download = 'tshirt-design-back.png';
      backLink.href = backDataURL;
      backLink.click();
    }, 500);
  }
  
  showToast('Design exported!');
}

// Close designer
function closeDesigner() {
  if (confirm('Are you sure you want to close? Unsaved changes will be lost.')) {
    window.location.href = '../pages/services.html';
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  if (controls) {
    controls.update();
  }
  
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Handle window resize
function onWindowResize() {
  const container = document.getElementById('viewer-3d');
  if (!container) return;
  
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

// Show toast notification
function showToast(message) {
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  init3DViewer();
  initCanvases();
});

// Make functions globally accessible
window.changeShirtColor = changeShirtColor;
window.switchView = switchView;
window.addText = addText;
window.handleImageUpload = handleImageUpload;
window.addShape = addShape;
window.deleteSelected = deleteSelected;
window.clearCanvas = clearCanvas;
window.updateTextContent = updateTextContent;
window.updateFontSize = updateFontSize;
window.updateFontFamily = updateFontFamily;
window.updateTextColor = updateTextColor;
window.exportDesign = exportDesign;
window.closeDesigner = closeDesigner;
