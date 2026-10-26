CREATE TABLE public.bible_translations (
 code TEXT PRIMARY KEY, name TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('pending_import','imported','requires_licence')),
 licence_note TEXT
);
CREATE TABLE public.bible_books (
 id INTEGER PRIMARY KEY CHECK(id BETWEEN 1 AND 66), name TEXT NOT NULL UNIQUE,
 testament TEXT NOT NULL CHECK(testament IN ('OT','NT'))
);
CREATE TABLE public.bible_verses (
 translation_code TEXT NOT NULL REFERENCES public.bible_translations(code),
 book_id INTEGER NOT NULL REFERENCES public.bible_books(id),
 chapter INTEGER NOT NULL CHECK(chapter>0), verse INTEGER NOT NULL CHECK(verse>0), text TEXT NOT NULL CHECK(length(text)>0),
 PRIMARY KEY(translation_code,book_id,chapter,verse)
);
CREATE INDEX bible_verses_book_id_idx ON public.bible_verses(book_id);
CREATE INDEX bible_verses_search_idx ON public.bible_verses USING gin(to_tsvector('english',text));
CREATE TABLE public.bible_quiz_questions (
 id TEXT PRIMARY KEY, question TEXT NOT NULL,
 options JSONB NOT NULL CHECK(jsonb_typeof(options)='array' AND jsonb_array_length(options)=4),
 correct_answer TEXT NOT NULL, reference TEXT NOT NULL,
 difficulty TEXT NOT NULL CHECK(difficulty IN ('easy','medium','hard')),
 category TEXT NOT NULL, points INTEGER NOT NULL CHECK(points>0), explanation TEXT NOT NULL DEFAULT '',
 CHECK(options ? correct_answer)
);
CREATE INDEX bible_quiz_difficulty_idx ON public.bible_quiz_questions(difficulty,category);
ALTER TABLE public.bible_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY translations_read ON public.bible_translations FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY books_read ON public.bible_books FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY verses_read ON public.bible_verses FOR SELECT TO anon,authenticated USING(true);
REVOKE ALL ON public.bible_translations,public.bible_books,public.bible_verses,public.bible_quiz_questions FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.bible_translations,public.bible_books,public.bible_verses TO anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.bible_translations,public.bible_books,public.bible_verses,public.bible_quiz_questions TO service_role;
COMMENT ON TABLE public.bible_quiz_questions IS 'Imported Bible quiz bank. Answer keys are server-only; no anon/authenticated SELECT grant or policy.';
INSERT INTO public.bible_translations(code,name,status,licence_note) VALUES
 ('KJV','King James Version','pending_import','Source: midvash/bible-data, MIT repository. Check UK Crown/royal-prerogative publishing rights before UK commercial distribution.'),
 ('NKJV','New King James Version','requires_licence','No text imported. Thomas Nelson licence required for redistribution.'),
 ('NIV','New International Version','requires_licence','No text imported. Biblica licence required for redistribution.');
