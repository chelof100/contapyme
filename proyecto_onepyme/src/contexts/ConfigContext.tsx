import React, { createContext, useContext, useState, useEffect } from 'react';

interface ConfigContextType {
  recetasEnabled: boolean;
  setRecetasEnabled: (enabled: boolean) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recetasEnabled, setRecetasEnabled] = useState(() => {
    const saved = localStorage.getItem('recetasEnabled');
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('recetasEnabled', JSON.stringify(recetasEnabled));
  }, [recetasEnabled]);

  return (
    <ConfigContext.Provider value={{ 
      recetasEnabled, 
      setRecetasEnabled 
    }}>
      {children}
    </ConfigContext.Provider>
  );
};