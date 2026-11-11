import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS, lessonFor, lessonById, sermonEmbed, ease, LESSON_SECONDS } from './public/motion-lessons.mjs';

test('every lesson pairs a KJV verse with a Kharis sermon excerpt', () => {
  assert.ok(LESSONS.length >= 8);
  for (const l of LESSONS) {
    assert.match(l.sermon.video, /^[\w-]{11}$/);
    assert.equal(l.sermon.end - l.sermon.start, 60);
    assert.ok(l.verse.length > 20 && l.ref);
    assert.match(sermonEmbed(l.sermon), /^https:\/\/www\.youtube-nocookie\.com\/embed\//);
  }
  assert.equal(new Set(LESSONS.map((l) => l.id)).size, LESSONS.length);
});

test('life challenge categories find a lesson', () => {
  for (const c of ['temptation', 'health', 'spiritual', 'work', 'mind', 'money', 'family']) assert.ok(lessonFor(c), c);
  assert.equal(lessonById('grace').emblem, 'cross');
});

test('easing curves start at 0, end at 1, and overshoot only where intended', () => {
  for (const f of Object.values(ease)) { assert.equal(f(0), 0); assert.equal(f(1), 1); }
  assert.ok(Math.max(...Array.from({ length: 50 }, (_, i) => ease.over(i / 50))) > 1);
  assert.ok(ease.out(0.3) > 0.6);
  assert.equal(LESSON_SECONDS, 12);
});
