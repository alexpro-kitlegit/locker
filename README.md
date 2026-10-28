# The Locker: prototype

**The Locker sells. KitLegit checks.** A marketplace where football fans buy and sell pre-owned shirts, every one checked by KitLegit, with white-label resale stores for clubs.

This is a rough clickable prototype to share the vision with the team. It has **no backend**. Payments, shipping, club credit and the KitLegit check are simulated, and all data lives in your browser's localStorage.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5180.

| Route | What |
|---|---|
| `/` | Hub: every surface, the demo script, prototype settings |
| `/demo` | The app and a club store side by side, live-synced. Best for presenting. |
| `/app` | The Locker app (fans) |
| `/store/harbour-city`, `/store/northgate`, `/store/kingsmere` | White-label club stores (fictional clubs, three templates) |

Amber dashed boxes are **prototype controls**. They stand in for integrations (carrier tracking, NFC tap, choosing the KitLegit result).

## Docs

The requirements log, kept up to date as we build. It feeds the flowchart and the Trello board.

- [Vision](docs/01-vision.md): what The Locker is, from the founders' draft
- [Integrations](docs/02-integrations.md): every external service, and where the prototype fakes it
- [Data model](docs/03-data-model.md): tables, reuse vs new, lessons from the build
- [Open questions](docs/04-open-questions.md): decisions needed, and assumptions to confirm
- [Screens](docs/05-screens.md): every screen built, and what it needs for real

## Stack

React 18, Vite 7, TypeScript, Tailwind 3 and React Router 6, matching kitlegit-web so its components can be reused.
