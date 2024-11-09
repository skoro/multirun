import { mustBePositiveInteger } from "../src/utils";

test('integer as string', () => {
  expect(mustBePositiveInteger('123')).toBe(123);
})

test('integer as integer', () => {
  expect(mustBePositiveInteger(123)).toBe(123);
});

test('float cannot be integer', () => {
  expect(() => mustBePositiveInteger(123.45)).toThrow('Expects an integer but got 123.45');
});

test('expects positive integers', () => {
  expect(() => mustBePositiveInteger(-4)).toThrow('Expects a positive integer value but got -4');
});
