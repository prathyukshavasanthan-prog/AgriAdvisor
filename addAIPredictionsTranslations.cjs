const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'frontend', 'src', 'i18n', 'locales');

const translations = {
  en: {
    dash_nav_ai: "AI Predictions",
    ai_page_title: "AI Agricultural Predictions & Advisory",
    ai_page_sub: "Dual-model machine learning insights customized to your field soil chemistry and real-time weather",
    ai_select_farm: "Select Farm Plot",
    ai_crop_heading: "Crop Recommendation Advisory",
    ai_irrigation_heading: "Precision Irrigation Advisory",
    ai_model1_source_note: "Based on real agricultural data (2,200 ICAR/ICFA soil & climate patterns)",
    ai_model2_source_note: "Adaptive machine learning model — continuously refines as more farm data is recorded over time",
    ai_no_farms_title: "No Farms Registered",
    ai_no_farms_sub: "Register your first farm plot with soil chemistry test values to access AI predictions."
  },
  ta: {
    dash_nav_ai: "AI கணிப்புகள்",
    ai_page_title: "AI வேளாண் கணிப்புகள் மற்றும் வழிகாட்டல்",
    ai_page_sub: "உங்கள் நிலத்தின் மண் வேதியியல் மற்றும் நிகழ்நேர வானிலைக்கு ஏற்ப கணக்கிடப்படும் இரட்டை AI மாதிரிகள்",
    ai_select_farm: "விவசாய நிலத்தைத் தேர்ந்தெடுக்கவும்",
    ai_crop_heading: "பயிர் பரிந்துரை வழிகாட்டல்",
    ai_irrigation_heading: "பாசன வழிகாட்டல்",
    ai_model1_source_note: "உண்மையான வேளாண் ஆராய்ச்சி தரவுகளின் அடிப்படையில் (2,200 ICAR/ICFA மண் மற்றும் வானிலை பதிவுகள்)",
    ai_model2_source_note: "கற்றல் மாதிரி — காலப்போக்கில் கூடுதல் களத் தரவுகள் சேரும்போது தொடர்ந்து துல்லியம் மேம்படும்",
    ai_no_farms_title: "பண்ணைகள் எதுவும் பதிவு செய்யப்படவில்லை",
    ai_no_farms_sub: "AI கணிப்புகளைப் பெற உங்கள் முதல் விவசாய நிலத்தை மண் பரிசோதனை அளவுகளுடன் பதிவு செய்யவும்."
  },
  hi: {
    dash_nav_ai: "AI भविष्यवाणियां",
    ai_page_title: "AI कृषि भविष्यवाणियां एवं परामर्श",
    ai_page_sub: "आपके खेत की मिट्टी के रसायन और वास्तविक समय के मौसम के अनुसार तैयार दोहरे मॉडल AI विश्लेषण",
    ai_select_farm: "खेत का चयन करें",
    ai_crop_heading: "फसल अनुशंसा परामर्श",
    ai_irrigation_heading: "सटीक सिंचाई परामर्श",
    ai_model1_source_note: "वास्तविक कृषि अनुसंधान डेटा पर आधारित (2,200 ICAR/ICFA मिट्टी एवं जलवायु रिकॉर्ड)",
    ai_model2_source_note: "अनुकूली मशीन लर्निंग मॉडल — समय के साथ खेत के अधिक डेटा दर्ज होने पर निरंतर बेहतर होता है",
    ai_no_farms_title: "कोई खेत पंजीकृत नहीं है",
    ai_no_farms_sub: "AI भविष्यवाणियां देखने के लिए मिट्टी परीक्षण मानों के साथ अपना पहला खेत पंजीकृत करें।"
  },
  te: {
    dash_nav_ai: "AI అంచనాలు",
    ai_page_title: "AI వ్యవసాయ అంచనాలు మరియు సలహాలు",
    ai_page_sub: "మీ పొలం నేల రసాయనాలు మరియు ప్రత్యక్ష వాతావరణానికి అనుగుణంగా రూపొందించిన డ్యూయల్ మోడల్ AI సలహాలు",
    ai_select_farm: "పొలాన్ని ఎంచుకోండి",
    ai_crop_heading: "పంట సిఫార్సు సలహా",
    ai_irrigation_heading: "ఖచ్చితమైన నీటిపారుదల సలహా",
    ai_model1_source_note: "నిరూపిత వ్యవసాయ పరిశోధన డేటా ఆధారంగా (2,200 ICAR/ICFA నేల మరియు వాతావరణ రికార్డులు)",
    ai_model2_source_note: "అడాప్టివ్ మెషిన్ లెర్నింగ్ మోడల్ — కాలక్రమేణా మరిన్ని పొలం వివరాలు నమోదయ్యే కొద్దీ మరింత మెరుగవుతుంది",
    ai_no_farms_title: "పొలాలు ఏవీ నమోదు కాలేదు",
    ai_no_farms_sub: "AI అంచనాలను పొందడానికి నేల పరీక్ష వివరాలతో మీ మొదటి పొలాన్ని నమోదు చేయండి."
  },
  kn: {
    dash_nav_ai: "AI ಮುನ್ಸೂಚನೆಗಳು",
    ai_page_title: "AI ಕೃಷಿ ಮುನ್ಸೂಚನೆಗಳು ಮತ್ತು ಸಲಹೆ",
    ai_page_sub: "ನಿಮ್ಮ ಜಮೀನಿನ ಮಣ್ಣಿನ ಗುಣಲಕ್ಷಣಗಳು ಮತ್ತು ನೈಜ-ಸಮಯದ ಹವಾಮಾನಕ್ಕೆ ತಕ್ಕಂತೆ ಸಿದ್ಧಪಡಿಸಿದ ಡ್ಯುಯಲ್ AI ಸಲಹೆ",
    ai_select_farm: "ಜಮೀನು ಆಯ್ಕೆಮಾಡಿ",
    ai_crop_heading: "ಬೆಳೆ ಶಿಫಾರಸು ಸಲಹೆ",
    ai_irrigation_heading: "ನಿಖರ ನೀರಾವರಿ ಸಲಹೆ",
    ai_model1_source_note: "ನೈಜ ಕೃಷಿ ಸಂಶೋಧನಾ ದತ್ತಾಂಶದ ಆಧಾರದ ಮೇಲೆ (2,200 ICAR/ICFA ಮಣ್ಣು ಮತ್ತು ಹವಾಮಾನ ದಾಖಲೆಗಳು)",
    ai_model2_source_note: "ಅಡಾಪ್ಟಿವ್ ಕಲಿಕಾ ಮಾದರಿ — ಕಾಲಕ್ರಮೇಣ ಹೆಚ್ಚಿನ ಜಮೀನಿನ ವಿವರ ದಾಖಲಾದಂತೆ ನಿಖರತೆ ಸುಧಾರಿಸುತ್ತದೆ",
    ai_no_farms_title: "ಯಾವುದೇ ಜಮೀನು ನೋಂದಾಯಿಸಿಲ್ಲ",
    ai_no_farms_sub: "AI ಮುನ್ಸೂಚನೆಗಳನ್ನು ಪಡೆಯಲು ಮಣ್ಣಿನ ಪರೀಕ್ಷಾ ಮೌಲ್ಯಗಳೊಂದಿಗೆ ನಿಮ್ಮ ಮೊದಲ ಜಮೀನನ್ನು ನೋಂದಾಯಿಸಿ."
  },
  ml: {
    dash_nav_ai: "AI പ്രവചനങ്ങൾ",
    ai_page_title: "AI കാർഷിക പ്രവചനങ്ങളും ഉപദേശങ്ങളും",
    ai_page_sub: "നിങ്ങളുടെ കൃഷിയിടത്തിലെ മണ്ണിന്റെ ഘടനയ്ക്കും കാലാവസ്ഥയ്ക്കും അനുയോജ്യമായ ഡ്യുവൽ മോഡൽ AI നിർദ്ദേശങ്ങൾ",
    ai_select_farm: "കൃഷിയിടം തിരഞ്ഞെടുക്കുക",
    ai_crop_heading: "വിള ശുപാർശ ഉപദേശം",
    ai_irrigation_heading: "കൃത്യതാ ജലസേചന ഉപദേശം",
    ai_model1_source_note: "യഥാർത്ഥ കാർഷിക ഗവേഷണ വിവരങ്ങളെ അടിസ്ഥാനമാക്കി (2,200 ICAR/ICFA മണ്ണും കാലാവസ്ഥാ രേഖകളും)",
    ai_model2_source_note: "അഡാപ്റ്റീവ് മെഷീൻ ലേണിംഗ് മോഡൽ — കൂടുതൽ വിവരങ്ങൾ രേഖപ്പെടുത്തുന്നതിനനുസരിച്ച് കാലക്രമേണ കൂടുതൽ മെച്ചപ്പെടും",
    ai_no_farms_title: "കൃഷിയിടങ്ങൾ രജിസ്റ്റർ ചെയ്തിട്ടില്ല",
    ai_no_farms_sub: "AI പ്രവചനങ്ങൾ ലഭിക്കുന്നതിന് മണ്ണുപരിശോധനാ ഫലങ്ങളോടെ നിങ്ങളുടെ ആദ്യ കൃഷിയിടം രജിസ്റ്റർ ചെയ്യുക."
  },
  mr: {
    dash_nav_ai: "AI अंदाज",
    ai_page_title: "AI कृषी अंदाज आणि सल्लागार",
    ai_page_sub: "आपल्या शेतातील मातीचे घटक आणि हवामानानुसार तयार केलेले ड्युअल मॉडेल AI विश्लेषण",
    ai_select_farm: "शेत निवडा",
    ai_crop_heading: "पीक शिफारस सल्ला",
    ai_irrigation_heading: "अचूक सिंचन सल्ला",
    ai_model1_source_note: "प्रत्यक्ष कृषी संशोधन डेटावर आधारित (2,200 ICAR/ICFA माती व हवामान नोंदी)",
    ai_model2_source_note: "अ‍ॅडॉप्टिव्ह मशीन लर्निंग मॉडेल — वेळोवेळी अधिक शेती डेटा नोंदवला गेल्याने अचूकता वाढते",
    ai_no_farms_title: "कोणतीही शेती नोंदणीकृत नाही",
    ai_no_farms_sub: "AI अंदाज पाहण्यासाठी माती परीक्षण मूल्यांसह आपले पहिले शेत नोंदवा."
  },
  bn: {
    dash_nav_ai: "AI পূর্বাভাস",
    ai_page_title: "AI কৃষি পূর্বাভাস ও পরামর্শ",
    ai_page_sub: "আপনার জমির মাটির উপাদান এবং বাস্তব আবহাওয়ার উপর ভিত্তি করে তৈরি দ্বৈত এআই অন্তর্দৃষ্টি",
    ai_select_farm: "খামার নির্বাচন করুন",
    ai_crop_heading: "ফসল সুপারিশ পরামর্শ",
    ai_irrigation_heading: "নির্ভুল সেচ পরামর্শ",
    ai_model1_source_note: "বাস্তব কৃষি গবেষণা তথ্যের উপর ভিত্তি করে (২,২০০টি ICAR/ICFA মাটি ও আবহাওয়া রেকর্ড)",
    ai_model2_source_note: "অভিযোজিত মেশিন লার্নিంగ్ মডেল — সময়ের সাথে সাথে খামারের তথ্য যুক্ত হওয়ার সাথে সাথে আরও উন্নত হয়",
    ai_no_farms_title: "কোন খামার নিবন্ধিত নেই",
    ai_no_farms_sub: "AI পূর্বাভাস দেখতে মাটি পরীক্ষার মান সহ আপনার প্রথম খামারটি নিবন্ধন করুন।"
  },
  gu: {
    dash_nav_ai: "AI આગાહીઓ",
    ai_page_title: "AI કૃષિ આગાહી અને સલાહ",
    ai_page_sub: "તમારા ખેતરની જમીનના ઘટકો અને જીવંત હવામાન અનુસાર બનાવેલ દ્વિ-મોડેલ AI વિશ્લેષણ",
    ai_select_farm: "ખેતર પસંદ કરો",
    ai_crop_heading: "પાક ભલામણ સલાહ",
    ai_irrigation_heading: "ચોક્કસ પિયત સલાહ",
    ai_model1_source_note: "વાસ્તવિક કૃષિ સંશોધન ડેટા આધારિત (2,200 ICAR/ICFA જમીન અને આબોહવા રેકોર્ડ)",
    ai_model2_source_note: "અનુકૂલનશીલ મશીન લર્નિંગ મોડેલ — સમય સાથે વધુ ખેતર ડેટા ઉમેરાતા સતત સુધરે છે",
    ai_no_farms_title: "કોઈ ખેતર નોંધાયેલ નથી",
    ai_no_farms_sub: "AI આગાહીઓ મેળવવા માટે જમીન ચકાસણી આંકડાઓ સાથે તમારું પ્રથમ ખેતર નોંધો."
  },
  pa: {
    dash_nav_ai: "AI ਭਵਿੱਖਬਾਣੀਆਂ",
    ai_page_title: "AI ਖੇਤੀਬਾੜੀ ਭਵਿੱਖਬਾਣੀਆਂ ਅਤੇ ਸਲਾਹ",
    ai_page_sub: "ਤੁਹਾਡੇ ਖੇਤ ਦੀ ਮਿੱਟੀ ਦੇ ਤੱਤਾਂ ਅਤੇ ਤਾਜ਼ਾ ਮੌਸਮ ਅਨੁਸਾਰ ਤਿਆਰ ਕੀਤੇ ਦੋਹਰੇ ਮਾਡਲ AI ਸੁਝਾਅ",
    ai_select_farm: "ਖੇਤ ਚੁਣੋ",
    ai_crop_heading: "ਫਸਲ ਸਿਫਾਰਸ਼ ਸਲਾਹ",
    ai_irrigation_heading: "ਸਟੀਕ ਸਿੰਚਾਈ ਸਲਾਹ",
    ai_model1_source_note: "ਅਸਲ ਖੇਤੀਬਾੜੀ ਖੋਜ ਡੇਟਾ 'ਤੇ ਆਧਾਰਿਤ (2,200 ICAR/ICFA ਮਿੱਟੀ ਅਤੇ ਜਲਵਾਯੂ ਰਿਕਾਰਡ)",
    ai_model2_source_note: "ਅਡੈਪਟਿਵ ਮਸ਼ੀਨ ਲਰਨਿੰਗ ਮਾਡਲ — ਸਮੇਂ ਦੇ ਨਾਲ ਹੋਰ ਖੇਤ ਡੇਟਾ ਦਰਜ ਹੋਣ 'ਤੇ ਲਗਾਤਾਰ ਬਿਹਤਰ ਹੁੰਦਾ ਹੈ",
    ai_no_farms_title: "ਕੋਈ ਖੇਤ ਰਜਿਸਟਰ ਨਹੀਂ ਹੈ",
    ai_no_farms_sub: "AI ਭਵਿੱਖਬਾਣੀਆਂ ਪ੍ਰਾਪਤ ਕਰਨ ਲਈ ਮਿੱਟੀ ਪਰਖ ਮੁੱਲਾਂ ਨਾਲ ਆਪਣਾ ਪਹਿਲਾ ਖੇਤ ਰਜਿਸਟਰ ਕਰੋ।"
  }
};

for (const [lang, newKeys] of Object.entries(translations)) {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (fs.existsSync(filePath)) {
    const original = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const merged = { ...original, ...newKeys };
    fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
    console.log(`Updated ${lang}.json with AI Predictions keys.`);
  }
}

console.log('Successfully updated all 10 language files!');
