# Shadow Ledger — recorded Mandarin audio edition

Phone-friendly Chinese, pinyin, English, notes and saved reading progress. Includes the complete existing 24-chapter story (288 pages, 576 sentences), not a 5,000-line edition.

**The MP3 recordings are not included yet.** This project generates real AI-narrated Mandarin chapter MP3s during the build using your ElevenLabs account and credits. Playback then uses ordinary browser audio, with no phone text-to-speech and no API key in the reader.

## Deploy on Vercel

1. Extract this ZIP. Upload the contents of this folder to your GitHub repository, including `public`, `scripts`, `package.json`, and `vercel.json`. Replace the old reader files with this project; do not upload only `index.html`.
2. In Vercel → Project Settings → Environment Variables, add:
   - `ELEVENLABS_API_KEY`: your ElevenLabs API key with text-to-speech access.
   - `ELEVENLABS_VOICE_ID`: the ID of a voice you have tested speaking Mandarin. Use a voice available to your account.
3. Use Node.js 22 or newer. Framework preset: Other. Build command: `npm run build`. Output directory: `public`. The included `vercel.json` supplies these last two settings.
4. Redeploy. The build generates 24 MP3s and sentence timing data. Check the build log for `Ready: 24 recorded chapters, 288 synchronized pages.` The build deliberately fails if recordings cannot be generated.
5. Open your site on your phone and tap Play once. It reads continuously, highlights the current sentence and turns pages. Pause/Resume preserves your audio position. Manual page changes stop playback; Play starts that page.

Keep the page open for reliable automatic page turns. Locked-screen playback and autoplay restrictions vary by mobile browser; a browser may occasionally require another tap after an interruption. This removes dependence on installed phone voices, not browser media restrictions.

## Avoid paying to regenerate audio on every deployment

Vercel's generated files are not committed to GitHub and its build cache is not guaranteed. Each build without saved recordings can consume narration credits again.

Recommended once you have a laptop: generate once locally with Node 22+, then commit `public/audio/` (including `generation-cache.json`) and `public/audio-manifest.js`. The build verifies saved recordings against the story and reuses them without an API key. Do not change the model or voice unless you intend to regenerate recordings.

```bash
# Set these privately in your terminal environment; do not commit their values.
export ELEVENLABS_API_KEY='YOUR_KEY'
export ELEVENLABS_VOICE_ID='YOUR_MANDARIN_VOICE_ID'
npm run build
npm test
```

No dependencies need installing. Never put credentials in public files, GitHub source, or browser-side JavaScript. `.env` files are ignored, but this script reads environment variables directly (it does not automatically load `.env`). Narration service charges and limits depend on your account. Make a short voice test in the provider's dashboard before generating the book.

## How synchronization works

`scripts/generate-audio.mjs` sends each chapter's Chinese sentences to the ElevenLabs `with-timestamps` API using `eleven_multilingual_v2`. It saves an MP3 and converts character alignment to sentence boundaries. It rejects text/timing mismatches. `public/audio.js` plays chapter recordings through one HTMLAudioElement, using those timings to follow the story. Existing text and learning notes remain intact. No narration service is contacted while reading.

Provider reference: https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps
Deployment reference: https://vercel.com/docs/project-configuration

## Validation

Run `npm test` for sentence alignment, continuous page/chapter transitions, pause/resume, seeking and stale callback protection. Actual generated speech quality and real-device playback must be checked after generation; recordings were not generated or listened to when this package was prepared.
