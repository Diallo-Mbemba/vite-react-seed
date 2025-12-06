import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MapPin, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TrackingStep {
  status: string;
  location: string;
  time: string;
  completed: boolean;
  current?: boolean;
}

interface TrackedShipment {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  estimatedDelivery: string;
  status: "pending" | "in-transit" | "out-for-delivery" | "delivered";
  steps: TrackingStep[];
}

const mockTrackedShipment: TrackedShipment = {
  id: "1",
  trackingNumber: "LT-2024-001",
  origin: "Paris, France",
  destination: "Lyon, France",
  estimatedDelivery: "15 Jan 2024, 14:00",
  status: "in-transit",
  steps: [
    { status: "Colis collecté", location: "Paris - Dépôt Central", time: "13 Jan 2024, 09:30", completed: true },
    { status: "En transit", location: "Autoroute A6", time: "13 Jan 2024, 14:00", completed: true },
    { status: "Arrivée au centre de tri", location: "Lyon - Centre de tri", time: "14 Jan 2024, 06:00", completed: true, current: true },
    { status: "En cours de livraison", location: "Lyon", time: "En attente", completed: false },
    { status: "Livré", location: "Lyon - Adresse finale", time: "En attente", completed: false },
  ]
};

const Tracking = () => {
  return (
    <DashboardLayout 
      title="Suivi en temps réel" 
      subtitle="Suivez vos expéditions en temps réel"
    >
      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Entrez votre numéro de suivi (ex: LT-2024-001)"
            className="h-14 pl-12 pr-32 text-lg bg-card border-2 border-border focus:border-primary"
          />
          <Button className="absolute right-2 top-1/2 -translate-y-1/2 btn-gradient">
            Rechercher
          </Button>
        </div>
      </div>

      {/* Tracking Result */}
      <div className="max-w-4xl mx-auto">
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          {/* Header */}
          <div className="hero-gradient p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-sidebar-primary" />
                  <span className="text-lg font-bold text-sidebar-foreground">
                    {mockTrackedShipment.trackingNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sidebar-foreground/80">
                  <span>{mockTrackedShipment.origin}</span>
                  <ArrowRight className="h-4 w-4" />
                  <span>{mockTrackedShipment.destination}</span>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-sidebar-primary text-sidebar-primary-foreground mb-2">
                  En transit
                </Badge>
                <p className="text-sm text-sidebar-foreground/80">
                  Livraison estimée: <span className="font-medium text-sidebar-foreground">{mockTrackedShipment.estimatedDelivery}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-success flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-success-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">Collecté</span>
              </div>
              <div className="flex-1 mx-4 h-1 bg-success rounded" />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center animate-pulse">
                  <Truck className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">En transit</span>
              </div>
              <div className="flex-1 mx-4 h-1 bg-muted rounded" />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">Livré</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Historique du colis</h3>
            <div className="space-y-0">
              {mockTrackedShipment.steps.map((step, index) => (
                <div key={index} className="relative pl-8 pb-8 last:pb-0">
                  {/* Line */}
                  {index < mockTrackedShipment.steps.length - 1 && (
                    <div className={cn(
                      "absolute left-[11px] top-6 w-0.5 h-full",
                      step.completed ? "bg-primary" : "bg-muted"
                    )} />
                  )}
                  
                  {/* Dot */}
                  <div className={cn(
                    "absolute left-0 top-1 h-6 w-6 rounded-full flex items-center justify-center",
                    step.current 
                      ? "bg-primary shadow-glow" 
                      : step.completed 
                        ? "bg-primary" 
                        : "bg-muted"
                  )}>
                    {step.completed ? (
                      <CheckCircle className={cn(
                        "h-3.5 w-3.5",
                        step.current ? "text-primary-foreground" : "text-primary-foreground"
                      )} />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className={cn(
                    "transition-all",
                    step.current && "bg-primary/5 -mx-4 px-4 py-3 rounded-lg"
                  )}>
                    <p className={cn(
                      "font-medium",
                      step.completed ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.status}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {step.location}
                      </span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {step.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Tracking;
