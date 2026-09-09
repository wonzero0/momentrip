
import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import { AppErrorBoundary } from './app/components/AppErrorBoundary.tsx';
import './styles/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('앱을 표시할 root 요소를 찾을 수 없습니다.');

createRoot(root).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);

