import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Search,
  Clock,
  Coffee,
  LogOut,
  Circle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api/apiClient';
import { cn } from '@/lib/utils';
import { formatMinutesToTime, ClockStatus } from '@/hooks/useTimeTracking';

interface EmployeeClockStatus {
  user_id: string;
  full_name: string;
  role: string;
  status: ClockStatus;
  last_action_time: string | null;
  net_work_minutes: number;
}

const STATUS_CONFIG: Record<ClockStatus, {
  label: string;
  icon: typeof Clock;
  color: string;
  dotColor: string;
}> = {
  not_started: {
    label: 'Sin fichar',
    icon: Circle,
    color: 'text-gray-500',
    dotColor: 'bg-gray-400'
  },
  working: {
    label: 'Trabajando',
    icon: Clock,
    color: 'text-green-600',
    dotColor: 'bg-green-500'
  },
  on_break: {
    label: 'En pausa',
    icon: Coffee,
    color: 'text-amber-600',
    dotColor: 'bg-amber-500'
  },
  finished: {
    label: 'Finalizado',
    icon: LogOut,
    color: 'text-blue-600',
    dotColor: 'bg-blue-500'
  }
};

interface EmployeesListProps {
  className?: string;
}

export function EmployeesList({ className }: EmployeesListProps) {
  const { sessionToken, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Query para obtener estado de todos los empleados
  // Nota: Esta funcion RPC necesitaria implementarse si no existe
  const { data: employees, isLoading, error } = useQuery({
    queryKey: ['employees-clock-status'],
    queryFn: async () => {
      // Intentar usar RPC si existe, sino simular con datos de usuarios
      try {
        const response = await api.rpc('get_all_employees_clock_status', {
          p_session_token: sessionToken
        });

        if (response.success) {
          return response.employees as EmployeeClockStatus[];
        }
      } catch {
        // RPC no existe, usar alternativa
      }

      // Alternativa: obtener usuarios de la clinica
      // En produccion, esto deberia ser una RPC que combine usuarios con su estado de fichaje
      const usersResponse = await api
        .schema('clinic_' + (user?.clinic_id || '').toString().padStart(4, '0'))
        .from('staff')
        .select('user_id, user:users(full_name, role)');

      // Simular estados para demo - en produccion vendria del servidor
      return (usersResponse || []).map((staff: { user_id: string; user: { full_name: string; role: string } }) => ({
        user_id: staff.user_id,
        full_name: staff.user?.full_name || 'Usuario',
        role: staff.user?.role || 'staff',
        status: 'not_started' as ClockStatus,
        last_action_time: null,
        net_work_minutes: 0
      }));
    },
    enabled: !!sessionToken && user?.role === 'admin',
    refetchInterval: 60000 // Actualizar cada minuto
  });

  const filteredEmployees = employees?.filter(emp =>
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Agrupar por estado
  const groupedByStatus = filteredEmployees.reduce((acc, emp) => {
    if (!acc[emp.status]) {
      acc[emp.status] = [];
    }
    acc[emp.status].push(emp);
    return acc;
  }, {} as Record<ClockStatus, EmployeeClockStatus[]>);

  // Contadores
  const statusCounts = {
    working: groupedByStatus.working?.length || 0,
    on_break: groupedByStatus.on_break?.length || 0,
    not_started: groupedByStatus.not_started?.length || 0,
    finished: groupedByStatus.finished?.length || 0
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (user?.role !== 'admin') {
    return null;
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Error al cargar empleados
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Estado del Equipo
        </CardTitle>

        {/* Contadores rapidos */}
        <div className="flex gap-2 mt-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
            {statusCounts.working} trabajando
          </Badge>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5" />
            {statusCounts.on_break} en pausa
          </Badge>
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <span className="w-2 h-2 rounded-full bg-gray-400 mr-1.5" />
            {statusCounts.not_started} sin fichar
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {/* Buscador */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar empleado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de empleados */}
        <ScrollArea className="h-[400px]">
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron empleados
            </div>
          ) : (
            <div className="space-y-2">
              {/* Trabajando */}
              {groupedByStatus.working?.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Trabajando ({groupedByStatus.working.length})
                  </div>
                  {groupedByStatus.working.map(emp => (
                    <EmployeeCard key={emp.user_id} employee={emp} />
                  ))}
                </div>
              )}

              {/* En pausa */}
              {groupedByStatus.on_break?.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    En pausa ({groupedByStatus.on_break.length})
                  </div>
                  {groupedByStatus.on_break.map(emp => (
                    <EmployeeCard key={emp.user_id} employee={emp} />
                  ))}
                </div>
              )}

              {/* Sin fichar */}
              {groupedByStatus.not_started?.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Sin fichar ({groupedByStatus.not_started.length})
                  </div>
                  {groupedByStatus.not_started.map(emp => (
                    <EmployeeCard key={emp.user_id} employee={emp} />
                  ))}
                </div>
              )}

              {/* Finalizado */}
              {groupedByStatus.finished?.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Jornada finalizada ({groupedByStatus.finished.length})
                  </div>
                  {groupedByStatus.finished.map(emp => (
                    <EmployeeCard key={emp.user_id} employee={emp} />
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function EmployeeCard({ employee }: { employee: EmployeeClockStatus }) {
  const statusConfig = STATUS_CONFIG[employee.status];
  const StatusIcon = statusConfig.icon;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="text-sm">
              {getInitials(employee.full_name)}
            </AvatarFallback>
          </Avatar>
          <span className={cn(
            'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
            statusConfig.dotColor
          )} />
        </div>
        <div>
          <div className="font-medium">{employee.full_name}</div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <StatusIcon className={cn('h-3 w-3', statusConfig.color)} />
            <span className={statusConfig.color}>{statusConfig.label}</span>
          </div>
        </div>
      </div>

      <div className="text-right">
        {employee.net_work_minutes > 0 && (
          <div className="font-mono text-sm">
            {formatMinutesToTime(employee.net_work_minutes)}
          </div>
        )}
        {employee.last_action_time && (
          <div className="text-xs text-muted-foreground">
            {new Date(employee.last_action_time).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}
      </div>
    </div>
  );
}
