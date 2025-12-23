import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

interface NotificationContextType {
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
  notifyInfo: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const notifySuccess = (message: string) => {
    toast({ title: 'Success', description: message });
  };

  const notifyError = (message: string) => {
    toast({ title: 'Error', description: message, variant: 'destructive' });
  };

  const notifyInfo = (message: string) => {
    toast({ title: 'Info', description: message, variant: 'default' });
  };

  return (
    <NotificationContext.Provider value={{ notifySuccess, notifyError, notifyInfo }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
