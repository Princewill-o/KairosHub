# Imported Bible kit

Imported into the user-selected Kharis Supabase project (`yrqkafiqwllkphroztqk`) on 26 October 2026 from `/Users/princewillokube/Downloads/bible-supabase-import-kit.zip`.

Verified data:

- 66 books, 1,189 chapters, and 31,102 KJV verses.
- 170 original quiz questions, with four unique choices and a valid answer for each.
- Database verse-text digest matches the downloaded source: `3874ed8f1dfe7ea8c7db8e98a503ff29` (MD5 of newline-joined `book_id:chapter:verse:text`, in numeric reference order).
- `manifest.json` records the downloaded source URL, SHA-256 and counts; `SOURCE-LICENSE.txt` preserves its repository MIT notice. The full verse corpus is in Supabase, not bundled into the frontend.

Tables: `public.bible_translations`, `public.bible_books`, `public.bible_verses`, and `public.bible_quiz_questions`. Books and verses have read-only policies for `anon` and `authenticated`. All four tables enable RLS. Quiz answers have no public/authenticated grants or policies and are available only to trusted server access. This deliberately tightens the kit's public answer-key policy. Existing Kharis and KairosGames tables were preserved. Import batches use `ON CONFLICT DO NOTHING`.

KJV is marked imported only after count verification. NIV and NKJV are metadata placeholders marked `requires_licence`; no text was imported for either. Original source and rights notes are preserved in `ORIGINAL-README.md` and the translation records.

The kit's builder picked abbreviated `book` names ahead of `englishName` and expected `correct_answer` although the JSON uses `correctAnswer`. `scripts/prepare-bible-import.mjs` validates the English book names, contiguous chapter/verse numbering, full corpus count and normalized question fields. It creates book/question SQL and bounded verse batches from a locally downloaded source:

```sh
node scripts/prepare-bible-import.mjs /path/to/kjv_full_source.json /path/to/output
node --test bible-import.test.mjs
```

The original archive scripts were inspected rather than executed. Schema changes are recorded in `supabase/migrations/20261026001616_import_bible_kit.sql`. The live database migration receives its own server timestamp in Supabase history.

This is a database import. The current game's bundled question bank and external Scripture reader have not been switched to these tables. Frontend/server integration can use the imported resources separately.
