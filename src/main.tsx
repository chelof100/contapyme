import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ConfigProvider } from './contexts/ConfigContext'
import './index.css'

// Register Service Worker - TEMPORARILY DISABLED
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     const swPath = import.meta.env.BASE_URL + 'sw.js';
//     navigator.serviceWorker.register(swPath)
//       .then((registration) => {
//         console.log('SW registered: ', registration);
//       })
//       .catch((registrationError) => {
//         console.log('SW registration failed: ', registrationError);
//       });
//   });
// }

createRoot(document.getElementById("root")!).render(
  <ConfigProvider>
    <App />
  </ConfigProvider>
);
