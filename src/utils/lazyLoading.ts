import { lazy } from 'react';

// Lazy load components that are not immediately needed
export const Dashboard = lazy(() => import('@/components/Dashboard').then(module => ({ default: module.Dashboard })));
export const InvoiceForm = lazy(() => import('@/components/InvoiceForm').then(module => ({ default: module.InvoiceForm })));
export const StockManagement = lazy(() => import('@/components/StockManagement').then(module => ({ default: module.StockManagement })));
export const PaymentTracker = lazy(() => import('@/components/PaymentTracker').then(module => ({ default: module.PaymentTracker })));
export const Reports = lazy(() => import('@/components/Reports').then(module => ({ default: module.Reports })));
export const Settings = lazy(() => import('@/components/Settings').then(module => ({ default: module.Settings })));

// Lazy load pages
export const HomePage = lazy(() => import('@/pages/HomePage'));
export const InvoicePage = lazy(() => import('@/pages/InvoicePage'));
export const StockPage = lazy(() => import('@/pages/StockPage'));
export const PaymentsPage = lazy(() => import('@/pages/PaymentsPage'));
export const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
export const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

// Preload function for critical components
export const preloadComponent = (componentName: string) => {
  const componentMap: Record<string, () => Promise<any>> = {
    Dashboard: () => import('@/components/Dashboard'),
    InvoiceForm: () => import('@/components/InvoiceForm'),
    StockManagement: () => import('@/components/StockManagement'),
    PaymentTracker: () => import('@/components/PaymentTracker'),
    Reports: () => import('@/components/Reports'),
    Settings: () => import('@/components/Settings'),
  };

  return componentMap[componentName]?.();
}; 