/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  testPathIgnorePatterns: ['.d.js', '.js', 'helpers.ts'],
  transform: {
    "^.+.tsx?$": ["ts-jest",{}],
  },
};
