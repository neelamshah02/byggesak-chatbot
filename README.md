# Byggesak Chatbot 🏠

En chatbot for Stavanger og Sandnes kommune som hjelper deg med å forstå byggeforskrifter og krav for byggeprosjekter.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![MCP](https://img.shields.io/badge/MCP-1.0-green)

## Funksjoner

- 🔍 **Adressesøk** - Søk opp eiendomsinformasjon via Kartverket
- 📋 **Byggeregler** - Få oversikt over hva du kan bygge uten søknad
- 💬 **Enkel forklaring** - Komplekse regler forklart på en forståelig måte
- 🤖 **MCP Server** - Integrer med GitHub Copilot for AI-assistert hjelp

## Kom i gang

### Installer avhengigheter

```bash
npm install
```

### Start utviklingsserver

```bash
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) i nettleseren.

### (Valgfritt) Legg til AI-funksjonalitet

For mer avansert AI-assistanse, kopier `.env.local.example` til `.env.local` og legg til din API-nøkkel:

```bash
cp .env.local.example .env.local
# Rediger .env.local og legg til ANTHROPIC_API_KEY eller OPENAI_API_KEY
```

## MCP Server for GitHub Copilot

Prosjektet inkluderer en MCP (Model Context Protocol) server som lar deg bruke byggesak-verktøyene direkte i GitHub Copilot.

### Konfigurer MCP Server

1. Legg til følgende i din VS Code settings eller `mcp.json`:

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

2. Restart VS Code

3. I Copilot Chat, kan du nå bruke verktøyene:
   - `search_address` - Søk etter adresser
   - `get_building_regulations` - Hent byggeregler
   - `check_building_allowed` - Sjekk om bygging er tillatt
   - `explain_regulation` - Få forklaring på begreper

### Tilgjengelige MCP-verktøy

| Verktøy                    | Beskrivelse                                      |
| -------------------------- | ------------------------------------------------ |
| `search_address`           | Søk etter adresse i Stavanger/Sandnes            |
| `get_building_regulations` | Hent regler for garasje, tilbygg, terrasse, etc. |
| `check_building_allowed`   | Sjekk om et byggeprosjekt kan gjøres uten søknad |
| `explain_regulation`       | Forklar begreper som BYA, gesimshøyde, etc.      |

## Prosjektstruktur

```
byggesak-chatbot/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts      # Chat API endpoint
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # App layout
│   │   └── page.tsx              # Main page
│   ├── components/
│   │   ├── Chat.tsx              # Chat interface
│   │   └── Header.tsx            # Header component
│   └── lib/
│       ├── kartverket.ts         # Address lookup
│       └── regulations.ts         # Building regulations
├── mcp-server/
│   ├── index.ts                  # MCP server entry
│   └── tsconfig.json             # MCP server config
└── package.json
```

## API-er som brukes

- **Kartverket Adresse-API**: [ws.geonorge.no/adresser/v1](https://ws.geonorge.no/adresser/v1/) - Gratis adressesøk
- **Kommunens kartportal**: Reguleringsplaner og eiendomsinfo

## Byggeregler som dekkes

- Frittliggende bygg inntil 50 m² (garasje, bod, uthus)
- Tilbygg inntil 15 m²
- Terrasse og platting
- Gjerde og levegg
- Utnyttelsesgrad (BYA)
- Byggegrense og høydebestemmelser

## Utvikling

### Kjør MCP server lokalt

```bash
npm run mcp:dev
```

### Bygg prosjektet

```bash
npm run build
```

## Kilder og referanser

- [Plan- og bygningsloven](https://lovdata.no/dokument/NL/lov/2008-06-27-71)
- [TEK17 - Byggteknisk forskrift](https://lovdata.no/dokument/SF/forskrift/2017-06-19-840)
- [Stavanger kommune - Byggesak](https://www.stavanger.kommune.no/byggesak)
- [Sandnes kommune - Byggesak](https://www.sandnes.kommune.no/byggesak)
- [Direktoratet for byggkvalitet](https://dibk.no/)

## Ansvarsfraskrivelse

⚠️ Denne chatboten gir generell veiledning basert på gjeldende lover og forskrifter. For bindende avklaringer, kontakt alltid kommunen direkte. Reguleringsplaner og lokale bestemmelser kan variere, så sjekk alltid disse for din spesifikke eiendom.

## Lisens

MIT
