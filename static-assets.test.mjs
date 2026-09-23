import test from 'node:test';
import assert from 'node:assert/strict';
import {assetUrl} from './scripts/asset-url.mjs';
test('static asset keys use URL separators on Windows and POSIX',()=>{
 assert.equal(assetUrl('library\\unity.mjs'),'/library/unity.mjs');
 assert.equal(assetUrl('assets/arcade/walk.png'),'/assets/arcade/walk.png');
 assert.equal(assetUrl('index.html'),'/index.html');
});
