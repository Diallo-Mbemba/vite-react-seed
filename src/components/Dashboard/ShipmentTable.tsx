import { Package, MapPin, Calendar, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ShipmentStatus = "pending" | "in-transit" | "delivered" | "cancelled";

interface Shipment {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  date: string;
  client: string;
}

const statusConfig: Record<ShipmentStatus, { label: string; className: string }> = {
  pending: {
    label: "En attente",
    className: "bg-status-pending/10 text-status-pending border-status-pending/20",
  },
  "in-transit": {
    label: "En transit",
    className: "bg-status-in-transit/10 text-status-in-transit border-status-in-transit/20",
  },
  delivered: {
    label: "Livré",
    className: "bg-status-delivered/10 text-status-delivered border-status-delivered/20",
  },
  cancelled: {
    label: "Annulé",
    className: "bg-status-cancelled/10 text-status-cancelled border-status-cancelled/20",
  },
};

const mockShipments: Shipment[] = [
  {
    id: "1",
    trackingNumber: "LT-2024-001",
    origin: "Paris, France",
    destination: "Lyon, France",
    status: "in-transit",
    date: "2024-01-15",
    client: "Entreprise ABC",
  },
  {
    id: "2",
    trackingNumber: "LT-2024-002",
    origin: "Marseille, France",
    destination: "Bordeaux, France",
    status: "delivered",
    date: "2024-01-14",
    client: "Société XYZ",
  },
  {
    id: "3",
    trackingNumber: "LT-2024-003",
    origin: "Lille, France",
    destination: "Toulouse, France",
    status: "pending",
    date: "2024-01-16",
    client: "SARL Delta",
  },
  {
    id: "4",
    trackingNumber: "LT-2024-004",
    origin: "Nice, France",
    destination: "Nantes, France",
    status: "in-transit",
    date: "2024-01-15",
    client: "Corp Omega",
  },
  {
    id: "5",
    trackingNumber: "LT-2024-005",
    origin: "Strasbourg, France",
    destination: "Rennes, France",
    status: "cancelled",
    date: "2024-01-13",
    client: "Tech Solutions",
  },
];

export function ShipmentTable() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in" style={{ animationDelay: '300ms' }}>
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Expéditions récentes</h3>
          <p className="text-sm text-muted-foreground">Suivi de vos dernières livraisons</p>
        </div>
        <Button variant="outline" size="sm">
          Voir tout
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                N° Suivi
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Trajet
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Statut
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockShipments.map((shipment, index) => (
              <tr 
                key={shipment.id} 
                className="transition-colors hover:bg-muted/30"
                style={{ animationDelay: `${400 + index * 50}ms` }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{shipment.trackingNumber}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-foreground">{shipment.client}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{shipment.origin}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-foreground">{shipment.destination}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(shipment.date).toLocaleDateString('fr-FR')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge 
                    variant="outline" 
                    className={cn("font-medium", statusConfig[shipment.status].className)}
                  >
                    {statusConfig[shipment.status].label}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
