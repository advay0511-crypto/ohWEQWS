import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { BackgroundProvider } from './components/Common/CinematicBackground';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <BackgroundProvider>
    <App />
  </BackgroundProvider>
);
