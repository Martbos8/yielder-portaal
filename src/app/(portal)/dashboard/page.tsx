import { getDashboardStats } from "@/lib/queries";
import { MaterialIcon } from "@/components/icon";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const kpis = [
    {
      label: "Open tickets",
      value: String(stats.openTickets),
      icon: "confirmation_number",
    },
    {
      label: "Hardware",
      value: String(stats.hardwareCount),
      icon: "laptop_mac",
    },
    {
      label: "Contracten",
      value: String(stats.activeContracts),
      icon: "verified_user",
    },
    {
      label: "Maandbedrag",
      value: formatCurrency(stats.monthlyAmount),
      icon: "payments",
    },
  ];

  return (
    <div>
      <h1 className="section-title text-2xl mb-6">Dashboard</h1>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-card rounded-2xl p-5 shadow-card border border-border
              hover:shadow-card-hover hover:scale-[1.015] transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </span>
              <MaterialIcon
                name={kpi.icon}
                className="text-yielder-navy/70"
                size={20}
              />
            </div>
            <span className="text-3xl font-bold text-foreground">
              {kpi.value}
            </span>
          </div>
        ))}
      </div>

      {/* Placeholder secties */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Recente tickets
          </h2>
          <p className="text-sm text-muted-foreground">
            Wordt gekoppeld aan ConnectWise API.
          </p>
        </div>
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Aandachtspunten
          </h2>
          <p className="text-sm text-muted-foreground">
            Wordt gevuld met live data.
          </p>
        </div>
      </div>
    </div>
  );
}
