import React from 'react';
import { useLocation } from 'wouter';
import JEEStudyDashboard from '@/components/JEEStudyDashboard';
import Header from '@/components/Header';

export default function JEEDashboardPage() {
  const [, setLocation] = useLocation();
  
  const handleBack = () => {
    setLocation('/dashboard');
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header showBackButton={true} onBack={handleBack} />
      <main className="flex-1 py-6">
        <JEEStudyDashboard />
      </main>
    </div>
  );
}
