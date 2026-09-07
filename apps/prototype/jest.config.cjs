// Reuses the existing game-core Jest/ts-jest toolchain; no browser is started.
module.exports = {
  rootDir: __dirname,
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        target: 'ES2020', module: 'CommonJS', moduleResolution: 'node',
        lib: ['ES2020', 'DOM'], strict: true, esModuleInterop: true, skipLibCheck: true,
      },
    }],
  },
  moduleNameMapper: {
    '^@lands-of-glory/game-core$': '<rootDir>/../../packages/game-core/src',
  },
};
