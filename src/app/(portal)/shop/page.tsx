import { portalMetadata } from "@/lib/metadata";

export const metadata = portalMetadata("/shop");

import { MaterialIcon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";

type PricingTier = {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
};

type ShopProduct = {
  name: string;
  description: string;
  icon: string;
  category: string;
  tiers: PricingTier[];
};

const products: ShopProduct[] = [
  {
    name: "Managed Workplace",
    description:
      "Volledig beheerde werkplekken met monitoring, patching en support.",
    icon: "laptop_mac",
    category: "Werkplek",
    tiers: [
      {
        name: "Basis",
        price: "29",
        period: "per werkplek/mnd",
        features: [
          "Monitoring & alerting",
          "Maandelijkse patching",
          "E-mail support",
        ],
      },
      {
        name: "Professioneel",
        price: "49",
        period: "per werkplek/mnd",
        features: [
          "Alles van Basis",
          "Wekelijkse patching",
          "Remote support",
          "Endpoint protection",
        ],
        highlighted: true,
      },
      {
        name: "Enterprise",
        price: "79",
        period: "per werkplek/mnd",
        features: [
          "Alles van Professioneel",
          "24/7 monitoring",
          "Onsite support",
          "Advanced threat protection",
          "Compliance reporting",
        ],
      },
    ],
  },
  {
    name: "Cloud Backup",
    description:
      "Automatische cloud back-ups met encryptie en snelle restore mogelijkheden.",
    icon: "cloud_upload",
    category: "Beveiliging",
    tiers: [
      {
        name: "Starter",
        price: "5",
        period: "per gebruiker/mnd",
        features: [
          "50 GB opslag",
          "Dagelijkse back-ups",
          "30 dagen retentie",
        ],
      },
      {
        name: "Business",
        price: "12",
        period: "per gebruiker/mnd",
        features: [
          "500 GB opslag",
          "Continue back-ups",
          "1 jaar retentie",
          "Snelle restore",
        ],
        highlighted: true,
      },
      {
        name: "Unlimited",
        price: "19",
        period: "per gebruiker/mnd",
        features: [
          "Onbeperkt opslag",
          "Continue back-ups",
          "Onbeperkte retentie",
          "Priority restore",
          "Compliance archivering",
        ],
      },
    ],
  },
  {
    name: "Security Suite",
    description:
      "Uitgebreide beveiligingsoplossing met EDR, MFA en security awareness.",
    icon: "security",
    category: "Beveiliging",
    tiers: [
      {
        name: "Essentials",
        price: "8",
        period: "per gebruiker/mnd",
        features: [
          "Antivirus & EDR",
          "MFA",
          "Phishing simulatie (kwartaal)",
        ],
      },
      {
        name: "Advanced",
        price: "15",
        period: "per gebruiker/mnd",
        features: [
          "Alles van Essentials",
          "SIEM monitoring",
          "Maandelijkse phishing tests",
          "Dark web monitoring",
        ],
        highlighted: true,
      },
      {
        name: "Complete",
        price: "25",
        period: "per gebruiker/mnd",
        features: [
          "Alles van Advanced",
          "SOC monitoring 24/7",
          "Incident response",
          "Vulnerability scanning",
          "Compliance dashboard",
        ],
      },
    ],
  },
  {
    name: "Microsoft 365 Beheer",
    description:
      "Professioneel beheer van uw Microsoft 365 omgeving inclusief migratie.",
    icon: "apps",
    category: "Productiviteit",
    tiers: [
      {
        name: "Support",
        price: "4",
        period: "per gebruiker/mnd",
        features: [
          "Gebruikersbeheer",
          "Licentie-optimalisatie",
          "E-mail support",
        ],
      },
      {
        name: "Managed",
        price: "9",
        period: "per gebruiker/mnd",
        features: [
          "Alles van Support",
          "SharePoint inrichting",
          "Teams governance",
          "Security policies",
        ],
        highlighted: true,
      },
      {
        name: "Premium",
        price: "16",
        period: "per gebruiker/mnd",
        features: [
          "Alles van Managed",
          "Intune MDM",
          "Conditional access",
          "DLP policies",
          "Compliance beheer",
        ],
      },
    ],
  },
];

function formatPrice(price: string): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(Number(price));
}

function groupByCategory(items: ShopProduct[]): Record<string, ShopProduct[]> {
  const groups: Record<string, ShopProduct[]> = {};
  for (const item of items) {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category]!.push(item);
  }
  return groups;
}

const categoryIcons: Record<string, string> = {
  Werkplek: "desktop_windows",
  Beveiliging: "shield",
  Productiviteit: "trending_up",
};

export default function ShopPage() {
  const grouped = groupByCategory(products);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="section-title text-2xl">IT-oplossingen</h1>
        <Badge className="bg-yielder-orange/10 text-yielder-orange">
          {products.length} oplossingen
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
        Ontdek onze IT-oplossingen voor uw organisatie. Alle prijzen zijn
        exclusief BTW. Neem contact op met uw accountmanager voor een offerte op
        maat.
      </p>

      <div className="space-y-12">
        {Object.entries(grouped).map(([category, categoryProducts]) => (
          <section key={category}>
            <div className="flex items-center gap-2 mb-6">
              <MaterialIcon
                name={categoryIcons[category] ?? "category"}
                className="text-yielder-navy/60"
                size={20}
              />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-yielder-navy/60">
                {category}
              </h2>
              <div className="flex-1 h-px bg-border ml-2" />
            </div>

            <div className="space-y-8">
              {categoryProducts.map((product) => (
                <div key={product.name}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 rounded-xl bg-yielder-navy/[0.06] flex items-center justify-center">
                      <MaterialIcon
                        name={product.icon}
                        className="text-yielder-navy"
                        size={24}
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        {product.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {product.tiers.map((tier) => (
                      <div
                        key={`${product.name}-${tier.name}`}
                        className={`bg-card rounded-2xl p-5 shadow-card border transition-all
                          ${
                            tier.highlighted
                              ? "border-yielder-navy ring-1 ring-yielder-navy/20 shadow-card-hover"
                              : "border-border hover:shadow-card-hover"
                          }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-foreground">
                            {tier.name}
                          </h4>
                          {tier.highlighted && (
                            <Badge className="bg-yielder-navy text-white text-[10px]">
                              Populair
                            </Badge>
                          )}
                        </div>

                        <div className="mb-4">
                          <span className="text-3xl font-bold text-yielder-navy">
                            {formatPrice(tier.price)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            {tier.period}
                          </span>
                        </div>

                        <ul className="space-y-2 mb-5">
                          {tier.features.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-start gap-2 text-sm"
                            >
                              <MaterialIcon
                                name="check_circle"
                                className="text-emerald-500 shrink-0 mt-0.5"
                                size={16}
                              />
                              <span className="text-muted-foreground">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <button
                          className={`w-full py-2 rounded-lg text-sm font-medium transition-colors
                            ${
                              tier.highlighted
                                ? "bg-yielder-navy text-white hover:bg-yielder-navy/90"
                                : "bg-yielder-navy/[0.06] text-yielder-navy hover:bg-yielder-navy/10"
                            }`}
                        >
                          Offerte aanvragen
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="mt-12 bg-yielder-navy/[0.03] border border-yielder-navy/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4">
        <div className="size-12 rounded-xl bg-yielder-orange/10 flex items-center justify-center shrink-0">
          <MaterialIcon
            name="support_agent"
            className="text-yielder-orange"
            size={28}
          />
        </div>
        <div className="text-center sm:text-left">
          <h3 className="text-sm font-semibold text-foreground">
            Op zoek naar een maatwerkoplossing?
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Onze consultants helpen u graag met een pakket dat past bij uw
            organisatie.
          </p>
        </div>
        <a
          href="/contact"
          className="sm:ml-auto shrink-0 inline-flex items-center gap-2 bg-yielder-orange text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-yielder-orange/90 transition-colors"
        >
          <MaterialIcon name="mail" size={16} />
          Neem contact op
        </a>
      </div>
    </div>
  );
}
