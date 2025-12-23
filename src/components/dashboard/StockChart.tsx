import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Jan", stock: 4000, orders: 2400 },
  { name: "Feb", stock: 3000, orders: 1398 },
  { name: "Mar", stock: 5000, orders: 3800 },
  { name: "Apr", stock: 2780, orders: 3908 },
  { name: "May", stock: 1890, orders: 4800 },
  { name: "Jun", stock: 2390, orders: 3800 },
  { name: "Jul", stock: 3490, orders: 4300 },
];

export function StockChart() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 opacity-0 animate-fade-up" style={{ animationDelay: "100ms" }}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Stock Overview</h2>
        <p className="text-sm text-muted-foreground">Monthly stock and order trends</p>
      </div>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(172, 66%, 40%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(172, 66%, 40%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(222, 47%, 25%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(222, 47%, 25%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(220, 20%, 88%)"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(220, 20%, 88%)",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              labelStyle={{ color: "hsl(222, 47%, 11%)", fontWeight: 600 }}
            />
            <Area
              type="monotone"
              dataKey="stock"
              stroke="hsl(172, 66%, 40%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorStock)"
            />
            <Area
              type="monotone"
              dataKey="orders"
              stroke="hsl(222, 47%, 25%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorOrders)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-accent" />
          <span className="text-sm text-muted-foreground">Stock Level</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Orders</span>
        </div>
      </div>
    </div>
  );
}
