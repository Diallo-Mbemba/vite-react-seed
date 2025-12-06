import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Lun", livraisons: 24, enCours: 12 },
  { name: "Mar", livraisons: 32, enCours: 18 },
  { name: "Mer", livraisons: 28, enCours: 15 },
  { name: "Jeu", livraisons: 45, enCours: 22 },
  { name: "Ven", livraisons: 38, enCours: 20 },
  { name: "Sam", livraisons: 18, enCours: 8 },
  { name: "Dim", livraisons: 12, enCours: 5 },
];

export function DeliveryChart() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Activité hebdomadaire</h3>
        <p className="text-sm text-muted-foreground">Livraisons et expéditions en cours</p>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLivraisons" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(220, 70%, 45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(220, 70%, 45%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorEnCours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(175, 60%, 40%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(175, 60%, 40%)" stopOpacity={0} />
              </linearGradient>
            </defs>
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
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              labelStyle={{ color: 'hsl(220, 30%, 15%)', fontWeight: 600 }}
            />
            <Area
              type="monotone"
              dataKey="livraisons"
              name="Livraisons"
              stroke="hsl(220, 70%, 45%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorLivraisons)"
            />
            <Area
              type="monotone"
              dataKey="enCours"
              name="En cours"
              stroke="hsl(175, 60%, 40%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorEnCours)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Livraisons</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-secondary" />
          <span className="text-sm text-muted-foreground">En cours</span>
        </div>
      </div>
    </div>
  );
}
