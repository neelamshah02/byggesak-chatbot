/**
 * Application guide data for dispensasjon, søknad, and nabovarsel.
 * Used by findApplicableGuides() to surface relevant guides in chat responses.
 */
import type { AreaRegulation } from "./area-regulations";

export interface ApplicationGuide {
  id: "dispensasjon" | "soknad" | "nabovarsel";
  title: string;
  whenNeeded: string;
  documentChecklist: string[];
  portalLinks: {
    stavanger: string;
    sandnes: string;
  };
  processingTime: string;
  tips: string[];
}

export const applicationGuides: ApplicationGuide[] = [
  {
    id: "dispensasjon",
    title: "Søk om dispensasjon",
    whenNeeded:
      "Dispensasjon trengs når tiltaket ditt er i konflikt med gjeldende reguleringsplan eller byggeregler — for eksempel for nær nabogrense, for høyt, eller BYA-grensen er overskredet.",
    documentChecklist: [
      "Situasjonskart (last ned fra kommunens kartportal)",
      "Begrunnelse for dispensasjon (hvorfor bør det gjøres unntak?)",
      "Tegninger — plan, snitt og fasader",
      "Nabovarsel med kvittering (naboene må varsles først)",
      "Eventuell uttalelse fra andre myndigheter (f.eks. Statsforvalteren)",
    ],
    portalLinks: {
      stavanger:
        "https://www.stavanger.kommune.no/byggesak/dispensasjon/",
      sandnes:
        "https://www.sandnes.kommune.no/tjenester/byggesak/dispensasjon/",
    },
    processingTime: "Inntil 12 uker",
    tips: [
      "Begrunn dispensasjonssøknaden konkret — generelle ønsker godtas sjelden",
      "Nabovarsel må sendes og fristen (14 dager) må være utløpt før du søker",
      "Kontakt kommunen på forhånd for en uformell vurdering",
    ],
  },
  {
    id: "soknad",
    title: "Send byggesøknad",
    whenNeeded:
      "Byggesøknad trengs for tilbygg over 15 m², prosjekter som inneholder rom for varig opphold (stue, soverom, kjøkken), nye boenheter, eller andre større tiltak.",
    documentChecklist: [
      "Situasjonskart (last ned fra kommunens kartportal)",
      "Tegninger — plan, snitt og fasader i målestokk",
      "Nabovarsel med kvittering (minst 14 dager før innsending)",
      "Ansvarsrett (erklæring fra ansvarlig foretak, hvis ikke selvbygger)",
      "Eventuell dispensasjonssøknad (hvis tiltaket avviker fra planen)",
    ],
    portalLinks: {
      stavanger: "https://www.stavanger.kommune.no/byggesak/soknad/",
      sandnes: "https://www.sandnes.kommune.no/tjenester/byggesak/soknad/",
    },
    processingTime: "3 uker (enkle tiltak) — 12 uker (komplekse saker)",
    tips: [
      "Bruk eByggesøk for digital innsending",
      "Sjekk reguleringsplanen før du tegner — det sparer tid",
      "Selvbyggere kan søke uten ansvarsrett for enklere tiltak",
    ],
  },
  {
    id: "nabovarsel",
    title: "Send nabovarsel først",
    whenNeeded:
      "Nabovarsel må sendes til alle naboer og gjenboere før du sender byggesøknad. Naboene har 14 dagers frist til å komme med merknader.",
    documentChecklist: [
      "Nabovarselskjema — blankett 5154 (last ned fra Direktoratet for byggkvalitet)",
      "Situasjonskart med tiltaket inntegnet",
      "Tegninger av tiltaket (samme som vedlegges søknaden)",
    ],
    portalLinks: {
      stavanger: "https://dibk.no/globalassets/skjema/5154.pdf",
      sandnes: "https://dibk.no/globalassets/skjema/5154.pdf",
    },
    processingTime: "14 dagers varslingsfrist",
    tips: [
      "Send nabovarsel rekommandert eller lever personlig — ta vare på kvittering",
      "Nabomerknader må besvares i søknaden",
      "Nabovarsel gjelder i 1 år — send ny hvis søknaden tar lengre tid",
    ],
  },
];

export function findApplicableGuides(
  query: string,
  areaReg?: AreaRegulation,
): ApplicationGuide[] {
  const lower = query.toLowerCase();
  const triggered = new Set<ApplicationGuide["id"]>();

  // Dispensasjon: explicit conflict keywords
  const dispensasjonKeywords = [
    "nærmere enn",
    "for nær",
    "for nærme",
    "overstiger",
    "overskrider",
    "dispensasjon",
    "dispensere",
  ];
  if (dispensasjonKeywords.some((kw) => lower.includes(kw))) {
    triggered.add("dispensasjon");
  }

  // Dispensasjon: numeric setback conflict (e.g. "2 meter fra nabo")
  const setbackMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*m(?:eter)?\s+fra\s+nabo/);
  if (setbackMatch) {
    const distance = parseFloat(setbackMatch[1].replace(",", "."));
    if (distance < 4) triggered.add("dispensasjon");
  }

  // Dispensasjon: BYA conflict — user provides plot + building sizes
  if (areaReg?.regulations.maxBYA) {
    const bya = areaReg.regulations.maxBYA;
    const byaUpper = /(\d+)%\s*$/.exec(bya);
    const maxBYA = byaUpper ? parseFloat(byaUpper[1]) / 100 : parseFloat(bya) / 100;
    const plotMatch = lower.match(/tomt(?:en)?\s+(?:er|på)\s+(\d+)\s*m/);
    const newMatch = lower.match(/(?:bygge|tilbygg|garasje)\s+(?:på\s+)?(\d+)\s*m/);
    const existingMatch = lower.match(/(?:huset|boligen|eksisterende)\s+(?:er|på)\s+(\d+)\s*m/);
    if (plotMatch && newMatch && existingMatch) {
      const plotSize = parseInt(plotMatch[1], 10);
      const newSize = parseInt(newMatch[1], 10);
      const existingSize = parseInt(existingMatch[1], 10);
      if ((newSize + existingSize) / plotSize > maxBYA) {
        triggered.add("dispensasjon");
      }
    }
  }

  // Søknad: size > 15m²
  const sizeMatch = lower.match(/(\d+)\s*(?:m(?:²|2)|kvm)/);
  if (sizeMatch && parseInt(sizeMatch[1]) > 15) {
    triggered.add("soknad");
  }

  // Søknad: habitable room or dwelling keywords
  const soknadKeywords = [
    "rom for varig opphold",
    "soverom",
    "stue",
    "kjøkken",
    "boenhet",
    "hybel",
    "leilighet",
    "garasje",
  ];
  if (soknadKeywords.some((kw) => lower.includes(kw))) {
    triggered.add("soknad");
  }

  // Nabovarsel always co-triggers with søknad
  if (triggered.has("soknad")) {
    triggered.add("nabovarsel");
  }

  return applicationGuides.filter((g) => triggered.has(g.id));
}

export function formatGuides(
  guides: ApplicationGuide[],
  kommune?: string,
): string {
  if (guides.length === 0) return "";

  const hasDispensasjon = guides.some((g) => g.id === "dispensasjon");
  let output = "";

  if (hasDispensasjon) {
    output += `\n\n> ⚠️ **Dispensasjon kan være nødvendig**\n> Tiltaket ditt ser ut til å være i konflikt med gjeldende regler. Du kan søke om dispensasjon — se veiledning nedenfor.\n`;
  }

  for (const guide of guides) {
    const link =
      kommune?.toLowerCase() === "sandnes"
        ? guide.portalLinks.sandnes
        : guide.portalLinks.stavanger;

    const icon =
      guide.id === "dispensasjon"
        ? "⚖️"
        : guide.id === "nabovarsel"
          ? "📬"
          : "📋";

    output += `\n\n<details>\n<summary>${icon} ${guide.title}</summary>\n\n`;
    output += `**Når trengs dette?**\n${guide.whenNeeded}\n\n`;
    output += `**Dokumenter du trenger:**\n`;
    for (const item of guide.documentChecklist) {
      output += `- ${item}\n`;
    }
    output += `\n**Søk/last ned:**\n- [Gå til skjema / portal](${link})\n\n`;
    output += `**Behandlingstid:** ${guide.processingTime}\n\n`;
    if (guide.tips.length > 0) {
      output += `**Tips:**\n`;
      for (const tip of guide.tips) {
        output += `- ${tip}\n`;
      }
    }
    output += `\n</details>`;
  }

  return output;
}

export function formatFooterCTA(): string {
  const stavSoknad = "https://www.stavanger.kommune.no/byggesak/soknad/";
  const sandSoknad = "https://www.sandnes.kommune.no/tjenester/byggesak/soknad/";
  const stavDisp = "https://www.stavanger.kommune.no/byggesak/dispensasjon/";
  const sandDisp = "https://www.sandnes.kommune.no/tjenester/byggesak/dispensasjon/";
  const nabovarsel = "https://dibk.no/globalassets/skjema/5154.pdf";

  return (
    `\n\n---\n` +
    `**Må du søke?** → [Stavanger](${stavSoknad}) · [Sandnes](${sandSoknad})\n` +
    `**Trenger dispensasjon?** → [Stavanger](${stavDisp}) · [Sandnes](${sandDisp})\n` +
    `**Nabovarsel først?** → [Last ned blankett 5154](${nabovarsel})`
  );
}
