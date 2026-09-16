import { defineAction, ActionError } from 'astro:actions';
import { Resend } from 'resend';

function buildEmailBody(payload: Record<string, unknown>): string {
  const lines: string[] = [];
  const labels: Record<string, string> = {
    formSource: 'Zdroj formuláře',
    jmeno: 'Jméno',
    telefon: 'Telefon',
    phone: 'Telefon',
    email: 'E-mail',
    vzkaz: 'Vzkaz',
    userType: 'Jsem',
    selectedService: 'Mám zájem o',
    hlavni_volba: 'Hlavní volba služby',
    marketing_balicek: 'Balíček marketingu',
    typ_nemovitosti: 'Typ nemovitosti',
    dispozice: 'Dispozice',
    stav: 'Stav',
    lokalita: 'Lokalita',
    termin: 'Termín prodeje',
    odkaz: 'Odkaz na podklady',
    souhlas: 'Souhlas',
  };
  const formLabels: Record<string, string> = {
    contact: 'Poptávkový formulář',
    meeting: 'Domluvit schůzku',
    newsletter: 'Newsletter – přihlášení k odběru',
    callback: 'Zanechat kontakt – ozveme se vám',
  };
  const formSourceLabel = formLabels[String(payload.formSource ?? '')] ?? 'Formulář z webu';
  lines.push(`Formulář: ${formSourceLabel}`);
  lines.push('');
  for (const [key, value] of Object.entries(payload)) {
    if (key === 'formSource' || value === undefined || value === null || value === '') continue;
    const label = labels[key] ?? key;
    lines.push(`${label}: ${String(value).trim()}`);
  }
  return lines.join('\n');
}

export const server = {
  sendContactForm: defineAction({
    accept: 'json',
    handler: async (input: Record<string, unknown>) => {
      const formSource = String(input?.formSource ?? '').trim();
      const jmeno = String(input?.jmeno ?? '').trim();
      const telefon = String(input?.telefon ?? '').trim();
      const email = String(input?.email ?? '').trim();
      const phone = String(input?.phone ?? '').trim();
      if (formSource === 'newsletter') {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new ActionError({ code: 'BAD_REQUEST', message: 'Zadejte platný e-mail.' });
        }
      } else if (formSource === 'callback') {
        const p = phone.replace(/\s/g, '');
        if (p.length < 9 || !/^[0-9+]/.test(p)) {
          throw new ActionError({ code: 'BAD_REQUEST', message: 'Zadejte platné telefonní číslo.' });
        }
      } else if (!jmeno || !telefon || !email) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'Vyplňte jméno, telefon a e-mail.',
        });
      }
      const apiKey = import.meta.env.RESEND_API_KEY;
      if (!apiKey) {
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Chybí konfigurace e-mailu (RESEND_API_KEY).',
        });
      }
      const body = buildEmailBody(input as Record<string, unknown>);
      const resend = new Resend(apiKey);
      const replyTo = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : 'info@reamar.cz';
      const { data, error } = await resend.emails.send({
        from: 'REAMAR <partners@reamar.group>',
        to: 'info@reamar.cz',
        reply_to: replyTo,
        subject: 'Nová poptávka z webu REAMAR',
        text: body,
        html: '<pre style="font-family:sans-serif;white-space:pre-wrap;">' + body.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>',
      });
      if (error) {
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message ?? 'Nepodařilo se odeslat e-mail.',
        });
      }
      return { success: true, id: data?.id };
    },
  }),
};
