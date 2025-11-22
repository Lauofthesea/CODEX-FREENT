// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAao4TBFvMR099d5sEfvX1I65d0LCAJUZw",
  authDomain: "lineshub-98e0f.firebaseapp.com",
  projectId: "lineshub-98e0f",
  storageBucket: "lineshub-98e0f.appspot.com",
  messagingSenderId: "427905073524",
  appId: "1:427905073524:web:95cb66ffeabf011087ec21"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
