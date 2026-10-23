import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles.css';
import './rendu/rendu.css';

createRoot(document.getElementById('racine')!).render(<StrictMode><App /></StrictMode>);
