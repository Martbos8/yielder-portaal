import { portalMetadata } from "@/lib/metadata";

export const metadata = portalMetadata("/documenten");

import { MaterialIcon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";

type DocumentItem = {
  title: string;
  description: string;
  icon: string;
  fileType: string;
  size: string;
};

type DocumentGroup = {
  category: string;
  categoryIcon: string;
  items: DocumentItem[];
};

const documentGroups: DocumentGroup[] = [
  {
    category: "Handleidingen",
    categoryIcon: "menu_book",
    items: [
      {
        title: "Welkom bij Mijn Yielder",
        description: "Introductie en handleiding voor het klantportaal",
        icon: "description",
        fileType: "PDF",
        size: "1,2 MB",
      },
      {
        title: "Ticket aanmaken — Stap voor stap",
        description: "Hoe u een serviceverzoek indient via het portaal",
        icon: "description",
        fileType: "PDF",
        size: "845 KB",
      },
      {
        title: "Hardware inventaris beheren",
        description: "Overzicht en beheer van uw IT-apparatuur",
        icon: "description",
        fileType: "PDF",
        size: "1,5 MB",
      },
    ],
  },
  {
    category: "Contracten",
    categoryIcon: "verified_user",
    items: [
      {
        title: "Service Level Agreement (SLA)",
        description: "Overzicht van uw SLA-voorwaarden en responstijden",
        icon: "gavel",
        fileType: "PDF",
        size: "2,1 MB",
      },
      {
        title: "Algemene voorwaarden Yielder",
        description: "Algemene leveringsvoorwaarden voor IT-diensten",
        icon: "gavel",
        fileType: "PDF",
        size: "980 KB",
      },
      {
        title: "Verwerkersovereenkomst (DPA)",
        description: "Data Processing Agreement conform AVG/GDPR",
        icon: "gavel",
        fileType: "PDF",
        size: "1,8 MB",
      },
    ],
  },
  {
    category: "Whitepapers",
    categoryIcon: "science",
    items: [
      {
        title: "IT-security in het MKB",
        description: "Best practices voor beveiliging van uw bedrijfsnetwerk",
        icon: "article",
        fileType: "PDF",
        size: "3,2 MB",
      },
      {
        title: "Cloud migratie strategie",
        description: "Stappenplan voor een succesvolle overstap naar de cloud",
        icon: "article",
        fileType: "PDF",
        size: "2,7 MB",
      },
      {
        title: "Werkplek van de toekomst",
        description: "Trends en technologieën voor de moderne werkplek",
        icon: "article",
        fileType: "PDF",
        size: "4,1 MB",
      },
    ],
  },
  {
    category: "Rapporten",
    categoryIcon: "assessment",
    items: [
      {
        title: "Maandrapportage IT-diensten",
        description: "Uw meest recente maandelijkse IT-performance rapportage",
        icon: "summarize",
        fileType: "PDF",
        size: "1,4 MB",
      },
      {
        title: "IT-audit rapport",
        description: "Resultaten van de laatste beveiligingsaudit",
        icon: "summarize",
        fileType: "PDF",
        size: "5,6 MB",
      },
    ],
  },
];

export default function DocumentenPage() {
  const totalDocuments = documentGroups.reduce(
    (sum, g) => sum + g.items.length,
    0
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title text-2xl">Documenten</h1>
        <Badge className="bg-yielder-navy/10 text-yielder-navy">
          {totalDocuments} documenten
        </Badge>
      </div>

      <div className="space-y-6">
        {documentGroups.map((group) => (
          <div key={group.category}>
            <div className="flex items-center gap-2 mb-3">
              <MaterialIcon
                name={group.categoryIcon}
                className="text-yielder-navy"
                size={20}
              />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                {group.category}
              </h2>
              <span className="text-xs text-muted-foreground">
                ({group.items.length})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map((doc) => (
                <div
                  key={doc.title}
                  className="bg-card rounded-2xl p-5 shadow-card border border-border
                    hover:shadow-card-hover hover:border-yielder-navy/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-xl bg-yielder-navy/[0.06] flex items-center justify-center shrink-0 group-hover:bg-yielder-navy/10 transition-colors">
                      <MaterialIcon
                        name={doc.icon}
                        className="text-yielder-navy"
                        size={20}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-foreground truncate">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {doc.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0">
                          {doc.fileType}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {doc.size}
                        </span>
                      </div>
                    </div>
                    <MaterialIcon
                      name="download"
                      className="text-muted-foreground group-hover:text-yielder-navy transition-colors shrink-0"
                      size={18}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
