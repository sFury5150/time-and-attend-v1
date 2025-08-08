import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar';
import { Building, Mail, Phone, Calendar, MapPin } from 'lucide-react';
import { useSchedules, Profile } from '@/hooks/useSchedules';

const EmployeeManagement = () => {
  const { employees, loading } = useSchedules();

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'bg-red-500',
      manager: 'bg-blue-500',
      supervisor: 'bg-purple-500',
      employee: 'bg-green-500'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Employee Management</h2>
          <p className="text-muted-foreground">Loading employees...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Employee Management</h2>
        <p className="text-muted-foreground">View and manage your workforce</p>
      </div>

      {/* Employee Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managers</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees.filter(emp => emp.role === 'manager').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supervisors</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees.filter(emp => emp.role === 'supervisor').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees.filter(emp => emp.role === 'employee').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No employees found</p>
            <p className="text-sm">Employees will appear here once they sign up</p>
          </div>
        ) : (
          employees.map((employee) => (
            <Card key={employee.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      <AvatarInitials name={`${employee.first_name} ${employee.last_name}`} />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {employee.first_name} {employee.last_name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-white ${getRoleBadgeColor(employee.role || 'employee')}`}>
                        {(employee.role || 'employee').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {employee.employee_id && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Badge variant="outline" className="mr-2">
                      ID: {employee.employee_id}
                    </Badge>
                  </div>
                )}
                
                {employee.department && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Building className="w-4 h-4 mr-2" />
                    <span>{employee.department}</span>
                  </div>
                )}

                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Joined {new Date(employee.created_at).toLocaleDateString()}</span>
                </div>

                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Last updated: {new Date(employee.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default EmployeeManagement;