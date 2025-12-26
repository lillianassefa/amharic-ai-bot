import { detectLanguage } from '../services/ai';

const runTests = () => {
  const tests = [
    { input: 'Hello, how are you?', expected: 'en' },
    { input: 'ሰላም ነው? እንዴት ነህ?', expected: 'am' },
    { input: 'This is a test with አማርኛ inside.', expected: 'am' },
    { input: '12345 !@#$', expected: 'en' },
  ];

  console.log('Running detectLanguage tests...');
  let passed = 0;
  tests.forEach((t, i) => {
    const result = detectLanguage(t.input);
    if (result === t.expected) {
      console.log(`✅ Test ${i + 1} passed`);
      passed++;
    } else {
      console.log(`❌ Test ${i + 1} failed: input="${t.input}", expected="${t.expected}", got="${result}"`);
    }
  });

  console.log(`\nTests finished: ${passed}/${tests.length} passed.`);
};

runTests();

