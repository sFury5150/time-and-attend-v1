import { useState, useEffect } from 'react';
import { Clock, Calendar, Users, BarChart3, MapPin, Settings, Building, Timer, Building2, UserCheck, FileText, MessageSquare } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
export function AppSidebar() {
  const {
    state,
    open,
    setOpen
  } = useSidebar();
  const {
    user
  } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const [userRole, setUserRole] = useState<string>('employee');

  // Fetch user role
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const {
          data
        } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
        if (data?.role) {
          setUserRole(data.role);
        }
      };
      fetchProfile();
    }
  }, [user]);
  const isManager = ['manager', 'supervisor', 'admin'].includes(userRole);
  const employeeItems = [{
    title: 'Time Tracking',
    url: '/dashboard',
    icon: Clock
  }, {
    title: 'My Schedule',
    url: '/dashboard/schedule',
    icon: Calendar
  }, {
    title: 'Profile',
    url: '/dashboard/profile',
    icon: Settings
  }];
  const managerItems = [{
    title: 'Overview',
    url: '/dashboard',
    icon: BarChart3
  }, {
    title: 'Time Tracking',
    url: '/dashboard/time',
    icon: Timer
  }, {
    title: 'Schedules',
    url: '/dashboard/schedules',
    icon: Calendar
  }, {
    title: 'Employees',
    url: '/dashboard/employees',
    icon: Users
  }, {
    title: 'Locations',
    url: '/dashboard/locations',
    icon: MapPin
  }, {
    title: 'Reports',
    url: '/dashboard/reports',
    icon: BarChart3
  }];
  const crmItems = [{
    title: 'Companies',
    url: '/dashboard/companies',
    icon: Building2
  }, {
    title: 'Customers',
    url: '/dashboard/customers',
    icon: UserCheck
  }, {
    title: 'Invoices',
    url: '/dashboard/invoices',
    icon: FileText
  }, {
    title: 'Interactions',
    url: '/dashboard/interactions',
    icon: MessageSquare
  }];
  const items = isManager ? managerItems : employeeItems;
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return currentPath === '/dashboard';
    }
    return currentPath.startsWith(path);
  };
  const collapsed = state === 'collapsed';
  const getNavCls = ({
    isActive
  }: {
    isActive: boolean;
  }) => isActive ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted/50';
  return <Sidebar className={`${collapsed ? 'w-16 md:w-14' : 'w-72 md:w-60'} transition-all duration-300 ease-in-out`}>
      <SidebarContent>
        {/* Mobile-optimized Company Header */}
        <div className="p-4 md:p-3 border-b">
          {!collapsed ? <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 md:w-8 md:h-8 bg-gradient-primary rounded-lg flex-shrink-0">
                <Building className="w-6 h-6 md:w-5 md:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-base md:text-sm text-primary truncate">TimeTracker Pro</h2>
                <p className="text-sm md:text-xs text-primary/80">Workforce Management</p>
              </div>
            </div> : <div className="flex justify-center">
              <div className="flex items-center justify-center w-10 h-10 md:w-8 md:h-8 bg-gradient-primary rounded-lg">
                <Building className="w-6 h-6 md:w-5 md:h-5 text-white" />
              </div>
            </div>}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sm md:text-xs px-3 py-2">
            {isManager ? 'Management' : 'Employee'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12 md:h-10 touch-manipulation">
                    <NavLink to={item.url} end={item.url === '/dashboard'} className={getNavCls}>
                      <item.icon className="h-6 w-6 md:h-4 md:w-4 flex-shrink-0" />
                      {!collapsed && <span className="text-base md:text-sm text-slate-700">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isManager && <SidebarGroup>
            <SidebarGroupLabel className="text-sm md:text-xs px-3 py-2">Customer Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {crmItems.map(item => <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-12 md:h-10 touch-manipulation">
                      <NavLink to={item.url} className={getNavCls}>
                        <item.icon className="h-6 w-6 md:h-4 md:w-4 flex-shrink-0" />
                        {!collapsed && <span className="text-base md:text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>}

        {isManager && <SidebarGroup>
            <SidebarGroupLabel className="text-sm md:text-xs px-3 py-2">Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="h-12 md:h-10 touch-manipulation">
                    <NavLink to="/dashboard/admin" className={getNavCls}>
                      <Settings className="h-6 w-6 md:h-4 md:w-4 flex-shrink-0" />
                      {!collapsed && <span className="text-base md:text-sm">Admin Settings</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>}
      </SidebarContent>
    </Sidebar>;
}