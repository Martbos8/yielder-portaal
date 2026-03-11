"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MaterialIcon } from "@/components/icon";
import { createContactRequest } from "@/lib/actions/contact.actions";
import { getErrorMessage } from "@/lib/errors";

type ContactModalProps = {
  productName?: string;
  productId?: string;
  companyId: string;
  trigger?: React.ReactNode;
  defaultUrgency?: "normaal" | "hoog";
};

export function ContactModal({
  productName,
  productId,
  companyId,
  trigger,
  defaultUrgency = "normaal",
}: ContactModalProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(
    productName ? `Interesse in ${productName}` : ""
  );
  const [message, setMessage] = useState("");
  const [urgency, setUrgency] = useState<"normaal" | "hoog">(defaultUrgency);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!subject.trim()) return;

    setStatus("submitting");
    setErrorMsg("");

    try {
      const result = await createContactRequest({
        companyId,
        subject: subject.trim(),
        message: message.trim() || undefined,
        productId: productId || undefined,
        urgency,
      });

      if (!result.success) {
        setErrorMsg(result.error ?? "Er ging iets mis.");
        setStatus("error");
        return;
      }

      setStatus("success");

      // Reset after showing success
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
        setSubject(productName ? `Interesse in ${productName}` : "");
        setMessage("");
        setUrgency(defaultUrgency);
      }, 2000);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Er ging iets mis. Probeer het opnieuw."));
      setStatus("error");
    }
  }

  const defaultTrigger = (
    <Button className="w-full bg-yielder-navy text-white hover:bg-yielder-navy/90">
      <MaterialIcon name="mail" size={16} className="mr-1.5" />
      Neem contact op met het team
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<span />}>
        {trigger ?? defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {status === "success" ? (
          <div className="py-8 text-center">
            <div className="size-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <MaterialIcon
                name="check_circle"
                className="text-emerald-500"
                size={32}
              />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Verzoek verstuurd
            </h3>
            <p className="text-sm text-muted-foreground">
              Uw verzoek is verstuurd, het team neemt contact op.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Neem contact op met het team</DialogTitle>
              <DialogDescription>
                {productName
                  ? `Vraag over ${productName}. Vul onderstaand formulier in en wij nemen contact op.`
                  : "Vul onderstaand formulier in en wij nemen contact op."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="contact-subject">Onderwerp</Label>
                <Input
                  id="contact-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Waar gaat uw vraag over?"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message">Bericht</Label>
                <Textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Beschrijf uw vraag of wens (optioneel)"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-urgency">Urgentie</Label>
                <select
                  id="contact-urgency"
                  value={urgency}
                  onChange={(e) =>
                    setUrgency(e.target.value as "normaal" | "hoog")
                  }
                  className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="normaal">Normaal</option>
                  <option value="hoog">Hoog</option>
                </select>
              </div>
            </div>

            {status === "error" && (
              <div className="flex items-center gap-2 text-sm text-red-600 mb-4">
                <MaterialIcon name="error" size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <DialogFooter>
              <Button
                type="submit"
                disabled={status === "submitting" || !subject.trim()}
                className="bg-yielder-navy text-white hover:bg-yielder-navy/90"
              >
                {status === "submitting" ? (
                  <>
                    <MaterialIcon
                      name="hourglass_empty"
                      size={16}
                      className="mr-1.5 animate-spin"
                    />
                    Versturen...
                  </>
                ) : (
                  <>
                    <MaterialIcon name="send" size={16} className="mr-1.5" />
                    Versturen
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
