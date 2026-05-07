# Byggesak Chatbot 🏠

A chatbot that helps residents of **Stavanger** and **Sandnes** (Norway) understand building regulations for their property. Type an address or a question — get plain-language answers with links to official sources.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![MCP](https://img.shields.io/badge/MCP-1.0-green)

## What It Does

- **Address lookup** — type your address, get property-specific regulations (gnr/bnr, area plan, BYA%, height limits)
- **Conflict detection** — if your project conflicts with regulations, the bot flags it and shows what to apply for
- **Application guides** — step-by-step checklists for dispensasjon (exemption), byggesøknad (permit), and nabovarsel (neighbour notification)
- **General questions** — ask about rules for garages, extensions, fences, terraces without an address
- **Direct links** — every response includes links to the relevant municipal portal and official forms

## Sample Questions

**Address lookup:**
```
Steinstemveien 26, Sandnes
```
```
Lagårdsveien 12, Stavanger
```
```
Steinstemveien 26 Sandnes. Hva kan jeg bygge uten å søke?
```

**Conflict detection (triggers application guides):**
```
Jeg vil bygge garasje 2 meter fra nabogrensen
```
```
Kan jeg bygge et 30m² tilbygg med soverom?
```
```
Tomten er 400m², huset er 120m², vil bygge garasje på 50m²
```
```
Jeg vil bygge hybel i kjelleren
```

**General building questions:**
```
Hva kan jeg bygge uten å søke?
```
```
Regler for terrasse og platting
```
```
Hva er BYA?
```
```
Gjerde mot nabo — hva er reglene?
```
```
Søknadsprosessen — hvordan søker jeg?
```

## How the Bot Responds

| Input | Response |
|---|---|
| Address only | Property info + area plan + regulations for that property |
| Address + question | Property info + relevant rules + conflict detection |
| Size > 15m² or habitable room mentioned | Søknad + nabovarsel guide with checklist |
| Setback < 4m or BYA exceeded | Dispensasjon guide with checklist |
| General question | Relevant regulation category + portal links |
| All responses | Footer with quick links to søknad/dispensasjon portals |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Optional: AI backend

Copy `.env.local.example` to `.env.local` and add an API key for LLM-powered responses:

```bash
cp .env.local.example .env.local
# Add ANTHROPIC_API_KEY or OPENAI_API_KEY
```

## Project Structure

```
byggesak-chatbot/
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts       # Server-side chat endpoint
│   │   └── page.tsx                # Main page
│   ├── components/
│   │   ├── Chat.tsx                # Chat UI
│   │   └── Header.tsx              # Header
│   └── lib/
│       ├── kartverket.ts           # Kartverket address API + extraction
│       ├── regulations.ts          # General building regulations (8 categories)
│       ├── area-regulations.ts     # Area-specific rules (9 neighbourhoods)
│       ├── application-guides.ts   # Dispensasjon/søknad/nabovarsel guides
│       └── chat-service.ts         # Client-side orchestration
├── mcp-server/
│   └── index.ts                    # MCP server for GitHub Copilot
└── package.json
```

## MCP Server (GitHub Copilot Integration)

Add to VS Code `mcp.json`:

```json
{
  "mcpServers": {
    "byggesak": {
      "command": "npx",
      "args": ["ts-node", "--esm", "mcp-server/index.ts"],
      "cwd": "/path/to/byggesak-chatbot"
    }
  }
}
```

Available tools: `search_address`, `get_building_regulations`, `check_building_allowed`, `explain_regulation`

## Coverage

**Municipalities:** Stavanger (1103), Sandnes (1108)

**General regulation categories:** detached buildings ≤50m², extensions ≤15m², terrasse/platting, gjerde/levegg, BYA, byggegrense, høydebestemmelser, søknadsprosess

**Neighbourhoods with area-specific rules:** Lura, Austrått, Ganddal, Sentrum (Sandnes) · Eiganes/Våland, Hundvåg, Storhaug, Madla (Stavanger)

**Application guides:** dispensasjon, byggesøknad, nabovarsel — each with document checklist, portal links, processing times, tips

## External APIs

| Service | Purpose | Auth |
|---|---|---|
| [Kartverket Address API](https://ws.geonorge.no/adresser/v1/) | Property lookup | None |
| [arealplaner.no](https://arealplaner.no) | Area plan details | None |
| [Stavanger kommune](https://www.stavanger.kommune.no/byggesak/) | Municipal portal | None |
| [Sandnes kommune](https://www.sandnes.kommune.no/tjenester/byggesak/) | Municipal portal | None |
| [DiBK](https://dibk.no) | Blankett 5154 (nabovarsel) | None |

## Build

```bash
npm run build   # static export to /out
npm run mcp:dev # start MCP server
```

Deployed to GitHub Pages via GitHub Actions on push to `main`.

## Sources

- [Plan- og bygningsloven](https://lovdata.no/dokument/NL/lov/2008-06-27-71)
- [TEK17 — Byggteknisk forskrift](https://lovdata.no/dokument/SF/forskrift/2017-06-19-840)
- [Direktoratet for byggkvalitet](https://dibk.no/)

## Disclaimer

⚠️ This chatbot provides general guidance based on current laws and regulations. For binding clarification, always contact the municipality directly. Zoning plans and local rules vary — always verify for your specific property.

## License

MIT
