import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Package, MapPin, Calendar, MoreHorizontal } from "lucide-react";
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
  weight: string;
  price: string;
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
  { id: "1", trackingNumber: "LT-2024-001", origin: "Paris", destination: "Lyon", status: "in-transit", date: "2024-01-15", client: "Entreprise ABC", weight: "250 kg", price: "450€" },
  { id: "2", trackingNumber: "LT-2024-002", origin: "Marseille", destination: "Bordeaux", status: "delivered", date: "2024-01-14", client: "Société XYZ", weight: "180 kg", price: "380€" },
  { id: "3", trackingNumber: "LT-2024-003", origin: "Lille", destination: "Toulouse", status: "pending", date: "2024-01-16", client: "SARL Delta", weight: "320 kg", price: "520€" },
  { id: "4", trackingNumber: "LT-2024-004", origin: "Nice", destination: "Nantes", status: "in-transit", date: "2024-01-15", client: "Corp Omega", weight: "150 kg", price: "290€" },
  { id: "5", trackingNumber: "LT-2024-005", origin: "Strasbourg", destination: "Rennes", status: "cancelled", date: "2024-01-13", client: "Tech Solutions", weight: "200 kg", price: "410€" },
  { id: "6", trackingNumber: "LT-2024-006", origin: "Montpellier", destination: "Dijon", status: "delivered", date: "2024-01-12", client: "LogiPro", weight: "280 kg", price: "470€" },
  { id: "7", trackingNumber: "LT-2024-007", origin: "Grenoble", destination: "Angers", status: "in-transit", date: "2024-01-15", client: "FastCargo", weight: "190 kg", price: "350€" },
  { id: "8", trackingNumber: "LT-2024-008", origin: "Reims", destination: "Clermont", status: "pending", date: "2024-01-17", client: "Express Ltd", weight: "220 kg", price: "400€" },
];

const Shipments = () => {
  return (
    <DashboardLayout 
      title="Expéditions" 
      subtitle="Gérez toutes vos expéditions et livraisons"
    >
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher une expédition..."
              className="w-full sm:w-80 pl-10 bg-card"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <Button className="btn-gradient w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle expédition
        </Button>
      </div>

      {/* Status Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
          Toutes (8)
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-status-pending/10 hover:text-status-pending transition-colors">
          En attente (2)
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-status-in-transit/10 hover:text-status-in-transit transition-colors">
          En transit (3)
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-status-delivered/10 hover:text-status-delivered transition-colors">
          Livrées (2)
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-status-cancelled/10 hover:text-status-cancelled transition-colors">
          Annulées (1)
        </Badge>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
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
                  Poids
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Prix
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
              {mockShipments.map((shipment) => (
                <tr key={shipment.id} className="transition-colors hover:bg-muted/30">
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
                  <td className="px-6 py-4 text-sm text-foreground">{shipment.weight}</td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{shipment.price}</td>
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
    </DashboardLayout>
  );
};

export default Shipments;
