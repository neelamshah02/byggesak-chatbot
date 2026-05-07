# Application Guides Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add conflict detection + application guides (dispensasjon, søknad, nabovarsel) to the chatbot, surfaced inline when relevant and as a persistent footer CTA.

**Architecture:** New `src/lib/application-guides.ts` defines three guide objects with trigger keywords, document checklists, and portal links. `chat-service.ts` gains a `detectConflicts()` function that matches query text against conflict signals and appends formatted guide blocks + footer to every regulation response. No new dependencies, no backend changes.

**Tech Stack:** TypeScript, Next.js 14, existing `react-markdown` (already renders `<details>`/`<summary>`)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/application-guides.ts` | CREATE | Guide data, `findApplicableGuides()`, `formatGuides()`, `formatFooterCTA()` |
| `src/lib/chat-service.ts` | MODIFY | Import guides, call `findApplicableGuides()`, inject into response |
| `src/app/api/chat/route.ts` | MODIFY | Same injection for server-side route (mirrors chat-service changes) |

---

## Task 1: Create `application-guides.ts` — data + types

**Files:**
- Create: `src/lib/application-guides.ts`

- [ ] **Step 1: Create the file with types and guide data**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/application-guides.ts
git commit -m "feat: add application guides data and types"
```

---

## Task 2: Add `findApplicableGuides()` and `formatGuides()` to `application-guides.ts`

**Files:**
- Modify: `src/lib/application-guides.ts`

- [ ] **Step 1: Append the two exported functions to the file**

```typescript
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
    const maxBYA = parseFloat(areaReg.regulations.maxBYA) / 100;
    const plotMatch = lower.match(/tomt(?:en)?\s+(?:er|på)\s+(\d+)\s*m/);
    const newMatch = lower.match(/(?:bygge|tilbygg|garasje)\s+(?:på\s+)?(\d+)\s*m/);
    const existingMatch = lower.match(/(?:huset|boligen|eksisterende)\s+(?:er|på)\s+(\d+)\s*m/);
    if (plotMatch && newMatch && existingMatch) {
      const plotSize = parseInt(plotMatch[1]);
      const newSize = parseInt(newMatch[1]);
      const existingSize = parseInt(existingMatch[1]);
      if ((newSize + existingSize) / plotSize > maxBYA) {
        triggered.add("dispensasjon");
      }
    }
  }

  // Søknad: size > 15m²
  const sizeMatch = lower.match(/(\d+)\s*m(?:²|2|\s*kvm)/);
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

  const konfliktGuide = guides.find((g) => g.id === "dispensasjon");
  let output = "";

  if (konfliktGuide) {
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

export function formatFooterCTA(kommune?: string): string {
  const stavSoknad = "https://www.stavanger.kommune.no/byggesak/soknad/";
  const sandSoknad = "https://www.sandnes.kommune.no/tjenester/byggesak/soknad/";
  const stavDisp = "https://www.stavanger.kommune.no/byggesak/dispensasjon/";
  const sandDisp = "https://www.sandnes.kommune.no/tjenester/byggesak/dispensasjon/";
  const nabovarsel = "https://dibk.no/globalassets/skjema/5154.pdf";

  const soknadLink =
    kommune?.toLowerCase() === "sandnes" ? sandSoknad : stavSoknad;
  const dispLink =
    kommune?.toLowerCase() === "sandnes" ? sandDisp : stavDisp;

  return (
    `\n\n---\n` +
    `**Må du søke?** → [Stavanger](${stavSoknad}) · [Sandnes](${sandSoknad})\n` +
    `**Trenger dispensasjon?** → [Stavanger](${stavDisp}) · [Sandnes](${sandDisp})\n` +
    `**Nabovarsel først?** → [Last ned blankett 5154](${nabovarsel})`
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/application-guides.ts
git commit -m "feat: add findApplicableGuides, formatGuides, formatFooterCTA"
```

---

## Task 3: Wire guides into `chat-service.ts`

**Files:**
- Modify: `src/lib/chat-service.ts`

- [ ] **Step 1: Add import at top of file (after existing imports)**

In `src/lib/chat-service.ts`, after the existing import block (line 16), add:

```typescript
import {
  findApplicableGuides,
  formatGuides,
  formatFooterCTA,
} from "./application-guides";
```

- [ ] **Step 2: Inject guides in the address-found branch**

Replace the section in `generateChatResponse` starting from `// Add relevant general regulations` down to `return response;` inside the `if (addresses.length > 0)` block. The current code is at lines 51–76. Replace with:

```typescript
        // Add relevant general regulations
        const regs = findRelevantRegulations(lastMessage);
        if (regs.length > 0) {
          response += "---\n\n**Generelle byggeregler som også gjelder:**\n\n";
          response += formatRegulations(regs);
        } else {
          response += `
**Hva vil du vite mer om?**
- Hva du kan bygge uten å søke
- Tilbygg og påbygg
- Garasje eller bod
- Terrasse og platting
- Gjerde og levegg
- Søknadsprosessen
          `;
        }

        // Detect conflicts and inject application guides
        const guides = findApplicableGuides(lastMessage, areaReg ?? undefined);
        if (guides.length > 0) {
          response += formatGuides(guides, address.kommunenavn);
        }

        // Always append footer CTA
        response +=
          "\n\n---\n\n" +
          getRegulationLookupLinks(
            address.kommunenavn,
            address.gardsnummer,
            address.bruksnummer,
          );
        response += formatFooterCTA(address.kommunenavn);

        return response;
```

- [ ] **Step 3: Inject footer CTA into question-based responses**

At the end of `generateChatResponse`, the function returns a default response string. Wrap each keyword-matched `return` that returns a multi-line string so it appends the footer. Replace the `søke`/`søknad` branch (lines 147–177) with:

```typescript
  if (
    lowercaseMessage.includes("søke") ||
    lowercaseMessage.includes("søknad")
  ) {
    return `
**Søknadsprosessen for byggesaker:**

**1. Sjekk om tiltaket er søknadspliktig**
Mange mindre tiltak kan gjøres uten å søke. Se oversikten over hva du kan bygge uten søknad.

**2. Velg riktig søknadstype**
- **Uten ansvarsrett:** Du søker selv og tar ansvar for at reglene følges
- **Med ansvarsrett:** Et ansvarlig foretak søker for deg

**3. Forbered søknaden**
Du trenger vanligvis:
- Situasjonskart (kan lastes ned fra kommunens kartportal)
- Tegninger (plan, snitt, fasader)
- Nabovarsling
- Eventuell dispensasjonssøknad

**4. Send inn søknad**
- Stavanger: [Søk digitalt via eByggesøk](https://www.stavanger.kommune.no/byggesak/soknad/)
- Sandnes: [Søk digitalt via eByggesøk](https://www.sandnes.kommune.no/tjenester/byggesak/soknad/)

**Behandlingstid:**
- 3 uker for enkle tiltak
- 12 uker for mer komplekse saker

**Skriv inn adressen din for å få mer spesifikk informasjon om hva som gjelder for din eiendom.**
${formatFooterCTA()}
    `;
  }
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/chat-service.ts
git commit -m "feat: inject application guides and footer CTA into chat responses"
```

---

## Task 4: Mirror changes in `src/app/api/chat/route.ts`

**Files:**
- Modify: `src/app/api/chat/route.ts`

- [ ] **Step 1: Add import**

In `src/app/api/chat/route.ts`, after the existing imports (line 12), add:

```typescript
import {
  findApplicableGuides,
  formatGuides,
  formatFooterCTA,
} from "@/lib/application-guides";
```

- [ ] **Step 2: Inject guides in `generateResponse()`**

The `generateResponse` function builds response in the `if (context.addressInfo)` branch. After the block that adds general regulations (lines 44–57) and before the `if (context.lookupLinks)` block (line 61), add:

```typescript
    // Detect conflicts and inject application guides
    if (context.guides) {
      response += context.guides;
    }
```

- [ ] **Step 3: Add `guides` and `footerCTA` to context type and population**

Replace the `context` type declaration in `POST` (lines 180–186):

```typescript
    let context: {
      addressInfo?: string;
      areaInfo?: string;
      lookupLinks?: string;
      regulations?: string;
      guides?: string;
      footerCTA?: string;
    } = {};
```

After the `context.lookupLinks` assignment (line 207–211), add:

```typescript
          // Detect conflicts and build guides
          const guides = findApplicableGuides(lastMessage, areaReg ?? undefined);
          if (guides.length > 0) {
            context.guides = formatGuides(guides, address.kommunenavn);
          }
          context.footerCTA = formatFooterCTA(address.kommunenavn);
```

Then in `generateResponse`, after the `if (context.lookupLinks)` block, add:

```typescript
    if (context.footerCTA) {
      response += context.footerCTA;
    }
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat: inject application guides into server-side chat route"
```

---

## Task 5: Manual smoke test

**No automated tests exist in this repo — verify manually.**

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Open `http://localhost:3000`

- [ ] **Step 2: Test — setback conflict**

Type: `Jeg vil bygge garasje 2 meter fra nabogrensen`

Expected:
- Regulation info shown
- `⚠️ Dispensasjon kan være nødvendig` callout visible
- `<details>` block for dispensasjon renders and expands
- Footer CTA with søknad + dispensasjon + nabovarsel links at bottom

- [ ] **Step 3: Test — large extension with habitable room**

Type: `Kan jeg bygge et 30m² tilbygg med soverom?`

Expected:
- Regulation info for tilbygg shown
- No dispensasjon callout (no conflict, just application required)
- `<details>` blocks for søknad + nabovarsel render and expand
- Footer CTA present

- [ ] **Step 4: Test — general question, no conflict**

Type: `Hva er reglene for gjerde mot nabo?`

Expected:
- Gjerde regulation info shown
- No `<details>` guide blocks
- Footer CTA still present at bottom

- [ ] **Step 5: Test — address lookup with conflict**

Type: `Steinstemveien 26, Sandnes — vil bygge 25m² tilbygg med stue`

Expected:
- Property info (gnr/bnr, Sandnes kommune) shown
- Area regulation for Lura shown
- Søknad + nabovarsel guides shown (25m² > 15m², "stue" = varig opphold)
- Sandnes-specific portal links in guides
- Footer CTA with Sandnes links

- [ ] **Step 6: Commit test confirmation**

```bash
git add -p  # stage nothing new, just confirm
git log --oneline -5
```

Verify 4 commits from Tasks 1–4 in history.

---

## Self-Review Checklist

- [x] `formatFooterCTA` defined in Task 2, used in Tasks 3 and 4 — consistent
- [x] `findApplicableGuides` signature `(query: string, areaReg?: AreaRegulation)` — matches usage in Tasks 3 and 4
- [x] `formatGuides` signature `(guides: ApplicationGuide[], kommune?: string)` — matches usage
- [x] `areaReg` in `chat-service.ts` can be `null` (from `findAreaRegulations`) — passed as `areaReg ?? undefined` to avoid type mismatch
- [x] Footer CTA appears in both address path and søknad question path
- [x] Nabovarsel always co-triggers with søknad — enforced in `findApplicableGuides`
- [x] No placeholders or TBDs in any task
