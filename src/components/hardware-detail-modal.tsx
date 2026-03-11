"use client";

import { useState } from "react";
import { MaterialIcon } from "./icon";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { HardwareAsset } from "@/types/database";

interface HardwareDetailModalProps {
  asset: HardwareAsset;
  warrantyClassName: string;
  warrantyText: string;
  children: React.ReactNode;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type DetailRowProps = {
  icon: string;
  label: string;
  value: string | null;
};

function DetailRow({ icon, label, value }: DetailRowProps) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <MaterialIcon
        name={icon}
        size={18}
        className="text-yielder-navy/50 mt-0.5 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm text-slate-700 mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

export function HardwareDetailModal({
  asset,
  warrantyClassName,
  warrantyText,
  children,
}: HardwareDetailModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="w-full text-left cursor-pointer"
        render={<div />}
      >
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MaterialIcon name="memory" size={20} className="text-yielder-navy" />
            {asset.name}
          </DialogTitle>
          {(asset.manufacturer || asset.model) && (
            <DialogDescription>
              {[asset.manufacturer, asset.model].filter(Boolean).join(" ")}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="divide-y divide-slate-100">
          {/* Device info */}
          <div className="pb-3">
            <h4 className="text-xs font-semibold text-yielder-navy/70 uppercase tracking-wider mb-1">
              Apparaat
            </h4>
            <DetailRow icon="category" label="Type" value={asset.type} />
            <DetailRow icon="business" label="Fabrikant" value={asset.manufacturer} />
            <DetailRow icon="devices" label="Model" value={asset.model} />
            <DetailRow icon="tag" label="Serienummer" value={asset.serial_number} />
          </div>

          {/* Assignment */}
          <div className="py-3">
            <h4 className="text-xs font-semibold text-yielder-navy/70 uppercase tracking-wider mb-1">
              Toewijzing
            </h4>
            <DetailRow icon="person" label="Toegewezen aan" value={asset.assigned_to} />
            {!asset.assigned_to && (
              <p className="text-xs text-slate-400 italic py-2">Niet toegewezen</p>
            )}
          </div>

          {/* Warranty */}
          <div className="pt-3">
            <h4 className="text-xs font-semibold text-yielder-navy/70 uppercase tracking-wider mb-2">
              Garantie
            </h4>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={warrantyClassName}>{warrantyText}</Badge>
            </div>
            {asset.warranty_expiry && (
              <DetailRow
                icon="event"
                label="Garantiedatum"
                value={formatDate(asset.warranty_expiry)}
              />
            )}
          </div>

          {/* Metadata */}
          <div className="pt-3">
            <h4 className="text-xs font-semibold text-yielder-navy/70 uppercase tracking-wider mb-1">
              Systeem
            </h4>
            <DetailRow icon="schedule" label="Aangemaakt" value={formatDate(asset.created_at)} />
            <DetailRow icon="update" label="Laatst bijgewerkt" value={formatDate(asset.updated_at)} />
            {asset.cw_config_id && (
              <DetailRow icon="link" label="ConnectWise ID" value={String(asset.cw_config_id)} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
