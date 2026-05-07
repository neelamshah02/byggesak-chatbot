import type { AreaRegulation } from "./area-regulations";

export interface ApplicationGuide {
  id: "dispensasjon" | "soknad" | "nabovarsel";
  title: string;
  triggerKeywords: string[];
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
    triggerKeywords: [
      "nærmere enn",
      "for nær",
      "for nærme",
      "overstiger",
      "overskrider",
      "dispensasjon",
      "dispensere",
    ],
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
    triggerKeywords: [
      "søke",
      "søknad",
      "tilbygg",
      "påbygg",
      "rom for varig opphold",
      "soverom",
      "stue",
      "kjøkken",
      "boenhet",
      "hybel",
      "leilighet",
      "garasje",
    ],
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
    triggerKeywords: [],
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
