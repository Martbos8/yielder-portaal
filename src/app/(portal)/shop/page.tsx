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

export default function ShopPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title text-2xl">IT-oplossingen</h1>
        <Badge className="bg-yielder-orange/10 text-yielder-orange">
          {products.length} oplossingen
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
        Ontdek onze IT-oplossingen voor uw organisatie. Alle prijzen zijn
        exclusief BTW. Neem contact op met uw accountmanager voor een
        offerte op maat.
      </p>

      <div className="space-y-10">
        {products.map((product) => (
          <div key={product.name}>
            {/* Product header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl bg-yielder-navy/[0.06] flex items-center justify-center">
                <MaterialIcon
                  name={product.icon}
                  className="text-yielder-navy"
                  size={24}
                />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {product.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {product.description}
                </p>
              </div>
              <Badge className="ml-auto bg-gray-100 text-gray-600">
                {product.category}
              </Badge>
            </div>

            {/* Pricing tiers */}
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
                    <h3 className="text-sm font-semibold text-foreground">
                      {tier.name}
                    </h3>
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

                  <ul className="space-y-2">
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
                    className={`mt-5 w-full py-2 rounded-lg text-sm font-medium transition-colors
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
    </div>
  );
}
