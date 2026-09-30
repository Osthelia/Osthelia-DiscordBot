import { test } from 'node:test';
import assert from 'node:assert/strict';

test('package.json is valid JSON with expected name', async () => {
    const pkg = await import('../package.json', { with: { type: 'json' } });
    assert.equal(pkg.default.name, 'osthelia-discordbot');
});
