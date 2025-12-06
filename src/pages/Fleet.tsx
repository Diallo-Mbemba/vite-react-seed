import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Truck, 
  Fuel, 
  Wrench, 
  CheckCircle, 
  MapPin,
  Calendar,
  User,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Vehicle {
  id: string;
  name: string;
  plate: string;
  type: string;
  status: "active" | "maintenance" | "idle";
  fuelLevel: number;
  driver: string;
  location: string;
  lastService: string;
  nextService: string;
  mileage: string;
}

const statusConfig = {
  active: { label: "En route", icon: Truck, color: "bg-success/10 text-success border-success/20" },
  maintenance: { label: "Maintenance", icon: Wrench, color: "bg-warning/10 text-warning border-warning/20" },
  idle: { label: "Disponible", icon: CheckCircle, color: "bg-muted text-muted-foreground border-border" },
};

const mockVehicles: Vehicle[] = [
  { id: "1", name: "Camion A1", plate: "AB-123-CD", type: "Poids lourd", status: "active", fuelLevel: 85, driver: "Jean Dupont", location: "Lyon", lastService: "2024-01-01", nextService: "2024-04-01", mileage: "125,430 km" },
  { id: "2", name: "Camion B2", plate: "EF-456-GH", type: "Poids lourd", status: "active", fuelLevel: 62, driver: "Marie Martin", location: "Bordeaux", lastService: "2023-12-15", nextService: "2024-03-15", mileage: "98,200 km" },
  { id: "3", name: "Van C3", plate: "IJ-789-KL", type: "Utilitaire", status: "maintenance", fuelLevel: 45, driver: "Pierre Durand", location: "Garage Central", lastService: "2024-01-10", nextService: "2024-01-20", mileage: "67,800 km" },
  { id: "4", name: "Camion D4", plate: "MN-012-OP", type: "Poids lourd", status: "idle", fuelLevel: 100, driver: "Sophie Bernard", location: "Dépôt Paris", lastService: "2024-01-05", nextService: "2024-04-05", mileage: "145,600 km" },
  { id: "5", name: "Van E5", plate: "QR-345-ST", type: "Utilitaire", status: "active", fuelLevel: 78, driver: "Lucas Petit", location: "Marseille", lastService: "2023-12-20", nextService: "2024-03-20", mileage: "52,100 km" },
  { id: "6", name: "Camion F6", plate: "UV-678-WX", type: "Semi-remorque", status: "idle", fuelLevel: 90, driver: "Emma Leroy", location: "Dépôt Lyon", lastService: "2024-01-08", nextService: "2024-04-08", mileage: "210,300 km" },
];

const Fleet = () => {
  const activeCount = mockVehicles.filter(v => v.status === "active").length;
  const maintenanceCount = mockVehicles.filter(v => v.status === "maintenance").length;
  const idleCount = mockVehicles.filter(v => v.status === "idle").length;

  return (
    <DashboardLayout 
      title="Gestion de la flotte" 
      subtitle="Surveillez et gérez tous vos véhicules"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="stat-card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
            <Truck className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">En route</p>
            <p className="text-2xl font-bold text-foreground">{activeCount}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
            <Wrench className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">En maintenance</p>
            <p className="text-2xl font-bold text-foreground">{maintenanceCount}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <CheckCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Disponibles</p>
            <p className="text-2xl font-bold text-foreground">{idleCount}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Tous les véhicules</h3>
        <Button className="btn-gradient">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un véhicule
        </Button>
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockVehicles.map((vehicle) => {
          const StatusIcon = statusConfig[vehicle.status].icon;
          
          return (
            <div 
              key={vehicle.id} 
              className="rounded-xl border border-border bg-card shadow-card p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-logistics-navy/10">
                    <Truck className="h-6 w-6 text-logistics-navy" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{vehicle.name}</h4>
                    <p className="text-sm text-muted-foreground">{vehicle.plate}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>

              {/* Status Badge */}
              <Badge variant="outline" className={cn("mb-4", statusConfig[vehicle.status].color)}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {statusConfig[vehicle.status].label}
              </Badge>

              {/* Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Chauffeur:</span>
                  <span className="text-foreground">{vehicle.driver}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Position:</span>
                  <span className="text-foreground">{vehicle.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Prochaine révision:</span>
                  <span className="text-foreground">{new Date(vehicle.nextService).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              {/* Fuel Level */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Carburant</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{vehicle.fuelLevel}%</span>
                </div>
                <Progress 
                  value={vehicle.fuelLevel} 
                  className={cn(
                    "h-2",
                    vehicle.fuelLevel < 30 && "[&>div]:bg-destructive",
                    vehicle.fuelLevel >= 30 && vehicle.fuelLevel < 60 && "[&>div]:bg-warning",
                    vehicle.fuelLevel >= 60 && "[&>div]:bg-success"
                  )}
                />
              </div>

              {/* Mileage */}
              <div className="mt-3 text-center">
                <p className="text-xs text-muted-foreground">Kilométrage: <span className="font-medium text-foreground">{vehicle.mileage}</span></p>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default Fleet;
