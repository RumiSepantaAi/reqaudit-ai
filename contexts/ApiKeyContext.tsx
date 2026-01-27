import React, { createContext, useContext, useState, useEffect } from 'react';

interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  removeApiKey: () => void;
  hasKey: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lazy initialization: Read from localStorage immediately to avoid "flash" of login screen on refresh
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    return localStorage.getItem('GEMINI_API_KEY');
  });

  const setApiKey = (key: string) => {
    localStorage.setItem('GEMINI_API_KEY', key);
    setApiKeyState(key);
  };

  const removeApiKey = () => {
    localStorage.removeItem('GEMINI_API_KEY');
    setApiKeyState(null);
  };

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, removeApiKey, hasKey: !!apiKey }}>
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = () => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};
