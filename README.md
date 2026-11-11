# Little Hanzi Russian

Little Hanzi is a reading-first language-learning app. This version is for **Russian**: paste a Russian article and its English translation, then read them paragraph by paragraph with a quiet romanization underneath every Russian word.

The romanization is intentionally placed **below** the Russian text, so your eyes move from the Cyrillic letters down to the sound — which makes it easier to build real alphabet recognition instead of relying on the Latin line.

## Features

- **Paragraph-by-paragraph reading** — Russian and English stay aligned per paragraph
- **Romanization below each word** — powered by [`iuliia`](https://github.com/nalgeon/iuliia-js) with the Wikipedia schema, so letter combinations and word endings are handled properly
- **Automatic article removal** — English “a”, “an”, and “the” are stripped from pasted text and from the reading view
- **Word counts** — every Russian and English paragraph shows its own word count, plus totals in the input headers
- **Paragraph-count validation** — if the Russian and English pastes have a different number of paragraphs, the app tells you immediately
- **Bookmarks** — double-click/double-tap a paragraph to bookmark it
- **Jump to editor** — the paragraph menu can select the matching paragraph in the editor so you can fix it quickly
- **Resume reading** — if you close the app mid-read with a bookmark, the next launch offers to continue from that paragraph
- **History with an unfinished-reads tab** — bookmarked articles appear first by default
- **Ice / liquid-glass UI** — a cold Russian-winter palette with frosted-glass surfaces
- **Customizable** — font size, romanization size, English size, font family, display order
- **Mobile friendly and installable** — PWA-ready with offline support after first load

## Russian romanization

The app uses [`iuliia`](https://www.npmjs.com/package/iuliia) with its Wikipedia schema. It is a transliteration library (rather than a stress-aware pronunciation dictionary), so it does not reduce unstressed vowels like `о → а`. What it does handle well:

- multi-letter sounds: `ж → zh`, `х → kh`, `ц → ts`, `ч → ch`, `ш → sh`, `щ → shch`
- yotized vowels: `е → ye`, `ё → yo`, `ю → yu`, `я → ya`
- soft/hard signs in context (`объявление → obyavleniye`, `подъезд → podyezd`)
- word endings and letter combinations via the schema rules

If you later want stress-aware, textbook-style pronunciation (`молоко → malako`), the right next step is adding a stress-marked dictionary or a morphological analyzer; the current romanizer is a solid, predictable base.

## Setup

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

## Tech stack

- Vue 3 + Vite
- Tailwind CSS
- `iuliia` for Russian romanization
- `vite-plugin-pwa`

## License

MIT
