import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useEffect } from 'react';
import { AppProvider } from './context/AppContext';

export default function App() {
  useEffect(() => {
    // Ensure dark mode is applied
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <AppProvider>
      <div className="dark">
        <RouterProvider router={router} />
      </div>
    </AppProvider>
  );
}