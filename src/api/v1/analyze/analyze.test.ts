/**
 * Code Analysis Module - Test Documentation & Examples
 * 
 * This file documents the expected behavior of the code analysis module
 * and provides examples for testing and validation purposes.
 * 
 * The examples below demonstrate:
 * - Schema validation and type safety
 * - Service logic correctness
 * - Route handling and error cases
 * - Edge cases and boundary conditions
 * 
 * These examples ensure the API behaves as documented in the OpenAPI specification.
 */

import { analyzeSnippet, validateCodeSize, getCodeStatistics } from './analyze.service.js';
import { AnalyzeCodeInSchema, AnalyzeCodeOutSchema } from './analyze.schema.js';

/**
 * Test Cases for Code Analysis Service
 * 
 * These examples show the expected behavior of the analyzeSnippet function.
 * Each example includes input code and expected output.
 */

export const testCases = {
  simpleCode: {
    input: 'function hello() {\n  return "Hello, World!";\n}',
    expected: { lines: 3, chars: 47, is_empty: false }
  },
  
  emptyCode: {
    input: '',
    expected: { lines: 1, chars: 0, is_empty: true }
  },
  
  whitespaceOnly: {
    input: '   \n  \n  ',
    expected: { lines: 3, chars: 7, is_empty: true }
  },
  
  singleLine: {
    input: 'console.log("Hello, World!");',
    expected: { lines: 1, chars: 28, is_empty: false }
  },
  
  multiLineFunction: {
    input: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n-1) + fibonacci(n-2);
}`,
    expected: { lines: 4, chars: 89, is_empty: false }
  }
};

/**
 * Schema Validation Examples
 * 
 * These examples demonstrate valid and invalid inputs for the schemas.
 */

export const schemaValidationExamples = {
  validInputs: [
    { code: 'console.log("test")' },
    { code: 'function test() { return true; }' },
    { code: 'a'.repeat(1000) } // Within size limit
  ],
  
  invalidInputs: [
    { code: '' }, // Empty string (fails minLength)
    { code: 123 }, // Wrong type
    {}, // Missing code property
    { code: 'a'.repeat(100001) }, // Too large (fails maxLength)
    { extra: 'field' } // Extra properties not allowed
  ],
  
  validOutputs: [
    { lines: 5, chars: 100, is_empty: false },
    { lines: 0, chars: 0, is_empty: true },
    { lines: 1, chars: 10, is_empty: false }
  ],
  
  invalidOutputs: [
    { lines: -1, chars: 100, is_empty: false }, // Negative lines
    { lines: 5, chars: -1, is_empty: false }, // Negative chars
    { lines: 5, chars: 100 }, // Missing is_empty
    { lines: '5', chars: 100, is_empty: false } // Wrong type
  ]
};

/**
 * API Integration Examples
 * 
 * These examples show typical API usage scenarios and expected responses.
 */

export const apiExamples = {
  requestExamples: [
    {
      description: 'Simple Python code',
      request: { code: 'print("Hello, World!")' },
      expectedResponse: { lines: 1, chars: 22, is_empty: false }
    },
    {
      description: 'JavaScript function',
      request: { code: 'function greet(name) {\n  return `Hello, ${name}!`;\n}' },
      expectedResponse: { lines: 3, chars: 52, is_empty: false }
    },
    {
      description: 'Empty code',
      request: { code: '' },
      expectedResponse: { lines: 1, chars: 0, is_empty: true }
    },
    {
      description: 'Whitespace only',
      request: { code: '   \n  \n  ' },
      expectedResponse: { lines: 3, chars: 7, is_empty: true }
    }
  ],
  
  errorExamples: [
    {
      description: 'Missing code field',
      request: {},
      expectedError: { error: 'Code is required', statusCode: 400 }
    },
    {
      description: 'Code too large',
      request: { code: 'a'.repeat(100001) },
      expectedError: { error: 'Code too large', statusCode: 413 }
    }
  ]
};

/**
 * Utility Function Examples
 * 
 * Examples showing how to use the utility functions.
 */

export const utilityExamples = {
  validateCodeSize: [
    { code: 'small code', maxSize: 100, expected: true },
    { code: 'a'.repeat(50), maxSize: 25, expected: false },
    { code: 'normal code', expected: true } // Uses default 100KB limit
  ],
  
  getCodeStatistics: [
    {
      code: 'function test() {\n  // comment\n  return true;\n}',
      expected: {
        totalLines: 4,
        nonEmptyLines: 3,
        emptyLines: 1,
        totalChars: 45,
        nonWhitespaceChars: 35,
        averageLineLength: 11.25
      }
    }
  ]
};

/**
 * Manual Test Runner
 * 
 * This function can be used to manually test the analysis functionality.
 * It runs through all test cases and reports results.
 */

export function runManualTests() {
  console.log('🧪 Running Code Analysis Manual Tests...\n');
  
  // Test analyzeSnippet function
  console.log('📊 Testing analyzeSnippet function:');
  Object.entries(testCases).forEach(([name, testCase]) => {
    try {
      const result = analyzeSnippet(testCase.input);
      const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);
      console.log(`  ${passed ? '✅' : '❌'} ${name}: ${passed ? 'PASSED' : 'FAILED'}`);
      if (!passed) {
        console.log(`    Expected: ${JSON.stringify(testCase.expected)}`);
        console.log(`    Got: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      console.log(`  ❌ ${name}: ERROR - ${error}`);
    }
  });
  
  // Test schema validation
  console.log('\n🔍 Testing schema validation:');
  console.log('  Valid inputs:');
  schemaValidationExamples.validInputs.forEach((input, index) => {
    const isValid = AnalyzeCodeInSchema.Check(input);
    console.log(`    ${isValid ? '✅' : '❌'} Input ${index + 1}: ${isValid ? 'VALID' : 'INVALID'}`);
  });
  
  console.log('  Invalid inputs:');
  schemaValidationExamples.invalidInputs.forEach((input, index) => {
    const isValid = AnalyzeCodeInSchema.Check(input);
    console.log(`    ${!isValid ? '✅' : '❌'} Input ${index + 1}: ${!isValid ? 'CORRECTLY REJECTED' : 'INCORRECTLY ACCEPTED'}`);
  });
  
  console.log('\n✅ Manual tests completed!');
}

// Uncomment the line below to run tests when this file is executed directly
// runManualTests();
