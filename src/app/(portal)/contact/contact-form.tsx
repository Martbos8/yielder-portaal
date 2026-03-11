"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/icon";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
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
          onClick={() => setSubmitted(false)}
          className="mt-4 text-xs text-yielder-navy hover:text-yielder-orange transition-colors font-medium"
        >
          Nog een bericht versturen
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="contact-name"
            className="block text-xs font-medium text-muted-foreground mb-1"
          >
            Naam
          </label>
          <input
            id="contact-name"
            type="text"
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-yielder-navy/20 focus:border-yielder-navy
              transition-colors"
            placeholder="Uw naam"
          />
        </div>
        <div>
          <label
            htmlFor="contact-email"
            className="block text-xs font-medium text-muted-foreground mb-1"
          >
            E-mail
          </label>
          <input
            id="contact-email"
            type="email"
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-yielder-navy/20 focus:border-yielder-navy
              transition-colors"
            placeholder="uw@email.nl"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="contact-subject"
          className="block text-xs font-medium text-muted-foreground mb-1"
        >
          Onderwerp
        </label>
        <input
          id="contact-subject"
          type="text"
          required
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm
            focus:outline-none focus:ring-2 focus:ring-yielder-navy/20 focus:border-yielder-navy
            transition-colors"
          placeholder="Waar gaat het over?"
        />
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
          required
          rows={4}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm
            focus:outline-none focus:ring-2 focus:ring-yielder-navy/20 focus:border-yielder-navy
            transition-colors resize-none"
          placeholder="Typ uw bericht..."
        />
      </div>
      <button
        type="submit"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
          bg-yielder-navy text-white text-sm font-medium
          hover:bg-yielder-navy/90 transition-colors"
      >
        <MaterialIcon name="send" size={16} />
        Versturen
      </button>
    </form>
  );
}
