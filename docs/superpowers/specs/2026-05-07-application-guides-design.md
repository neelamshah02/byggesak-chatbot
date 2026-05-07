# Application Guides — Design Spec

**Date:** 2026-05-07  
**Status:** Approved

---

## Problem

The chatbot explains building regulations but gives no guidance on what to do when a project conflicts with those regulations or requires a formal application. Users are left to figure out dispensasjon, søknad, and nabovarsel on their own.

---

## Goal

- Detect when a user's situation triggers dispensasjon, søknad, or nabovarsel requirements
- Surface the right application guide inline (with document checklist + portal links)
- Always show a footer CTA so users can find application links even without a detected conflict

---

## Scope

Three application types:

| Type | Norwegian term | When needed |
|---|---|---|
| Exemption | Dispensasjon | Project conflicts with regulation (BYA, setback, height) |
| Building permit | Søknad | Project over 15m², habitable rooms, new dwelling unit |
| Neighbor notification | Nabovarsel | Required before submitting any søknad |

---

## Architecture

No new dependencies. No backend changes. Runs entirely client-side.

### New file: `src/lib/application-guides.ts`

```typescript
interface ApplicationGuide {
  id: "dispensasjon" | "soknad" | "nabovarsel"
  title: string
  triggerKeywords: string[]
  whenNeeded: string
  documentChecklist: string[]
  portalLinks: {
    stavanger: string
    sandnes: string
  }
  processingTime: string
  tips: string[]
}
```

Three guide objects defined:

**dispensasjon**
- Triggers: BYA exceeded, setback < minimum, height over limit, restricted zone
- Keywords: "nærmere enn", "for nær", "overstiger", "BYA", % values near limits
- Checklist: situasjonskart, dispensasjonsbegrunnelse, tegninger, nabovarsel kvittering
- Links: `stavanger.kommune.no/byggesak/dispensasjon`, `sandnes.kommune.no/byggesak/dispensasjon`
- Processing time: 12 uker

**soknad**
- Triggers: project > 15m², "rom for varig opphold", "boenhet", "hybel", "leilighet", multiple floors
- Checklist: situasjonskart, tegninger (plan/snitt/fasade), nabovarsel, ansvarsrett (if needed)
- Links: eByggesøk Stavanger, eByggesøk Sandnes
- Processing time: 3–12 uker

**nabovarsel**
- Co-triggers with any soknad
- Checklist: nabovarselskjema, situasjonskart, tegninger
- Links: Statsforvalteren mal, kommunalt skjema
- Processing time: 14 dager varslingsfrist

Exported functions:
- `findApplicableGuides(query: string, areaReg?: AreaRegulation): ApplicationGuide[]`
- `formatGuides(guides: ApplicationGuide[], kommune?: string): string` — returns markdown

---

### Modified file: `src/lib/chat-service.ts`

New function `detectConflicts(query, areaReg?)`:

| Conflict | Detection signal | Guide |
|---|---|---|
| BYA exceeded | User mentions size/% + area reg has maxBYA | dispensasjon |
| Setback too small | "nærmere enn X meter", distance < required | dispensasjon |
| Height over limit | Height mentioned > area reg maxHeight | dispensasjon |
| Project > 15m² | Size > 15 or "rom for varig opphold" | søknad + nabovarsel |
| New dwelling | "boenhet", "hybel", "leilighet" | søknad + nabovarsel |
| Søknad triggered | any of above | nabovarsel (always co-triggers) |

Response assembly order:
1. Regulation info (existing)
2. Inline conflict callout (if dispensasjon detected)
3. Application guide blocks (checklist + links)
4. Footer CTA (always present)

---

### Modified file: `src/app/api/chat/route.ts`

Import `findApplicableGuides`, `formatGuides` from `application-guides.ts`. Pass formatted guides into `generateResponse()` context.

---

## UI Rendering

No component changes. All content rendered as markdown via existing `react-markdown`.

**Inline conflict callout:**
```markdown
> ⚠️ **Dispensasjon kan være nødvendig**
> Tiltaket ditt ser ut til å være i konflikt med [regel].
> Du kan søke om dispensasjon — se veiledning nedenfor.
```

**Application guide block** (collapsible):
```markdown
<details>
<summary>📋 Slik søker du om dispensasjon</summary>

**Når trengs dispensasjon?**
...

**Dokumenter du trenger:**
- Situasjonskart
- Begrunnelse for dispensasjon
- Tegninger
- Nabovarsel (kvittering)

**Søk digitalt:**
- [Stavanger: eByggesøk](url)
- [Sandnes: eByggesøk](url)

**Behandlingstid:** 12 uker

</details>
```

**Footer CTA** (appended to every regulation response):
```markdown
---
**Må du søke?** → [Stavanger](url) · [Sandnes](url)
**Trenger dispensasjon?** → [Stavanger](url) · [Sandnes](url)
**Nabovarsel først?** → [Last ned mal](url)
```

---

## File Change Summary

| File | Type | Change |
|---|---|---|
| `src/lib/application-guides.ts` | NEW | 3 guide objects, `findApplicableGuides()`, `formatGuides()` |
| `src/lib/chat-service.ts` | MODIFY | Add `detectConflicts()`, inject guides into response |
| `src/app/api/chat/route.ts` | MODIFY | Import guides, pass to `generateResponse()` |
| `src/lib/regulations.ts` | NO CHANGE | — |
| `src/components/Chat.tsx` | NO CHANGE | — |

**Estimated size:** ~200 lines new code across 3 files.

---

## Demo Examples

### A) Conflict detection — input → guides triggered

**Example 1: Setback conflict**
```
User: "Jeg vil bygge garasje 2 meter fra nabogrensen på Steinstemveien 26, Sandnes"

detectConflicts() sees:
  - "2 meter fra nabogrensen" → setback < 4m required
  - area reg: sandnes-lura active

Guides triggered: [dispensasjon]
Conflict callout: "⚠️ Dispensasjon kan være nødvendig — avstand til nabogrense er 2m, kravet er 4m"
```

**Example 2: Large extension with habitable room**
```
User: "Kan jeg bygge et 30m² tilbygg med soverom?"

detectConflicts() sees:
  - "30m²" → > 15m² threshold
  - "soverom" → rom for varig opphold

Guides triggered: [soknad, nabovarsel]
No conflict callout (no regulation breach, just application required)
```

**Example 3: BYA conflict**
```
User: "Tomten er 400m², jeg vil bygge garasje på 50m² men huset er allerede 120m²"

detectConflicts() sees:
  - area reg maxBYA: 30% → max 120m²
  - existing 120m² + new 50m² = 170m² → exceeds limit

Guides triggered: [dispensasjon]
Conflict callout: "⚠️ Dispensasjon kan være nødvendig — BYA vil bli 42.5%, maks tillatt er 30%"
```

**Example 4: No conflict, just a question**
```
User: "Hva er reglene for gjerde mot nabo?"

detectConflicts() sees: no conflict signals

Guides triggered: []
Footer CTA only — no inline callout, no guide blocks
```

---

### B) Full response output — end-to-end example

**User input:** `"Steinstemveien 26, Sandnes — vil bygge 25m² tilbygg med stue"`

**Full bot response:**

```
📍 **Steinstemveien 26, 4313 Sandnes**
Gnr/Bnr: 62/445 · Sandnes kommune

---

**Gjeldende reguleringsplan: Lura (Kommuneplanens arealdel)**
- Maks BYA: 30%
- Maks gesimshøyde: 8 meter
- Maks etasjer: 2

---

**Generelle byggeregler som gjelder:**

## Større tilbygg (over 15 m²)
Du må søke for tilbygg hvis tilbygget er over 15m² eller inneholder rom for varig opphold...

---

> ⚠️ **Søknad er påkrevd**
> Tilbygg på 25m² med stue (rom for varig opphold) krever byggesøknad og nabovarsel.

---

<details>
<summary>📋 Slik sender du byggesøknad</summary>

**Når trengs søknad?**
Tilbygg over 15m² eller med rom for varig opphold (stue, soverom, kjøkken).

**Dokumenter du trenger:**
- Situasjonskart (last ned fra kommunens kartportal)
- Tegninger — plan, snitt og fasader
- Nabovarsel med kvittering
- Ansvarsrett (hvis ikke selvbygger)

**Søk digitalt:**
- [Stavanger: eByggesøk](https://www.stavanger.kommune.no/byggesak/soknad)
- [Sandnes: eByggesøk](https://www.sandnes.kommune.no/byggesak/soknad)

**Behandlingstid:** 3–12 uker

</details>

<details>
<summary>📬 Nabovarsel — send dette først</summary>

**Nabovarsel må sendes før søknaden.**
Naboene har 14 dagers frist til å protestere.

**Dokumenter som vedlegges nabovarselet:**
- Nabovarselskjema (blankett 5154)
- Situasjonskart
- Tegninger av tiltaket

**Last ned skjema:**
- [Blankett 5154 — Nabovarsel](https://www.dibk.no/globalassets/skjema/5154.pdf)

**Varslingsfrist:** 14 dager

</details>

---
**Må du søke?** → [Stavanger](https://www.stavanger.kommune.no/byggesak/soknad) · [Sandnes](https://www.sandnes.kommune.no/byggesak/soknad)
**Trenger dispensasjon?** → [Stavanger](https://www.stavanger.kommune.no/byggesak/dispensasjon) · [Sandnes](https://www.sandnes.kommune.no/byggesak/dispensasjon)
**Nabovarsel først?** → [Last ned blankett 5154](https://www.dibk.no/globalassets/skjema/5154.pdf)
```

---

## Out of Scope

- Multi-turn wizard / conversational state
- AI-based conflict detection (future LLM upgrade)
- File upload for building plans
- Actual form prefilling
