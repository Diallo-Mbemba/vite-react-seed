import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  Package,
  MoreHorizontal
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  type: "enterprise" | "pme" | "particulier";
  email: string;
  phone: string;
  address: string;
  totalShipments: number;
  activeShipments: number;
}

const typeConfig = {
  enterprise: { label: "Entreprise", className: "bg-primary/10 text-primary border-primary/20" },
  pme: { label: "PME", className: "bg-secondary/10 text-secondary border-secondary/20" },
  particulier: { label: "Particulier", className: "bg-muted text-muted-foreground border-border" },
};

const mockClients: Client[] = [
  { id: "1", name: "Entreprise ABC", type: "enterprise", email: "contact@abc.fr", phone: "+33 1 23 45 67 89", address: "123 Rue de Paris, 75001 Paris", totalShipments: 245, activeShipments: 12 },
  { id: "2", name: "Société XYZ", type: "enterprise", email: "info@xyz.fr", phone: "+33 1 98 76 54 32", address: "456 Avenue Lyon, 69001 Lyon", totalShipments: 189, activeShipments: 8 },
  { id: "3", name: "SARL Delta", type: "pme", email: "delta@email.fr", phone: "+33 4 56 78 90 12", address: "789 Boulevard Marseille, 13001 Marseille", totalShipments: 67, activeShipments: 3 },
  { id: "4", name: "Corp Omega", type: "enterprise", email: "omega@corp.fr", phone: "+33 5 12 34 56 78", address: "321 Rue Bordeaux, 33000 Bordeaux", totalShipments: 312, activeShipments: 15 },
  { id: "5", name: "Tech Solutions", type: "pme", email: "tech@solutions.fr", phone: "+33 3 45 67 89 01", address: "654 Avenue Lille, 59000 Lille", totalShipments: 98, activeShipments: 5 },
  { id: "6", name: "Jean Martin", type: "particulier", email: "jean.martin@email.fr", phone: "+33 6 12 34 56 78", address: "12 Rue Résidentielle, 31000 Toulouse", totalShipments: 8, activeShipments: 1 },
];

const Clients = () => {
  return (
    <DashboardLayout 
      title="Clients" 
      subtitle="Gérez votre portefeuille clients"
    >
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un client..."
              className="w-full sm:w-80 pl-10 bg-card"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <Button className="btn-gradient w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau client
        </Button>
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockClients.map((client) => (
          <div 
            key={client.id} 
            className="rounded-xl border border-border bg-card shadow-card p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{client.name}</h4>
                  <Badge variant="outline" className={typeConfig[client.type].className}>
                    {typeConfig[client.type].label}
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{client.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{client.phone}</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">{client.address}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total expéditions</span>
                </div>
                <span className="font-semibold text-foreground">{client.totalShipments}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">En cours</span>
                <Badge variant="secondary">{client.activeShipments}</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Clients;
