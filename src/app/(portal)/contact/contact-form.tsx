"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/icon";
import { createContactRequest } from "@/lib/actions/contact.actions";
import { getErrorMessage } from "@/lib/errors";
import { ContactRequestSchema } from "@/lib/schemas";

interface ContactFormProps {
  companyId: string;
}

export default function ContactForm({ companyId }: ContactFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const subject = (formData.get("subject") as string).trim();
    const message = (formData.get("message") as string).trim();

    // Client-side validation with shared schema
    const validation = ContactRequestSchema.safeParse({
      companyId,
      subject,
      message: message || undefined,
      urgency: "normaal",
    });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const path = issue.path.join(".");
        errors[path] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setStatus("submitting");

    try {
      const result = await createContactRequest({
        companyId,
        subject,
        message: message || undefined,
        urgency: "normaal",
      });

      if (!result.success) {
        setErrorMsg(result.error ?? "Er ging iets mis.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Er ging iets mis. Probeer het opnieuw."));
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <MaterialIcon
          name="check_circle"
          className="text-emerald-500 mb-2"
          size={40}
        />
        <p className="text-sm font-medium text-foreground">
          Bedankt voor uw bericht!
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          We nemen zo snel mogelijk contact met u op.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-4 text-xs text-yielder-navy hover:text-yielder-orange transition-colors font-medium"
        >
          Nog een bericht versturen
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="contact-subject"
          className="block text-xs font-medium text-muted-foreground mb-1"
        >
          Onderwerp
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          required
          aria-invalid={!!fieldErrors["subject"]}
          className={`w-full rounded-lg border bg-background px-3 py-2 text-sm
            focus:outline-none focus:ring-2 focus:ring-yielder-navy/20 focus:border-yielder-navy
            transition-colors ${fieldErrors["subject"] ? "border-red-500" : "border-border"}`}
          placeholder="Waar gaat het over?"
        />
        {fieldErrors["subject"] && (
          <p className="text-xs text-red-600 mt-1">{fieldErrors["subject"]}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="contact-message"
          className="block text-xs font-medium text-muted-foreground mb-1"
        >
          Bericht
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={4}
          aria-invalid={!!fieldErrors["message"]}
          className={`w-full rounded-lg border bg-background px-3 py-2 text-sm
            focus:outline-none focus:ring-2 focus:ring-yielder-navy/20 focus:border-yielder-navy
            transition-colors resize-none ${fieldErrors["message"] ? "border-red-500" : "border-border"}`}
          placeholder="Typ uw bericht..."
        />
        {fieldErrors["message"] && (
          <p className="text-xs text-red-600 mt-1">{fieldErrors["message"]}</p>
        )}
      </div>

      {status === "error" && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <MaterialIcon name="error" size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
          bg-yielder-navy text-white text-sm font-medium
          hover:bg-yielder-navy/90 transition-colors disabled:opacity-60"
      >
        {status === "submitting" ? (
          <>
            <MaterialIcon name="hourglass_empty" size={16} className="animate-spin" />
            Versturen...
          </>
        ) : (
          <>
            <MaterialIcon name="send" size={16} />
            Versturen
          </>
        )}
      </button>
    </form>
  );
}
