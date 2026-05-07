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

## Out of Scope

- Multi-turn wizard / conversational state
- AI-based conflict detection (future LLM upgrade)
- File upload for building plans
- Actual form prefilling
