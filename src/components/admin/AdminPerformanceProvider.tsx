"use client";

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';

interface AdminPerformanceContextType {
  isSystemLoaded: boolean;
  performanceStatus: 'good' | 'slow' | 'timeout';
  retryOperation: (operation: () => Promise<any>) => Promise<any>;
  showPerformanceWarning: boolean;
}

const AdminPerformanceContext = createContext<AdminPerformanceContextType | undefined>(undefined);

export function AdminPerformanceProvider({ children }: { children: React.ReactNode }) {
  const [isSystemLoaded, setIsSystemLoaded] = useState(false);
  const [performanceStatus, setPerformanceStatus] = useState<'good' | 'slow' | 'timeout'>('good');
  const [showPerformanceWarning, setShowPerformanceWarning] = useState(false);

  // Global retry mechanism with performance tracking
  const retryOperation = useCallback(async (operation: () => Promise<any>) => {
    const startTime = Date.now();
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        const result = await Promise.race([
          operation(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Operation timeout')), 10000)
          )
        ]);

        const duration = Date.now() - startTime;
        
        // Update performance status based on response time
        if (duration < 2000) {
          setPerformanceStatus('good');
          setShowPerformanceWarning(false);
        } else if (duration < 5000) {
          setPerformanceStatus('slow');
          setShowPerformanceWarning(true);
        }

        setIsSystemLoaded(true);
        return result;

      } catch (error) {
        retryCount++;
        const duration = Date.now() - startTime;

        if (duration > 8000 || (error as Error).message.includes('timeout')) {
          setPerformanceStatus('timeout');
          setShowPerformanceWarning(true);
        }

        if (retryCount > maxRetries) {
          console.error(`Operation failed after ${retryCount} attempts:`, error);
          throw new Error(`System timeout - operation failed after ${retryCount} attempts`);
        }

        // Exponential backoff
        const delay = Math.pow(2, retryCount - 1) * 1000;
        console.log(`Retrying operation in ${delay}ms... (attempt ${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, []);

  // Monitor system performance on mount
  useEffect(() => {
    const checkSystemPerformance = async () => {
      try {
        const startTime = Date.now();
        await fetch('/api/dashboard/stats', { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        const duration = Date.now() - startTime;
        
        if (duration > 3000) {
          setPerformanceStatus('slow');
          setShowPerformanceWarning(true);
        }
      } catch (error) {
        console.warn('System performance check failed:', error);
        setPerformanceStatus('slow');
        setShowPerformanceWarning(true);
      }
    };

    checkSystemPerformance();
  }, []);

  const value = {
    isSystemLoaded,
    performanceStatus,
    retryOperation,
    showPerformanceWarning,
  };

  return (
    <AdminPerformanceContext.Provider value={value}>
      {children}
    </AdminPerformanceContext.Provider>
  );
}

export function useAdminPerformance() {
  const context = useContext(AdminPerformanceContext);
  if (context === undefined) {
    throw new Error('useAdminPerformance must be used within AdminPerformanceProvider');
  }
  return context;
}

// Global Performance Warning Component
export function AdminPerformanceWarning() {
  const { performanceStatus, showPerformanceWarning } = useAdminPerformance();

  if (!showPerformanceWarning) return null;

  return (
    <div className="fixed top-20 right-4 max-w-sm bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg z-50">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="text-yellow-600 text-xl">⚠️</div>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            {performanceStatus === 'timeout' ? 'System Timeout' : 'System Performance'}
          </h3>
          <div className="mt-1 text-sm text-yellow-700">
            {performanceStatus === 'timeout' ? (
              <p>The system is experiencing high load. Some features may be slower than usual.</p>
            ) : (
              <p>Dashboard loading is slower than normal due to system load.</p>
            )}
          </div>
          <div className="mt-3">
            <button
              onClick={() => window.location.reload()}
              className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}