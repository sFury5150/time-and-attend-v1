import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Mobile-optimized Header with larger touch targets */}
        <header className="fixed top-0 left-0 right-0 z-50 h-14 md:h-12 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-2 md:px-0">
          <SidebarTrigger className="ml-2 h-10 w-10 md:h-8 md:w-8 touch-manipulation" />
          <div className="flex-1 flex items-center justify-center px-4">
            <span className="text-xs md:text-sm font-medium text-muted-foreground truncate max-w-[200px] md:max-w-none">
              Welcome back, {user.email}
            </span>
          </div>
        </header>

        <AppSidebar />

        {/* Main Content with mobile-optimized spacing */}
        <main className="flex-1 pt-14 md:pt-12">
          <div className="container mx-auto p-3 md:p-6 max-w-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;