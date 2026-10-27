const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../frontend/src/i18n/locales');

const newTranslations = {
  en: {
    map_layer_outbreaks: "Disease Alerts",
    outbreak_layer_desc: "Nearby community disease reports",
    outbreak_community_badge: "Community Outbreak",
    outbreak_demo_tag: "Demo Data",
    outbreak_banner_headline: "Disease reported {{distance}} km from your {{crop}} farm ({{farm}})",
    outbreak_concern_label: "Reported Concern",
    outbreak_days_ago: "{{count}} days ago",
    outbreak_view_on_map_btn: "View on Farm Map",
    outbreak_popup_title: "Community Disease Alert",
    outbreak_distance_from_farm: "{{distance}} km away from your plot",
    outbreak_guidance_title: "Agronomic Guidance",
    outbreak_guidance_disclaimer: "Category-level guidance only. Consult your local agriculture extension officer.",
    outbreak_panel_title: "Nearby Disease Outbreaks (10 km Radius)",
    outbreak_panel_empty: "No active disease outbreaks reported within 10 km for this crop.",
    mandi_locate_btn: "Locate on Map",
  },
  ta: {
    map_layer_outbreaks: "நோய் எச்சரிக்கைகள்",
    outbreak_layer_desc: "சமூக நோய் அறிக்கைகள்",
    outbreak_community_badge: "சமூக நோய் பரவல்",
    outbreak_demo_tag: "மாதிரி தரவு",
    outbreak_banner_headline: "உங்கள் {{farm}} பண்ணையிலிருந்து {{distance}} கி.மீ தூரத்தில் {{crop}} பயிரில் நோய் கண்டறியப்பட்டுள்ளது",
    outbreak_concern_label: "அறிவிக்கப்பட்ட பிரச்சினை",
    outbreak_days_ago: "{{count}} நாட்களுக்கு முன்",
    outbreak_view_on_map_btn: "பண்ணை வரைபடத்தில் காண்க",
    outbreak_popup_title: "சமூக பயிர் நோய் எச்சரிக்கை",
    outbreak_distance_from_farm: "உங்கள் நிலத்திலிருந்து {{distance}} கி.மீ தூரம்",
    outbreak_guidance_title: "வேளாண் ஆலோசனை",
    outbreak_guidance_disclaimer: "வகை அளவிலான வழிகாட்டுதல் மட்டுமே. உங்கள் உள்ளூர் வேளாண்மை அலுவலரை அணுகவும்.",
    outbreak_panel_title: "அருகிலுள்ள நோய் பரவல்கள் (10 கி.மீ சுற்றளவு)",
    outbreak_panel_empty: "இந்த பயிருக்கு 10 கி.மீ சுற்றளவில் தீவிர நோய் பரவல் எதுவும் பதிவாகவில்லை.",
    mandi_locate_btn: "வரைபடத்தில் காண்க",
  },
  hi: {
    map_layer_outbreaks: "रोग प्रकोप अलर्ट",
    outbreak_layer_desc: "सामुदायिक रोग रिपोर्ट",
    outbreak_community_badge: "सामुदायिक प्रकोप",
    outbreak_demo_tag: "डेमो डेटा",
    outbreak_banner_headline: "आपके {{farm}} खेत से {{distance}} किमी दूर {{crop}} में रोग की सूचना मिली है",
    outbreak_concern_label: "दर्ज की गई समस्या",
    outbreak_days_ago: "{{count}} दिन पहले",
    outbreak_view_on_map_btn: "खेत मानचित्र पर देखें",
    outbreak_popup_title: "सामुदायिक फसल रोग अलर्ट",
    outbreak_distance_from_farm: "आपके खेत से {{distance}} किमी दूर",
    outbreak_guidance_title: "कृषि परामर्श",
    outbreak_guidance_disclaimer: "केवल श्रेणी-स्तरीय मार्गदर्शन। अपने स्थानीय कृषि अधिकारी से परामर्श लें।",
    outbreak_panel_title: "निकटवर्ती रोग प्रकोप (10 किमी दायरा)",
    outbreak_panel_empty: "इस फसल के लिए 10 किमी के भीतर कोई सक्रिय रोग प्रकोप दर्ज नहीं है।",
    mandi_locate_btn: "मानचित्र पर देखें",
  },
  te: {
    map_layer_outbreaks: "తెగులు హెచ్చరికలు",
    outbreak_layer_desc: "కమ్యూనిటీ తెగులు నివేదికలు",
    outbreak_community_badge: "కమ్యూనిటీ ప్రకోపం",
    outbreak_demo_tag: "డెమో డేటా",
    outbreak_banner_headline: "మీ {{farm}} పొలం నుండి {{distance}} కి.మీ దూరంలో {{crop}} లో తెగులు నమోదైంది",
    outbreak_concern_label: "నమోదైన సమస్య",
    outbreak_days_ago: "{{count}} రోజుల క్రితం",
    outbreak_view_on_map_btn: "పొలం మ్యాప్‌లో చూడండి",
    outbreak_popup_title: "కమ్యూనిటీ పంట తెగులు హెచ్చరిక",
    outbreak_distance_from_farm: "మీ పొలం నుండి {{distance}} కి.మీ దూరం",
    outbreak_guidance_title: "వ్యవసాయ మార్గదర్శకత్వం",
    outbreak_guidance_disclaimer: "వర్గ-స్థాయి మార్గదర్శకత్వం మాత్రమే. మీ స్థానిక వ్యవసాయ అధికారిని సంప్రదించండి.",
    outbreak_panel_title: "సమీప తెగులు ప్రకోపాలు (10 కి.మీ పరిధి)",
    outbreak_panel_empty: "ఈ పంటకు 10 కి.మీ పరిధిలో ఎటువంటి తెగులు ప్రకోపం నమోదు కాలేదు.",
    mandi_locate_btn: "మ్యాప్‌లో గుర్తించండి",
  },
  kn: {
    map_layer_outbreaks: "ರೋಗ ಎಚ್ಚರಿಕೆಗಳು",
    outbreak_layer_desc: "ಸಮುದಾಯ ರೋಗ ವರದಿಗಳು",
    outbreak_community_badge: "ಸಮುದಾಯ ರೋಗ ಹರಡುವಿಕೆ",
    outbreak_demo_tag: "ಮಾದರಿ ಡೇಟಾ",
    outbreak_banner_headline: "ನಿಮ್ಮ {{farm}} ಜಮೀನಿನಿಂದ {{distance}} ಕಿ.ಮೀ ದೂರದಲ್ಲಿ {{crop}} ಬೆಳೆಗೆ ರೋಗ ವರದಿಯಾಗಿದೆ",
    outbreak_concern_label: "ವರದಿಯಾದ ಸಮಸ್ಯೆ",
    outbreak_days_ago: "{{count}} ದಿನಗಳ ಹಿಂದೆ",
    outbreak_view_on_map_btn: "ಜಮೀನು ನಕ್ಷೆಯಲ್ಲಿ ವೀಕ್ಷಿಸಿ",
    outbreak_popup_title: "ಸಮುದಾಯ ಬೆಳೆ ರೋಗ ಎಚ್ಚರಿಕೆ",
    outbreak_distance_from_farm: "ನಿಮ್ಮ ಜಮೀನಿನಿಂದ {{distance}} ಕಿ.ಮೀ ದೂರ",
    outbreak_guidance_title: "ಕೃಷಿ ಮಾರ್ಗದರ್ಶನ",
    outbreak_guidance_disclaimer: "ವರ್ಗ ಮಟ್ಟದ ಮಾರ್ಗದರ್ಶನ ಮಾತ್ರ. ನಿಮ್ಮ ಸ್ಥಳೀಯ ಕೃಷಿ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    outbreak_panel_title: "ಹತ್ತಿರದ ರೋಗ ಹರಡುವಿಕೆಗಳು (10 ಕಿ.ಮೀ ವ್ಯಾಪ್ತಿ)",
    outbreak_panel_empty: "ಈ ಬೆಳೆಗೆ 10 ಕಿ.ಮೀ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಯಾವುದೇ ಸಕ್ರಿಯ ರೋಗ ವರದಿಯಾಗಿಲ್ಲ.",
    mandi_locate_btn: "ನಕ್ಷೆಯಲ್ಲಿ ಗುರುತಿಸಿ",
  },
  ml: {
    map_layer_outbreaks: "രോഗ മുന്നറിയിപ്പുകൾ",
    outbreak_layer_desc: "കമ്മ്യൂണിറ്റി രോഗ റിപ്പോർട്ടുകൾ",
    outbreak_community_badge: "കമ്മ്യൂണിറ്റി വ്യാപനം",
    outbreak_demo_tag: "ഡെമോ ഡാറ്റ",
    outbreak_banner_headline: "നിങ്ങളുടെ {{farm}} തോട്ടത്തിൽ നിന്ന് {{distance}} കി.മീ അകലെ {{crop}} വിളയിൽ രോഗം കണ്ടെത്തി",
    outbreak_concern_label: "റിപ്പോർട്ട് ചെയ്ത പ്രശ്നം",
    outbreak_days_ago: "{{count}} ദിവസങ്ങൾക്ക് മുമ്പ്",
    outbreak_view_on_map_btn: "ഫാം മാപ്പിൽ കാണുക",
    outbreak_popup_title: "കമ്മ്യൂണിറ്റി വിള രോഗ മുന്നറിയിപ്പ്",
    outbreak_distance_from_farm: "നിങ്ങളുടെ തോട്ടത്തിൽ നിന്ന് {{distance}} കി.മീ ദൂരം",
    outbreak_guidance_title: "കാർഷിക നിർദ്ദേശം",
    outbreak_guidance_disclaimer: "വിഭാഗ തലത്തിലുള്ള മാർഗ്ഗനിർദ്ദേശം മാത്രം. നിങ്ങളുടെ പ്രാദേശിക കൃഷി ഓഫീസറെ സമീപിക്കുക.",
    outbreak_panel_title: "സമീപത്തെ രോഗവ്യാപനങ്ങൾ (10 കി.മീ പരിധി)",
    outbreak_panel_empty: "ഈ വിളയ്ക്ക് 10 കി.മീ പരിധിക്കുള്ളിൽ സജീവ രോഗവ്യാപനങ്ങളൊന്നും റിപ്പോർട്ട് ചെയ്തിട്ടില്ല.",
    mandi_locate_btn: "മാപ്പിൽ കണ്ടെത്തുക",
  },
  mr: {
    map_layer_outbreaks: "रोग उद्रेक सूचना",
    outbreak_layer_desc: "समुदाय रोग अहवाल",
    outbreak_community_badge: "सामुदायिक उद्रेक",
    outbreak_demo_tag: "डेमो डेटा",
    outbreak_banner_headline: "तुमच्या {{farm}} शेतापासून {{distance}} किमी अंतरावर {{crop}} पिकात रोग आढळला आहे",
    outbreak_concern_label: "नोंदवलेली समस्या",
    outbreak_days_ago: "{{count}} दिवसांपूर्वी",
    outbreak_view_on_map_btn: "शेत नकाशावर पहा",
    outbreak_popup_title: "सामुदायिक पीक रोग सूचना",
    outbreak_distance_from_farm: "तुमच्या शेतापासून {{distance}} किमी अंतरावर",
    outbreak_guidance_title: "कृषी सल्ला",
    outbreak_guidance_disclaimer: "केवळ वर्ग-स्तरीय मार्गदर्शन. आपल्या स्थानिक कृषी अधिकाऱ्याचा सल्ला घ्या.",
    outbreak_panel_title: "जवळपासचे रोग उद्रेक (10 किमी त्रिज्या)",
    outbreak_panel_empty: "या पिकासाठी 10 किमीच्या आत कोणताही सक्रिय रोग उद्रेक नोंदवला गेलेला नाही.",
    mandi_locate_btn: "नकाशावर शोधा",
  },
  bn: {
    map_layer_outbreaks: "রোগ প্রাদুর্ভাব সতর্কতা",
    outbreak_layer_desc: "কমিউনিটি রোগ প্রতিবেদন",
    outbreak_community_badge: "কমিউনিটি প্রাদুর্ভাব",
    outbreak_demo_tag: "ডেমো ডেটা",
    outbreak_banner_headline: "আপনার {{farm}} খামার থেকে {{distance}} কিমি দূরে {{crop}} ফসলে রোগ রিপোর্ট করা হয়েছে",
    outbreak_concern_label: "রিপোর্ট করা সমস্যা",
    outbreak_days_ago: "{{count}} দিন আগে",
    outbreak_view_on_map_btn: "খামার মানচিত্রে দেখুন",
    outbreak_popup_title: "কমিউনিটি ফসল রোগ সতর্কতা",
    outbreak_distance_from_farm: "আপনার জমি থেকে {{distance}} কিমি দূরে",
    outbreak_guidance_title: "কৃষি পরামর্শ",
    outbreak_guidance_disclaimer: "শুধুমাত্র বিভাগ-স্তরের নির্দেশনা। আপনার স্থানীয় কৃষি কর্মকর্তার সাথে পরামর্শ করুন।",
    outbreak_panel_title: "কাছাকাছি রোগ প্রাদুর্ভাব (10 কিমি ব্যাসার্ধ)",
    outbreak_panel_empty: "এই ফসলের জন্য 10 কিলোমিটারের মধ্যে কোনও সক্রিয় রোগের প্রাদুর্ভাব রিপোর্ট করা হয়নি।",
    mandi_locate_btn: "মানচিত্রে সনাক্ত করুন",
  },
  gu: {
    map_layer_outbreaks: "રોગ પ્રકોપ ચેતવણીઓ",
    outbreak_layer_desc: "સમુદાય રોગ અહેવાલો",
    outbreak_community_badge: "સમુદાય પ્રકોપ",
    outbreak_demo_tag: "ડેમો ડેટા",
    outbreak_banner_headline: "તમારા {{farm}} ખેતરથી {{distance}} કિમી દૂર {{crop}} પાકમાં રોગ નોંધાયો છે",
    outbreak_concern_label: "નોંધાયેલી સમસ્યા",
    outbreak_days_ago: "{{count}} દિવસો પહેલા",
    outbreak_view_on_map_btn: "ખેતર નકશા પર જુઓ",
    outbreak_popup_title: "સમુદાય પાક રોગ ચેતવણી",
    outbreak_distance_from_farm: "તમારા ખેતરથી {{distance}} કિમી દૂર",
    outbreak_guidance_title: "કૃષિ સલાહ",
    outbreak_guidance_disclaimer: "માત્ર શ્રેણી-સ્તરનું માર્ગદર્શન. તમારા સ્થાનિક કૃષિ અધિકારીની સલાહ લો.",
    outbreak_panel_title: "નજીકના રોગ પ્રકોપ (10 કિમી ત્રિજ્યા)",
    outbreak_panel_empty: "આ પાક માટે 10 કિમીની અંદર કોઈ સક્રિય રોગ પ્રકોપ નોંધાયો નથી.",
    mandi_locate_btn: "નકશા પર શોધો",
  },
  pa: {
    map_layer_outbreaks: "ਬਿਮਾਰੀ ਚੇਤਾਵਨੀਆਂ",
    outbreak_layer_desc: "ਭਾਈਚਾਰਕ ਬਿਮਾਰੀ ਰਿਪੋਰਟਾਂ",
    outbreak_community_badge: "ਭਾਈਚਾਰਕ ਫੈਲਾਅ",
    outbreak_demo_tag: "ਡੈਮੋ ਡੇਟਾ",
    outbreak_banner_headline: "ਤੁਹਾਡੇ {{farm}} ਖੇਤ ਤੋਂ {{distance}} ਕਿਲੋਮੀਟਰ ਦੂਰ {{crop}} ਵਿੱਚ ਬਿਮਾਰੀ ਦੀ ਰਿਪੋਰਟ ਕੀਤੀ ਗਈ ਹੈ",
    outbreak_concern_label: "ਦਰਜ ਕੀਤੀ ਗਈ ਸਮੱਸਿਆ",
    outbreak_days_ago: "{{count}} ਦਿਨ ਪਹਿਲਾਂ",
    outbreak_view_on_map_btn: "ਖੇਤ ਨਕਸ਼ੇ 'ਤੇ ਵੇਖੋ",
    outbreak_popup_title: "ਭਾਈਚਾਰਕ ਫਸਲ ਬਿਮਾਰੀ ਚੇਤਾਵਨੀ",
    outbreak_distance_from_farm: "ਤੁਹਾਡੇ ਖੇਤ ਤੋਂ {{distance}} ਕਿਲੋਮੀਟਰ ਦੂਰ",
    outbreak_guidance_title: "ਖੇਤੀਬਾੜੀ ਸਲਾਹ",
    outbreak_guidance_disclaimer: "ਸਿਰਫ਼ ਸ਼੍ਰੇਣੀ-ਪੱਧਰੀ ਮਾਰਗਦਰਸ਼ਨ। ਆਪਣੇ ਸਥਾਨਕ ਖੇਤੀਬਾੜੀ ਅਧਿਕਾਰੀ ਨਾਲ ਸਲਾਹ ਕਰੋ।",
    outbreak_panel_title: "ਨੇੜਲੇ ਬਿਮਾਰੀ ਫੈਲਾਅ (10 ਕਿਲੋਮੀਟਰ ਘੇਰਾ)",
    outbreak_panel_empty: "ਇਸ ਫਸਲ ਲਈ 10 ਕਿਲੋਮੀਟਰ ਦੇ ਦਾਇਰੇ ਵਿੱਚ ਕੋਈ ਸਰਗਰਮ ਬਿਮਾਰੀ ਫੈਲਣ ਦੀ ਰਿਪੋਰਟ ਨਹੀਂ ਹੈ।",
    mandi_locate_btn: "ਨਕਸ਼ੇ 'ਤੇ ਲੱਭੋ",
  },
};

const languages = ['en', 'ta', 'hi', 'te', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa'];

languages.forEach((lang) => {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const toAdd = newTranslations[lang] || newTranslations['en'];

  let addedCount = 0;
  for (const [key, val] of Object.entries(toAdd)) {
    if (!content[key]) {
      content[key] = val;
      addedCount++;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
  console.log(`Updated ${lang}.json: added ${addedCount} keys. Total keys: ${Object.keys(content).length}`);
});

console.log('Finished updating all language files!');
