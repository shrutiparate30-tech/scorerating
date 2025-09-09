import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/auth/AuthForm';
import { SystemAdminDashboard } from '@/components/dashboards/SystemAdminDashboard';
import { NormalUserDashboard } from '@/components/dashboards/NormalUserDashboard';
import { StoreOwnerDashboard } from '@/components/dashboards/StoreOwnerDashboard';

const Index = () => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  // Route to appropriate dashboard based on user role
  switch (userRole) {
    case 'system_admin':
      return <SystemAdminDashboard />;
    case 'normal_user':
      return <NormalUserDashboard />;
    case 'store_owner':
      return <StoreOwnerDashboard />;
    default:
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">Access Pending</h1>
            <p className="text-muted-foreground">Your account role is being configured. Please contact the administrator.</p>
          </div>
        </div>
      );
  }
};

export default Index;
