import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ToastProvider } from './features/notification/index.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './assets/styles/global.css';
import './assets/styles/bauhaus.css';
import './i18n/index.js'; // Must be imported before App — initializes i18next

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);
