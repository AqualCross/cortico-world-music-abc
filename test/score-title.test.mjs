import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreTitle, withScoreTitle } from '../web/score-title.js';

test('source edits provide the primary title while retaining subtitles', () => {
  const abc = 'X:1\nT:Prelude\nT:前奏\nM:4/4\nK:C\nC4 |]';
  assert.equal(scoreTitle(abc), 'Prelude');
  const renamed = withScoreTitle(abc, 'New $& title');
  assert.equal(scoreTitle(renamed), 'New $& title');
  assert.match(renamed, /\nT:前奏\n/);
  assert.ok(renamed.endsWith('C4 |]'));
});

test('adding a missing title preserves the header and music', () => {
  const abc = 'X:1\r\nM:4/4\r\nK:C\r\nC4 |]';
  assert.equal(scoreTitle(abc), '');
  const titled = withScoreTitle(abc, 'Study');
  assert.equal(scoreTitle(titled), 'Study');
  assert.ok(titled.includes('M:4/4\r\nK:C\r\nC4 |]'));
  assert.equal(scoreTitle(withScoreTitle(titled, '')), '');
});
