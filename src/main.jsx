import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // This imports Tailwind CSS

// Initialize the React application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// PWA Service Worker Registration
// This allows the app to load faster on subsequent visits by caching resources
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('FinanceOS ServiceWorker registered successfully');
      },
      (err) => {
        console.log('FinanceOS ServiceWorker registration failed: ', err);
      }
    );
  });
}
