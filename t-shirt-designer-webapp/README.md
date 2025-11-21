# T-Shirt Design Studio - Interactive 3D Design Platform 

A modern, interactive web application for custom t-shirt design with real-time 3D preview capabilities.

## 🌐 Live Demo

Take a look the live demo here 👉 https://t-shirt-designer-webapp.vercel.app/

![image](https://github.com/user-attachments/assets/1e2e4bd3-f480-49b7-a922-15ccd71067ea)

## 🌟 Features

### Design Capabilities
- Interactive 2D canvas for precise designing
- Real-time 3D preview with rotation capabilities
- Dual-side design support (front and back)
- Persistent design storage

### Design Tools
- Text customization with multiple fonts
- Image upload and manipulation
- Line/shape drawing tools
- Color customization

### User Interface
- Intuitive sidebar tools
- Responsive design for all devices
- Real-time synchronization between 2D and 3D views
- Automatic design saving

## 🛠️ Technology Stack

- **Frontend Framework:** React.js
- **State Management:** 
  - Redux Toolkit (UI states)
  - React Context (Canvas state)
- **3D Rendering:** Three.js with React Three Fiber
- **2D Canvas:** Fabric.js
- **Styling:** Tailwind CSS
- **Storage:** Browser LocalStorage
- **UI Components:** Radix UI, Shadcn/ui

## 🏗 ️Project Architecture & Workflow

### State Management
The application uses a hybrid state management approach:
- **Redux** for UI states (color selection, view management)
- **Context API** for canvas state management
- **LocalStorage** for design persistence

### Key Components
📌 `CanvasProvider`: Manages the fabric.js canvas state

📌 `TshirtModel`: Handles 3D model rendering

📌 `DesignArea`: Manages 2D design interface

📌 `ToolsSidebar`: Contains all design tools

### Storage System
```javascript
// Example of the storage structure
{
  "tshirt-designer-front": "[{object}, {object}]",
  "tshirt-designer-back": "[{object}, {object}]"
}
```

## 🧩 Challenges and How I Overcame Them

### 1. Complex Canvas State Management

#### Challenge
Initially, storing the Fabric.js canvas state in Redux proved problematic due to:
- Circular references in canvas objects
- Non-serializable data structures
- Performance implications with complex designs

#### Solution
✅ Implemented a hybrid state management approach (Redux + Context API)
```javascript
// Separate state management for different concerns
- Redux: UI states (colors, views, selections)
- Context API: Complex canvas operations
- LocalStorage: Design persistence
```

**Benefits:**
- Clean separation of concerns
- Improved performance
- Better state predictability
- Maintainable codebase

### 2. Design Persistence Across Views

#### Challenge
Designs were disappearing during:
- Front/back view switches
- Component remounts
- Page refreshes

#### Solution
✅ Developed a custom storage management system:

```javascript
// canvasStorageManager.js

 // Save canvas objects
  saveCanvasObjects: (view, canvas) => {
    if (!canvas) return;
    try {
      const storageKey =
        view === "front" ? STORAGE_KEYS.FRONT_CANVAS : STORAGE_KEYS.BACK_CANVAS;

      // Clear existing design for this view before saving
      localStorage.removeItem(storageKey);
      // Get and save new objects
      const objects = canvas.getObjects().map((obj) => obj.toJSON());

      localStorage.setItem(
        view === "front" ? STORAGE_KEYS.FRONT_CANVAS : STORAGE_KEYS.BACK_CANVAS,
        JSON.stringify(objects)
      );
    } catch (error) {
      console.error("Error saving canvas objects:", error);
    }
  },
```

**Key Features:**
- Automatic state persistence
- Separate storage for front/back designs
- Efficient serialization/deserialization
- Automatic recovery on page load

## 🎯 Future Improvements

### Planned Features
- Sleeve design customization
- Additional t-shirt styles:
  - V-neck
  - Long sleeve
  - Henley
  - Polo shirts
- Enhanced export options
