import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiProvider } from './context/ApiContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CarritoProvider } from './context/CarritoContext.jsx';
import App from './App.jsx';
import './index.css';

const clienteQuery = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      // No reintentar errores del cliente (404, 403...); sí los de red o del servidor
      retry: (intentos, error) => intentos < 2 && !(error?.status >= 400 && error?.status < 500),
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <QueryClientProvider client={clienteQuery}>
        <ApiProvider>
          <AuthProvider>
            <CarritoProvider>
              <App />
            </CarritoProvider>
          </AuthProvider>
        </ApiProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
