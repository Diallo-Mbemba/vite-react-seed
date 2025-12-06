import { Truck, Fuel, Wrench, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Vehicle {
  id: string;
  name: string;
  plate: string;
  status: "active" | "maintenance" | "idle";
  fuelLevel: number;
  driver: string;
}

const mockVehicles: Vehicle[] = [
  { id: "1", name: "Camion A1", plate: "AB-123-CD", status: "active", fuelLevel: 85, driver: "Jean Dupont" },
  { id: "2", name: "Camion B2", plate: "EF-456-GH", status: "active", fuelLevel: 62, driver: "Marie Martin" },
  { id: "3", name: "Van C3", plate: "IJ-789-KL", status: "maintenance", fuelLevel: 45, driver: "Pierre Durand" },
  { id: "4", name: "Camion D4", plate: "MN-012-OP", status: "idle", fuelLevel: 100, driver: "Sophie Bernard" },
];

const statusConfig = {
  active: { label: "En route", icon: Truck, color: "text-success" },
  maintenance: { label: "Maintenance", icon: Wrench, color: "text-warning" },
  idle: { label: "Disponible", icon: CheckCircle, color: "text-muted-foreground" },
};

export function FleetOverview() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card animate-fade-in" style={{ animationDelay: '400ms' }}>
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-lg font-semibold text-foreground">Aperçu de la flotte</h3>
        <p className="text-sm text-muted-foreground">État en temps réel de vos véhicules</p>
      </div>
      
      <div className="divide-y divide-border">
        {mockVehicles.map((vehicle, index) => {
          const StatusIcon = statusConfig[vehicle.status].icon;
          
          return (
            <div 
              key={vehicle.id} 
              className="flex items-center justify-between p-4 transition-colors hover:bg-muted/30"
              style={{ animationDelay: `${500 + index * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-logistics-navy/10">
                  <Truck className="h-5 w-5 text-logistics-navy" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{vehicle.name}</p>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {vehicle.plate}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{vehicle.driver}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                {/* Fuel Level */}
                <div className="flex items-center gap-2 w-32">
                  <Fuel className="h-4 w-4 text-muted-foreground" />
                  <Progress 
                    value={vehicle.fuelLevel} 
                    className="h-2"
                  />
                  <span className="text-xs font-medium text-muted-foreground w-8">
                    {vehicle.fuelLevel}%
                  </span>
                </div>
                
                {/* Status */}
                <div className={cn(
                  "flex items-center gap-1.5 text-sm font-medium",
                  statusConfig[vehicle.status].color
                )}>
                  <StatusIcon className="h-4 w-4" />
                  {statusConfig[vehicle.status].label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
