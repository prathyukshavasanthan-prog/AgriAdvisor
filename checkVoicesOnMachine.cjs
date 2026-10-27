/**
 * Script to query Chrome Web Speech API voices on this machine
 * and report which of the 10 Indian regional languages have a working voice.
 */
const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const LANGUAGES = [
  { code: 'en', name: 'English', match: ['en-in', 'en-us', 'en-gb', 'en'] },
  { code: 'hi', name: 'Hindi (हिन्दी)', match: ['hi-in', 'hi'] },
  { code: 'ta', name: 'Tamil (தமிழ்)', match: ['ta-in', 'ta'] },
  { code: 'te', name: 'Telugu (తెలుగు)', match: ['te-in', 'te'] },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)', match: ['kn-in', 'kn'] },
  { code: 'ml', name: 'Malayalam (മലയാളം)', match: ['ml-in', 'ml'] },
  { code: 'mr', name: 'Marathi (मराठी)', match: ['mr-in', 'mr'] },
  { code: 'bn', name: 'Bengali (বাংলা)', match: ['bn-in', 'bn-bd', 'bn'] },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)', match: ['gu-in', 'gu'] },
  { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)', match: ['pa-in', 'pa'] },
];

async function checkVoices() {
  console.log('========================================================================');
  console.log('  AGRIADVISOR — HOST MACHINE WEB SPEECH SYNTHESIS VOICE AUDIT');
  console.log('========================================================================\n');

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5273', { waitUntil: 'domcontentloaded' });

    // Wait for voices to populate
    const installedVoices = await page.evaluate(async () => {
      return new Promise((resolve) => {
        let voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          return resolve(voices.map(v => ({ name: v.name, lang: v.lang, default: v.default })));
        }
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          resolve(voices.map(v => ({ name: v.name, lang: v.lang, default: v.default })));
        };
        setTimeout(() => {
          resolve(window.speechSynthesis.getVoices().map(v => ({ name: v.name, lang: v.lang, default: v.default })));
        }, 1500);
      });
    });

    console.log(`Total voices detected on host Chrome browser: ${installedVoices.length}`);
    if (installedVoices.length > 0) {
      console.log('Sample detected voices:');
      installedVoices.slice(0, 10).forEach(v => console.log(`  - [${v.lang}] ${v.name}`));
    }

    console.log('\n--- Status across all 10 Supported AgriAdvisor Languages ---');
    const auditResults = [];

    for (const lang of LANGUAGES) {
      const matchingVoice = installedVoices.find(v => {
        const vLang = v.lang.toLowerCase();
        return lang.match.some(m => vLang === m || vLang.startsWith(m));
      });

      const hasVoice = Boolean(matchingVoice);
      auditResults.push({
        code: lang.code,
        name: lang.name,
        hasVoice,
        voiceName: matchingVoice ? matchingVoice.name : 'None (Fallback translated message shown)'
      });

      console.log(`  [${lang.code.toUpperCase()}] ${lang.name.padEnd(20)}: ${hasVoice ? '✓ WORKING VOICE (' + matchingVoice.name + ')' : '✗ NO VOICE ON HOST (Disabled + Translated Alert)'}`);
    }

    console.log('\n========================================================================');
    console.log(`  VOICE COMPATIBILITY SUMMARY: ${auditResults.filter(r => r.hasVoice).length}/10 LANGUAGES SUPPORTED ON THIS HOST`);
    console.log('========================================================================\n');

  } catch (err) {
    console.error('Error during voice audit:', err);
  } finally {
    if (browser) await browser.close();
  }
}

checkVoices();
