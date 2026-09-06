#!/usr/bin/env node
/**
 * Simple test runner for game-core
 * Workaround for npm/WSL path issues
 */

const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let passed = 0;
let failed = 0;
const failures = [];

// Simple test framework
function describe(name, fn) {
  console.log(`\n${colors.blue}${name}${colors.reset}`);
  fn();
}

function it(name, fn) {
  try {
    fn();
    console.log(`  ${colors.green}✓${colors.reset} ${name}`);
    passed++;
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} ${name}`);
    console.log(`    ${colors.red}${error.message}${colors.reset}`);
    failed++;
    failures.push({ name, error });
  }
}

function expect(value) {
  return {
    toBe(expected) {
      if (value !== expected) {
        throw new Error(`Expected ${expected} but got ${value}`);
      }
    },
    toBeDefined() {
      if (value === undefined) {
        throw new Error(`Expected value to be defined but got undefined`);
      }
    },
    toHaveLength(expected) {
      if (value.length !== expected) {
        throw new Error(`Expected length ${expected} but got ${value.length}`);
      }
    },
    toBeGreaterThan(expected) {
      if (!(value > expected)) {
        throw new Error(`Expected value to be greater than ${expected} but got ${value}`);
      }
    },
    toEqual(expected) {
      const strValue = JSON.stringify(value);
      const strExpected = JSON.stringify(expected);
      if (strValue !== strExpected) {
        throw new Error(`Expected ${strExpected} but got ${strValue}`);
      }
    },
    toBeNull() {
      if (value !== null) {
        throw new Error(`Expected null but got ${value}`);
      }
    },
    toBeTruthy() {
      if (!value) {
        throw new Error(`Expected truthy value but got ${value}`);
      }
    },
    toBeFalsy() {
      if (value) {
        throw new Error(`Expected falsy value but got ${value}`);
      }
    }
  };
}

const typesSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'types.ts'), 'utf8');

// Basic tests that don't require full module
console.log(`${colors.yellow}Running basic structure tests...${colors.reset}`);
console.log(`${colors.yellow}These are source-structure checks; run npm test for game-rule tests.${colors.reset}`);

describe('Structure Tests', () => {
  it('should have test files', () => {
    const testDir = path.join(__dirname, '..', 'tests');
    const files = fs.readdirSync(testDir);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should have game.test.ts', () => {
    const testFile = path.join(__dirname, '..', 'tests', 'game.test.ts');
    expect(fs.existsSync(testFile)).toBeTruthy();
  });

  it('should have combat.test.ts', () => {
    const testFile = path.join(__dirname, '..', 'tests', 'combat.test.ts');
    expect(fs.existsSync(testFile)).toBeTruthy();
  });
});

describe('Source declarations', () => {
  it('should declare troop statistics in types.ts', () => {
    expect(typesSource.includes('TROOP_STATS')).toBeTruthy();
  });
});

describe('Source Files', () => {
  it('should have types.ts', () => {
    const file = path.join(__dirname, '..', 'src', 'types.ts');
    expect(fs.existsSync(file)).toBeTruthy();
  });

  it('should have game.ts', () => {
    const file = path.join(__dirname, '..', 'src', 'game.ts');
    expect(fs.existsSync(file)).toBeTruthy();
  });

  it('should have combat.ts', () => {
    const file = path.join(__dirname, '..', 'src', 'combat.ts');
    expect(fs.existsSync(file)).toBeTruthy();
  });

  it('should have index.ts', () => {
    const file = path.join(__dirname, '..', 'src', 'index.ts');
    expect(fs.existsSync(file)).toBeTruthy();
  });
});

// Summary
console.log(`\n${colors.yellow}====================${colors.reset}`);
console.log(`${colors.yellow}Test Summary${colors.reset}`);
console.log(`${colors.yellow}====================${colors.reset}`);
console.log(`Total: ${passed + failed}`);
console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
console.log(`${colors.red}Failed: ${failed}${colors.reset}`);

if (failures.length > 0) {
  console.log(`\n${colors.red}Failures:${colors.reset}`);
  failures.forEach(f => {
    console.log(`  - ${f.name}`);
  });
  process.exit(1);
} else {
  console.log(`\n${colors.green}All structure tests passed!${colors.reset}`);
  console.log(`${colors.yellow}Run 'npm test' for executable game-rule tests.${colors.reset}`);
  process.exit(0);
}
