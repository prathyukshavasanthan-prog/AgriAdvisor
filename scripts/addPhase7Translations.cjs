const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'frontend', 'src', 'i18n', 'locales');

const NEW_KEYS = {
  en: {
    health_photo_tip_title: "Photo Tips for Accurate Diagnosis",
    health_photo_tip_single: "One leaf: isolate a single leaf showing symptoms",
    health_photo_tip_daylight: "Daylight: take in bright natural daylight",
    health_photo_tip_closeup: "Close-up: fill frame with leaf in sharp focus",
    health_honest_model_note: "Trained on PlantVillage lab-style photographs; field photos with natural background noise may score lower.",
    health_unclear_title: "Photo Unclear or Non-Leaf",
    health_unclear_message: "Unable to assess: photo is unclear or not a recognizable leaf. Please upload a clear photo of a single leaf in daylight, or contact your local agriculture extension officer (KVK).",
    health_likelihood_very_likely: "Very likely",
    health_likelihood_likely: "Likely",
    health_likelihood_possible: "Possible",
    health_likelihood_unclear: "Unclear",
    health_top_3_heading: "Top Likely Conditions",
  },
  ta: {
    health_photo_tip_title: "துல்லியமான நோயறிதலுக்கான புகைப்படக் குறிப்புகள்",
    health_photo_tip_single: "ஒரே இலை: நோய் அறிகுறிகள் உள்ள ஒரு இலையைத் தேர்ந்தெடுக்கவும்",
    health_photo_tip_daylight: "பகலொளி: தெளிவான இயற்கை வெளிச்சத்தில் புகைப்படம் எடுக்கவும்",
    health_photo_tip_closeup: "நெருக்கமான காட்சி: இலையைத் தெளிவாக சட்டகத்தில் பிடிக்கவும்",
    health_honest_model_note: "PlantVillage ஆய்வக புகைப்படங்களில் பயிற்றுவிக்கப்பட்டது; இயற்கை களப் புகைப்படங்களில் துல்லியம் மாறுபடலாம்.",
    health_unclear_title: "தெளிவற்ற புகைப்படம் அல்லது இலை அல்லாத படம்",
    health_unclear_message: "கண்டறிய முடியவில்லை: படம் தெளிவாக இல்லை அல்லது இலை அடையாளம் காணப்படவில்லை. இயற்கை வெளிச்சத்தில் ஒரு இலையை மீண்டும் படம் பிடிக்கவும்.",
    health_likelihood_very_likely: "மிகவும் சாத்தியமானது",
    health_likelihood_likely: "சாத்தியமானது",
    health_likelihood_possible: "வாய்ப்பு உள்ளது",
    health_likelihood_unclear: "தெளிவற்றது",
    health_top_3_heading: "முதன்மை சாத்தியமான நிலைகள்",
  },
  hi: {
    health_photo_tip_title: "सटीक निदान के लिए फोटो सुझाव",
    health_photo_tip_single: "एक पत्ती: लक्षण वाली केवल एक पत्ती पर ध्यान दें",
    health_photo_tip_daylight: "दिन की रोशनी: तेज प्राकृतिक रोशनी में फोटो खींचें",
    health_photo_tip_closeup: "नजदीक से फोटो: पत्ती को फ्रेम में स्पष्ट और फोकस में रखें",
    health_honest_model_note: "PlantVillage प्रयोगशाला तस्वीरों पर प्रशिक्षित; प्राकृतिक पृष्ठभूमि वाले खेत के फोटो में स्कोर कम हो सकता है।",
    health_unclear_title: "अस्पष्ट या पत्ती रहित फोटो",
    health_unclear_message: "आकलन करने में असमर्थ: फोटो अस्पष्ट है या पत्ती पहचानी नहीं जा सकी। कृपया दिन की रोशनी में एक साफ पत्ती की फोटो लें।",
    health_likelihood_very_likely: "अत्यधिक संभावित",
    health_likelihood_likely: "संभावित",
    health_likelihood_possible: "संभव",
    health_likelihood_unclear: "अस्पष्ट",
    health_top_3_heading: "शीर्ष संभावित स्थितियां",
  },
  te: {
    health_photo_tip_title: "ఖచ్చితమైన నిర్ధారణ కోసం ఫోటో చిట్కాలు",
    health_photo_tip_single: "ఒక ఆకు: లక్షణాలు కనిపించే ఒకే ఆకుపై దృష్టి పెట్టండి",
    health_photo_tip_daylight: "పగటి వెలుతురు: సహజ పగటి వెలుతురులో ఫోటో తీయండి",
    health_photo_tip_closeup: "సమీప ఫోటో: ఆకును స్పష్టంగా మరియు ఫోకస్ లో ఉంచండి",
    health_honest_model_note: "PlantVillage పరిశోధనా శాల చిత్రాలపై శిక్షణ పొందింది; పొలంలో సహజ బ్యాక్‌గ్రౌండ్‌తో స్కోరు మారవచ్చు.",
    health_unclear_title: "అస్పష్టమైన ఫోటో లేదా ఆకు కాదు",
    health_unclear_message: "గుర్తించలేకపోయాము: ఫోటో అస్పష్టంగా ఉంది లేదా ఆకును గుర్తించలేకపోయాము. దయచేసి పగటి వెలుతురులో స్పష్టమైన ఫోటో తీయండి.",
    health_likelihood_very_likely: "చాలా ఎక్కువగా సంభవించే అవకాశం",
    health_likelihood_likely: "సంభావ్యత ఉంది",
    health_likelihood_possible: "సాధ్యమే",
    health_likelihood_unclear: "అస్పష్టం",
    health_top_3_heading: "ప్రధాన సంభావ్య పరిస్థితులు",
  },
  kn: {
    health_photo_tip_title: "ನಿಖರ ರೋಗನಿರ್ಣಯಕ್ಕಾಗಿ ಫೋಟೋ ಸಲಹೆಗಳು",
    health_photo_tip_single: "ಒಂದು ಎಲೆ: ರೋಗ ಲಕ್ಷಣವಿರುವ ಒಂದು ಎಲೆಯ ಮೇಲೆ ಕೇಂದ್ರೀಕರಿಸಿ",
    health_photo_tip_daylight: "ಹಗಲು ಬೆಳಕು: ನೈಸರ್ಗಿಕ ಹಗಲು ಬೆಳಕಿನಲ್ಲಿ ಫೋಟೋ ತೆಗೆಯಿರಿ",
    health_photo_tip_closeup: "ಹತ್ತಿರದ ಫೋಟೋ: ಎಲೆಯನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಫ್ರೇಮ್‌ನಲ್ಲಿ ಇರಿಸಿ",
    health_honest_model_note: "PlantVillage ಪ್ರಯೋಗಾಲಯದ ಚಿತ್ರಗಳಲ್ಲಿ ತರಬೇತಿ ನೀಡಲಾಗಿದೆ; ಹೊಲದ ಚಿತ್ರಗಳಲ್ಲಿ ನಿಖರತೆ ವ್ಯತ್ಯಾಸವಾಗಬಹುದು.",
    health_unclear_title: "ಅಸ್ಪಷ್ಟ ಫೋಟೋ ಅಥವಾ ಎಲೆಯಲ್ಲದ ಚಿತ್ರ",
    health_unclear_message: "ಮೌಲ್ಯಮಾಪನ ಅಸಾಧ್ಯ: ಫೋಟೋ ಅಸ್ಪಷ್ಟವಾಗಿದೆ ಅಥವಾ ಎಲೆ ಗುರುತಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಹಗಲು ಬೆಳಕಿನಲ್ಲಿ ಸ್ಪಷ್ಟ ಚಿತ್ರ ತೆಗೆಯಿರಿ.",
    health_likelihood_very_likely: "ಬಹಳ ಸಂಭವನೀಯ",
    health_likelihood_likely: "ಸಂಭವನೀಯ",
    health_likelihood_possible: "ಸಾಧ್ಯತೆ ಇದೆ",
    health_likelihood_unclear: "ಅಸ್ಪಷ್ಟ",
    health_top_3_heading: "ಪ್ರಮುಖ ಸಂಭವನೀಯ ಪರಿಸ್ಥಿತಿಗಳು",
  },
  ml: {
    health_photo_tip_title: "കൃത്യമായ രോഗനിർണ്ണയത്തിനുള്ള ഫോട്ടോ നിർദ്ദേശങ്ങൾ",
    health_photo_tip_single: "ഒരു ഇല: രോഗലക്ഷണമുള്ള ഒരു ഇലയിൽ ശ്രദ്ധ കേന്ദ്രീകരിക്കുക",
    health_photo_tip_daylight: "പകൽ വെളിച്ചം: പ്രകൃതിദത്ത പകൽ വെളിച്ചത്തിൽ ഫോട്ടോ എടുക്കുക",
    health_photo_tip_closeup: "ക്ലോസ്-അപ്പ്: ഇല കൃത്യമായ ഫോക്കസിൽ ഫ്രെയിം ചെയ്യുക",
    health_honest_model_note: "PlantVillage ലാബ് ചിത്രങ്ങളിൽ പരിശീലിപ്പിച്ചത്; ഫീൽഡ് ചിത്രങ്ങളിൽ കൃത്യതയിൽ വ്യത്യാസം വന്നേക്കാം.",
    health_unclear_title: "വ്യക്തമല്ലാത്ത ഫോട്ടോ അല്ലെങ്കിൽ ഇലയല്ല",
    health_unclear_message: "കണ്ടെത്താനായില്ല: ഫോട്ടോ വ്യക്തമല്ല അല്ലെങ്കിൽ ഇല തിരിച്ചറിയാൻ കഴിഞ്ഞില്ല. പകൽ വെളിച്ചത്തിൽ വീണ്ടും ഫോട്ടോ എടുക്കുക.",
    health_likelihood_very_likely: "വളരെ സാധ്യതയുണ്ട്",
    health_likelihood_likely: "സാധ്യതയുണ്ട്",
    health_likelihood_possible: "സാധ്യമാണ്",
    health_likelihood_unclear: "വ്യക്തമല്ല",
    health_top_3_heading: "പ്രധാന സാധ്യതയുള്ള അവസ്ഥകൾ",
  },
  mr: {
    health_photo_tip_title: "अचूक निदानासाठी फोटो टिप्स",
    health_photo_tip_single: "एक पान: लक्षणे असलेल्या एकाच पानावर लक्ष केंद्रित करा",
    health_photo_tip_daylight: "दिवसाचा प्रकाश: तेजस्वी नैसर्गिक प्रकाशात फोटो काढा",
    health_photo_tip_closeup: "क्लोज-अप: पान स्पष्ट आणि फोकसमध्ये ठेवा",
    health_honest_model_note: "PlantVillage प्रयोगशाळेतील फोटोंवर प्रशिक्षित; शेतातील नैसर्गिक पार्श्वभूमीवर स्कोअर कमी असू शकतो.",
    health_unclear_title: "अस्पष्ट किंवा पानाव्यतिरिक्त फोटो",
    health_unclear_message: "आकलन करणे अशक्य: फोटो अस्पष्ट आहे किंवा पान ओळखता आले नाही. कृपया दिवसाच्या प्रकाशात स्पष्ट फोटो काढा.",
    health_likelihood_very_likely: "अतिशय संभाव्य",
    health_likelihood_likely: "संभाव्य",
    health_likelihood_possible: "शक्य",
    health_likelihood_unclear: "अस्पष्ट",
    health_top_3_heading: "शीर्ष संभाव्य परिस्थिती",
  },
  bn: {
    health_photo_tip_title: "সঠিক রোগনির্ণয়ের জন্য ছবির টিপস",
    health_photo_tip_single: "একটি পাতা: লক্ষণযুক্ত একটি মাত্র পাতায় ফোকাস করুন",
    health_photo_tip_daylight: "দিনের আলো: উজ্জ্বল প্রাকৃতিক আলোতে ছবি তুলুন",
    health_photo_tip_closeup: "কাছাকাছি ছবি: পাতাটি স্পষ্টভাবে ফ্রেমে রাখুন",
    health_honest_model_note: "PlantVillage ল্যাব ছবিতে প্রশিক্ষিত; মাঠের প্রাকৃতিক ছবিতে স্কোর কম হতে পারে।",
    health_unclear_title: "অস্পষ্ট বা পাতা ছাড়া ছবি",
    health_unclear_message: "মূল্যায়ন করা সম্ভব নয়: ছবিটি অস্পষ্ট বা পাতা চেনা যাচ্ছে না। অনুগ্রহ করে দিনের আলোয় একটি পরিষ্কার পাতার ছবি তুলুন।",
    health_likelihood_very_likely: "অত্যন্ত সম্ভাব্য",
    health_likelihood_likely: "সম্ভাব্য",
    health_likelihood_possible: "সম্ভব",
    health_likelihood_unclear: "অস্পষ্ট",
    health_top_3_heading: "শীর্ষ সম্ভাব্য অবস্থা",
  },
  gu: {
    health_photo_tip_title: "સચોટ નિદાન માટે ફોટો ટિપ્સ",
    health_photo_tip_single: "એક પાન: લક્ષણો વાળા એક જ પાન પર ધ્યાન કેન્દ્રિત કરો",
    health_photo_tip_daylight: "દિવસનો પ્રકાશ: કુદરતી દિવસના પ્રકાશમાં ફોટો લો",
    health_photo_tip_closeup: "ક્લોઝ-અપ: પાનને ફ્રેમમાં સ્પષ્ટ અને ફોકસમાં રાખો",
    health_honest_model_note: "PlantVillage લેબ ફોટો પર પ્રશિક્ષિત; ખેતરના કુદરતી ફોટામાં સ્કોર બદલાઈ શકે છે.",
    health_unclear_title: "અસ્પષ્ટ અથવા પાન વગરનો ફોટો",
    health_unclear_message: "મૂલ્યાંકન કરવામાં અસમર્થ: ફોટો અસ્પષ્ટ છે અથવા પાન ઓળખી શકાયું નથી. કૃપા કરીને દિવસના પ્રકાશમાં સ્પષ્ટ ફોટો લો.",
    health_likelihood_very_likely: "ખૂબ સંભવિત",
    health_likelihood_likely: "સંભવિત",
    health_likelihood_possible: "શક્ય",
    health_likelihood_unclear: "અસ્પષ્ટ",
    health_top_3_heading: "ટોચની સંભવિત પરિસ્થિતિઓ",
  },
  pa: {
    health_photo_tip_title: "ਸਹੀ ਨਿਦਾਨ ਲਈ ਫੋਟੋ ਸੁਝਾਅ",
    health_photo_tip_single: "ਇੱਕ ਪੱਤਾ: ਲੱਛਣਾਂ ਵਾਲੇ ਇੱਕ ਪੱਤੇ 'ਤੇ ਧਿਆਨ ਕੇਂਦਰਿਤ ਕਰੋ",
    health_photo_tip_daylight: "ਦਿਨ ਦੀ ਰੌਸ਼ਨੀ: ਕੁਦਰਤੀ ਦਿਨ ਦੀ ਰੌਸ਼ਨੀ ਵਿੱਚ ਫੋਟੋ ਲਓ",
    health_photo_tip_closeup: "ਕਲੋਜ਼-ਅੱਪ: ਪੱਤੇ ਨੂੰ ਫੋਕਸ ਵਿੱਚ ਸਪਸ਼ਟ ਰੱਖੋ",
    health_honest_model_note: "PlantVillage ਲੈਬ ਫੋਟੋਆਂ 'ਤੇ ਸਿਖਲਾਈ ਪ੍ਰਾਪਤ; ਖੇਤ ਦੀਆਂ ਫੋਟੋਆਂ ਵਿੱਚ ਸਕੋਰ ਵੱਖ ਹੋ ਸਕਦਾ ਹੈ।",
    health_unclear_title: "ਅਸਪਸ਼ਟ ਜਾਂ ਗੈਰ-ਪੱਤਾ ਫੋਟੋ",
    health_unclear_message: "ਮੁਲਾਂਕਣ ਕਰਨ ਵਿੱਚ ਅਸਮਰੱਥ: ਫੋਟੋ ਅਸਪਸ਼ਟ ਹੈ ਜਾਂ ਪੱਤਾ ਨਹੀਂ ਪਛਾਣਿਆ ਗਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਦਿਨ ਦੀ ਰੌਸ਼ਨੀ ਵਿੱਚ ਸਾਫ਼ ਫੋਟੋ ਲਓ।",
    health_likelihood_very_likely: "ਬਹੁਤ ਸੰਭਾਵੀ",
    health_likelihood_likely: "ਸੰਭਾਵੀ",
    health_likelihood_possible: "ਸੰਭਵ",
    health_likelihood_unclear: "ਅਸਪਸ਼ਟ",
    health_top_3_heading: "ਮੁੱਖ ਸੰਭਾਵੀ ਸਥਿਤੀਆਂ",
  },
};

const languages = ['en', 'ta', 'hi', 'te', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa'];

for (const lang of languages) {
  const filePath = path.join(LOCALES_DIR, `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const additions = NEW_KEYS[lang];
  for (const [k, v] of Object.entries(additions)) {
    data[k] = v;
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Updated ${lang}.json with ${Object.keys(additions).length} Phase 7 keys.`);
}

console.log('All locale files successfully updated.');
