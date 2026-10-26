# Bible quiz Supabase import kit

## What is actually in this ZIP
- `data/books.json` and `data/bible_books.csv`: all 66 books.
- `data/questions.json` and `data/bible_quiz_questions.csv`: populated original Bible quiz bank.
- `sql/01_schema.sql`: tables, indexes, RLS and read policies.
- `scripts/build_dataset.py`: **downloads the complete KJV from the cited public source**, checks exactly 66 books and 31,102 verses, and builds `data/bible_verses_KJV.csv`.
- `scripts/verify.py`: checks local import counts.

**Note:** The KJV 31,102-verse file could not be embedded in this ZIP because the build environment could not download the raw source. Unlike a manual importer, `build_dataset.py` obtains it automatically when run on a machine with internet access. This is NOT an offline, fully self-contained KJV ZIP.

## Import into Supabase
1. Unzip. In a terminal with Python 3, from the kit directory run `python3 scripts/build_dataset.py`. This downloads and generates the KJV CSV (typically a few MB).
2. Open your Supabase project → **SQL Editor** → run `sql/01_schema.sql`.
3. Open **Table Editor** → `bible_books` → **Import data from CSV** → choose `data/bible_books.csv`.
4. Repeat for `bible_verses` using `data/bible_verses_KJV.csv`; import into `bible_quiz_questions` using `data/bible_quiz_questions.csv`.
5. Run `select count(*) from public.bible_verses where translation_code='KJV';` → must equal **31102**. Run `select count(*) from public.bible_quiz_questions;` to verify quiz count.

Do not paste the CSV into SQL Editor: use Table Editor CSV import. For significantly larger future datasets, use `COPY` or bulk import methods. See https://supabase.com/docs/guides/database/import-data

## Frontend Supabase examples
```js
const { data: passage, error } = await supabase.from('bible_verses').select('verse,text').eq('translation_code','KJV').eq('book_id',43).eq('chapter',3).order('verse');
const { data: quiz } = await supabase.from('bible_quiz_questions').select('*').eq('difficulty','easy').limit(10);
```

## NIV and NKJV
They are NOT included. Full NKJV and NIV data is copyrighted, and publishing it in Supabase requires appropriate permission, including API provider terms. Do not scrape or mirror Bible APIs in violation of licensing conditions. Consider display-only licensed API access and keep keys in server-side environment variables. NIV commercial use often requires contacting Biblica directly: https://biblica.com/permissions/ .

## UK KJV rights
Though public domain in many countries, UK publication of the Authorized Version is subject to Crown/royal-prerogative rights. Check licensing for commercial UK distribution rather than assuming all uses are unrestricted.

## Data source attribution
https://github.com/midvash/bible-data (KJV public-domain dataset and source metadata; original dataset project may have additional repository terms).

## Security
RLS protects against unauthorised writes, but public quiz answer keys allow cheating. For real multiplayer / paid games, expose a question-only view and perform correct-answer checking server-side. The included schema favors ease of testing.
