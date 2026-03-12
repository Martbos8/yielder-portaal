import { portalMetadata } from "@/lib/metadata";

export const metadata = portalMetadata("/contact");

import { getContacts, getCachedUserCompany, getCachedUserCompanyId } from "@/lib/repositories";
import { MaterialIcon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import ContactForm from "./contact-form";

const yielderTeam = [
  {
    name: "Jeroen de Vries",
    role: "Account Manager",
    email: "jeroen@yielder.nl",
    phone: "+31 20 123 4567",
    icon: "person",
  },
  {
    name: "Lisa van der Berg",
    role: "Service Desk Lead",
    email: "servicedesk@yielder.nl",
    phone: "+31 20 123 4568",
    icon: "headset_mic",
  },
  {
    name: "Mark Jansen",
    role: "Technisch Consultant",
    email: "mark@yielder.nl",
    phone: "+31 20 123 4569",
    icon: "engineering",
  },
  {
    name: "Sophie Bakker",
    role: "Projectmanager",
    email: "sophie@yielder.nl",
    phone: "+31 20 123 4570",
    icon: "manage_accounts",
  },
];

export default async function ContactPage() {
  const [contacts, company, companyId] = await Promise.all([
    getContacts(),
    getCachedUserCompany(),
    getCachedUserCompanyId(),
  ]);

  return (
    <div>
      <h1 className="section-title text-2xl mb-6">Contact</h1>

      {/* Yielder team */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
          Uw Yielder-team
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {yielderTeam.map((member) => (
            <div
              key={member.name}
              className="bg-card rounded-2xl p-5 shadow-card border border-border hover:shadow-card-hover transition-all"
            >
              <div className="flex flex-col items-center text-center">
                <div className="size-14 rounded-full bg-yielder-navy/10 flex items-center justify-center mb-3">
                  <MaterialIcon
                    name={member.icon}
                    className="text-yielder-navy"
                    size={28}
                  />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  {member.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {member.role}
                </p>
                <div className="mt-3 space-y-1 w-full">
                  <a
                    href={`mailto:${member.email}`}
                    className="flex items-center gap-2 text-xs text-yielder-navy hover:text-yielder-orange transition-colors justify-center"
                  >
                    <MaterialIcon name="email" size={14} />
                    <span className="truncate">{member.email}</span>
                  </a>
                  <a
                    href={`tel:${member.phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-2 text-xs text-yielder-navy hover:text-yielder-orange transition-colors justify-center"
                  >
                    <MaterialIcon name="phone" size={14} />
                    <span>{member.phone}</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Company contacts from DB */}
      {contacts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Contactpersonen {company?.name ?? ""}
            </h2>
            <Badge className="bg-yielder-navy/10 text-yielder-navy">
              {contacts.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-card rounded-2xl p-4 shadow-card border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <MaterialIcon
                      name="person"
                      className="text-slate-500"
                      size={20}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {contact.full_name}
                    </p>
                    {contact.role && (
                      <p className="text-xs text-muted-foreground">
                        {contact.role}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-xs text-yielder-navy hover:text-yielder-orange transition-colors"
                        >
                          {contact.email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact form */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Stuur ons een bericht
        </h2>
        {companyId && <ContactForm companyId={companyId} />}
      </div>
    </div>
  );
}
