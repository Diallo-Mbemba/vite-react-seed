import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ShipmentTable } from "@/components/dashboard/ShipmentTable";
import { FleetOverview } from "@/components/dashboard/FleetOverview";
import { DeliveryChart } from "@/components/dashboard/DeliveryChart";
import { Package, Truck, CheckCircle, Clock } from "lucide-react";

const Index = () => {
  return (
    <DashboardLayout 
      title="Tableau de bord" 
      subtitle="Bienvenue sur LogiTrack - Vue d'ensemble de vos opérations"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Expéditions"
          value="1,284"
          icon={<Package className="h-6 w-6" />}
          trend={{ value: 12.5, isPositive: true }}
          delay={0}
        />
        <StatCard
          title="En Transit"
          value="156"
          icon={<Truck className="h-6 w-6" />}
          trend={{ value: 8.2, isPositive: true }}
          delay={100}
        />
        <StatCard
          title="Livraisons Effectuées"
          value="1,089"
          icon={<CheckCircle className="h-6 w-6" />}
          trend={{ value: 15.3, isPositive: true }}
          delay={200}
        />
        <StatCard
          title="Temps Moyen"
          value="2.4j"
          icon={<Clock className="h-6 w-6" />}
          trend={{ value: 3.1, isPositive: false }}
          delay={300}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <DeliveryChart />
        <FleetOverview />
      </div>

      {/* Shipments Table */}
      <ShipmentTable />
    </DashboardLayout>
  );
};

export default Index;
