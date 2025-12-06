import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { Download, Calendar, TrendingUp, Package, Truck, Euro } from "lucide-react";

const monthlyData = [
  { name: "Jan", livraisons: 245, revenus: 24500 },
  { name: "Fév", livraisons: 312, revenus: 31200 },
  { name: "Mar", livraisons: 287, revenus: 28700 },
  { name: "Avr", livraisons: 356, revenus: 35600 },
  { name: "Mai", livraisons: 398, revenus: 39800 },
  { name: "Juin", livraisons: 423, revenus: 42300 },
];

const statusData = [
  { name: "Livrées", value: 1089, color: "hsl(142, 76%, 36%)" },
  { name: "En transit", value: 156, color: "hsl(199, 89%, 48%)" },
  { name: "En attente", value: 28, color: "hsl(38, 92%, 50%)" },
  { name: "Annulées", value: 11, color: "hsl(0, 72%, 51%)" },
];

const performanceData = [
  { name: "Sem 1", tempsLivraison: 2.1, objectif: 2.5 },
  { name: "Sem 2", tempsLivraison: 2.3, objectif: 2.5 },
  { name: "Sem 3", tempsLivraison: 1.9, objectif: 2.5 },
  { name: "Sem 4", tempsLivraison: 2.4, objectif: 2.5 },
];

const Reports = () => {
  return (
    <DashboardLayout 
      title="Rapports & Analytics" 
      subtitle="Analysez les performances de votre activité"
    >
      {/* Actions */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Ce mois
          </Button>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exporter PDF
        </Button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expéditions totales</p>
              <p className="text-2xl font-bold text-foreground">2,021</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taux de livraison</p>
              <p className="text-2xl font-bold text-foreground">98.2%</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
              <Truck className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Km parcourus</p>
              <p className="text-2xl font-bold text-foreground">45,230</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <Euro className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenus</p>
              <p className="text-2xl font-bold text-foreground">202,100€</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Performance */}
        <div className="rounded-xl border border-border bg-card shadow-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Performance mensuelle</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 88%)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(220, 20%, 88%)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="livraisons" name="Livraisons" fill="hsl(220, 70%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="rounded-xl border border-border bg-card shadow-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Répartition des statuts</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(220, 20%, 88%)',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delivery Time Performance */}
      <div className="rounded-xl border border-border bg-card shadow-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Temps de livraison moyen (jours)</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 88%)" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }}
                domain={[0, 3]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(0, 0%, 100%)',
                  border: '1px solid hsl(220, 20%, 88%)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="tempsLivraison" 
                name="Temps réel"
                stroke="hsl(220, 70%, 45%)" 
                strokeWidth={2}
                dot={{ fill: 'hsl(220, 70%, 45%)' }}
              />
              <Line 
                type="monotone" 
                dataKey="objectif" 
                name="Objectif"
                stroke="hsl(175, 60%, 40%)" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
