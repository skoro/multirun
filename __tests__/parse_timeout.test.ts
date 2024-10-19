import { parseTimeout } from "../src/utils";

test('parse timeout number seconds to milliseconds', () => {
  expect(parseTimeout(60))
    .toBe(60_000);
});

test('parse timeout as string', () => {
  expect(parseTimeout('99'))
    .toBe(99_000);
});

test('timeout with "s" suffix is seconds', () => {
  expect(parseTimeout('60s'))
    .toBe(60_000);
});
