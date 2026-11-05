const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../frontend/src/i18n/locales');
const languages = ['en', 'ta', 'hi', 'te', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa'];

const translations = {
  en: {
    action_hold_rain_coming: "Hold (Rain Coming)",
    action_irrigate_in_2_3_days: "Irrigate in 2–3 Days",
    action_irrigate_now: "Irrigate Now",
    action_not_needed: "Not Needed",
    action_conserve_soil_moisture: "Conserve Soil Moisture",
    btn_watered_today: "I Watered Today",
    btn_watered_today_success: "Watering recorded today. Moisture balance updated.",
    data_source_fao56_badge: "FAO-56 Agronomic Simulation",
    ai_model2_fao_source_note: "Trained on an agronomic simulation with real historical weather across 30 Indian locations (FAO-56 Penman-Monteith daily water balance).",
    ai_soil_depletion_label: "Root-Zone Water Depletion",
    ai_rainfed_advisory_title: "Rainfed Land Advisory"
  },
  ta: {
    action_hold_rain_coming: "தண்ணீர் பாய்ச்ச வேண்டாம் (மழை வரவுள்ளது)",
    action_irrigate_in_2_3_days: "2–3 நாட்களில் தண்ணீர் பாய்ச்சவும்",
    action_irrigate_now: "உடனடியாக தண்ணீர் பாய்ச்சவும்",
    action_not_needed: "தண்ணீர் தேவையில்லை",
    action_conserve_soil_moisture: "மண் ஈரப்பதத்தைப் பாதுகாக்கவும்",
    btn_watered_today: "இன்று தண்ணீர் பாய்ச்சினேன்",
    btn_watered_today_success: "இன்றைய தண்ணீர் பாய்ச்சல் பதிவு செய்யப்பட்டது. ஈரப்பதம் புதுப்பிக்கப்பட்டது.",
    data_source_fao56_badge: "FAO-56 வேளாண் அறிவியல் மாதிரி",
    ai_model2_fao_source_note: "30 இந்தியப் பகுதிகளின் உண்மையான வானிலை மற்றும் FAO-56 சமன்பாடுகளின் அடிப்படையில் உருவகப்படுத்தப்பட்ட மாதிரி.",
    ai_soil_depletion_label: "வேர்ப் பகுதி நீர் இழப்பு",
    ai_rainfed_advisory_title: "மானாவாரி நில ஆலோசனை"
  },
  hi: {
    action_hold_rain_coming: "सिंचाई रोकें (बारिश आने वाली है)",
    action_irrigate_in_2_3_days: "2-3 दिनों में सिंचाई करें",
    action_irrigate_now: "अभी सिंचाई करें",
    action_not_needed: "सिंचाई की आवश्यकता नहीं है",
    action_conserve_soil_moisture: "मिट्टी की नमी सुरक्षित रखें",
    btn_watered_today: "मैंने आज पानी दिया",
    btn_watered_today_success: "आज की सिंचाई दर्ज हो गई। नमी संतुलन अपडेट किया गया।",
    data_source_fao56_badge: "FAO-56 कृषि विज्ञान मॉडल",
    ai_model2_fao_source_note: "30 भारतीय स्थानों के वास्तविक मौसम और FAO-56 जल संतुलन मॉडल पर प्रशिक्षित।",
    ai_soil_depletion_label: "जड़ क्षेत्र में पानी की कमी",
    ai_rainfed_advisory_title: "वर्षा आधारित (बारानी) सलाह"
  },
  te: {
    action_hold_rain_coming: "నీరు పెట్టవద్దు (వర్షం రాబోతోంది)",
    action_irrigate_in_2_3_days: "2–3 రోజుల్లో నీరు పెట్టండి",
    action_irrigate_now: "ఇప్పుడే నీరు పెట్టండి",
    action_not_needed: "నీరు అవసరం లేదు",
    action_conserve_soil_moisture: "నేల తేమను కాపాడండి",
    btn_watered_today: "నేను ఈరోజు నీరు పెట్టాను",
    btn_watered_today_success: "ఈరోజు నీటి తడి నమోదు చేయబడింది. తేమ సమతుల్యత నవీకరించబడింది.",
    data_source_fao56_badge: "FAO-56 వ్యవసాయ శాస్త్ర నమూనా",
    ai_model2_fao_source_note: "30 భారతీయ ప్రాంతాల వాస్తవ వాతావరణం మరియు FAO-56 ఆధారిత నమూనా.",
    ai_soil_depletion_label: "వేరు మండలంలో నీటి కొరత",
    ai_rainfed_advisory_title: "వర్షాధార భూమి సలహా"
  },
  kn: {
    action_hold_rain_coming: "ನೀರಾವರಿ ಮುಂದೂಡಿ (ಮಳೆ ನಿರೀಕ್ಷಿತ)",
    action_irrigate_in_2_3_days: "2–3 ದಿನಗಳಲ್ಲಿ ನೀರು ಹಾಯಿಸಿ",
    action_irrigate_now: "ಈಗಲೇ ನೀರು ಹಾಯಿಸಿ",
    action_not_needed: "ನೀರಿನ ಅಗತ್ಯವಿಲ್ಲ",
    action_conserve_soil_moisture: "ಮಣ್ಣಿನ ತೇವಾಂಶ ಉಳಿಸಿ",
    btn_watered_today: "ನಾನು ಇಂದು ನೀರು ಹಾಯಿಸಿದ್ದೇನೆ",
    btn_watered_today_success: "ಇಂದಿನ ನೀರಾವರಿ ದಾಖಲಾಗಿದೆ. ತೇವಾಂಶ ಸಮತೋಲನ ನವೀಕರಿಸಲಾಗಿದೆ.",
    data_source_fao56_badge: "FAO-56 ಕೃಷಿ ವಿಜ್ಞಾನ ಮಾದರಿ",
    ai_model2_fao_source_note: "30 ಭಾರತೀಯ ಸ್ಥಳಗಳ ನೈಜ ಹವಾಮಾನ ಮತ್ತು FAO-56 ನೀರಿನ ಸಮತೋಲನ ಆಧರಿತ ತರಬೇತಿ.",
    ai_soil_depletion_label: "ಬೇರು ವಲಯದ ನೀರಿನ ಕೊರತೆ",
    ai_rainfed_advisory_title: "ಮಳೆಯಾಶ್ರಿತ ಭೂಮಿ ಸಲಹೆ"
  },
  ml: {
    action_hold_rain_coming: "നനയ്ക്കേണ്ടതില്ല (മഴ വരുന്നു)",
    action_irrigate_in_2_3_days: "2–3 ദിവസത്തിനുള്ളിൽ നനയ്ക്കുക",
    action_irrigate_now: "ഉടൻ നനയ്ക്കുക",
    action_not_needed: "നനയ്ക്കേണ്ടതില്ല",
    action_conserve_soil_moisture: "മണ്ണിലെ ഈർപ്പം സംരക്ഷിക്കുക",
    btn_watered_today: "ഞാൻ ഇന്ന് നനച്ചു",
    btn_watered_today_success: "ഇന്നത്തെ നന രേഖപ്പെടുത്തി. ഈർപ്പത്തിന്റെ അളവ് പുതുക്കി.",
    data_source_fao56_badge: "FAO-56 കാർഷിക ശാസ്ത്ര മാതൃക",
    ai_model2_fao_source_note: "30 ഇന്ത്യൻ പ്രദേശങ്ങളിലെ യഥാർത്ഥ കാലാവസ്ഥയും FAO-56 മാതൃകയും അടിസ്ഥാനമാക്കി പരിശീലിപ്പിച്ചത്.",
    ai_soil_depletion_label: "വേരുപടലത്തിലെ ജലക്ഷാമം",
    ai_rainfed_advisory_title: "മഴയെ ആശ്രയിക്കുന്ന ഭൂമി ഉപദേശം"
  },
  mr: {
    action_hold_rain_coming: "पाणी देणे थांबवा (पाऊस येणार आहे)",
    action_irrigate_in_2_3_days: "2–3 दिवसांत पाणी द्या",
    action_irrigate_now: "आत्ताच पाणी द्या",
    action_not_needed: "पाण्याची गरज नाही",
    action_conserve_soil_moisture: "जमिनीतील ओलावा टिकवा",
    btn_watered_today: "मी आज पाणी दिले",
    btn_watered_today_success: "आजचे पाणी नोंदवले गेले. ओलावा समतोल अद्यतनित झाला.",
    data_source_fao56_badge: "FAO-56 कृषी विज्ञान मॉडेल",
    ai_model2_fao_source_note: "30 भारतीय ठिकाणांच्या वास्तविक हवामान आणि FAO-56 पाण्याच्या समतोलावर प्रशिक्षित.",
    ai_soil_depletion_label: "मूळ क्षेत्रातील पाण्याचा तुटवडा",
    ai_rainfed_advisory_title: "कोरडवाहू शेती सल्ला"
  },
  bn: {
    action_hold_rain_coming: "সেচ স্থগিত রাখুন (বৃষ্টি আসছে)",
    action_irrigate_in_2_3_days: "২-৩ দিনের মধ্যে সেচ দিন",
    action_irrigate_now: "এখনই সেচ দিন",
    action_not_needed: "সেচের প্রয়োজন নেই",
    action_conserve_soil_moisture: "মাটির আর্দ্রতা সংরক্ষণ করুন",
    btn_watered_today: "আমি আজ জল দিয়েছি",
    btn_watered_today_success: "আজকের সেচ লিপিবদ্ধ হয়েছে। আর্দ্রতার মাত্রা আপডেট করা হয়েছে।",
    data_source_fao56_badge: "FAO-56 কৃষি বিজ্ঞান মডেল",
    ai_model2_fao_source_note: "৩০টি ভারতীয় অবস্থানের বাস্তব আবহাওয়া এবং FAO-56 জল ভারসাম্যের ওপর প্রশিক্ষিত।",
    ai_soil_depletion_label: "শিকড় অঞ্চলে জলের ঘাটতি",
    ai_rainfed_advisory_title: "বৃষ্টি-নির্ভর জমি পরামর্শ"
  },
  gu: {
    action_hold_rain_coming: "સિંચાઈ મુલતવી રાખો (વરસાદ આવી રહ્યો છે)",
    action_irrigate_in_2_3_days: "2–3 દિવસમાં સિંચાઈ કરો",
    action_irrigate_now: "હમણાં જ સિંચાઈ કરો",
    action_not_needed: "સિંચાઈની જરૂર નથી",
    action_conserve_soil_moisture: "જમીનનો ભેજ જાળવી રાખો",
    btn_watered_today: "મેં આજે પાણી આપ્યું",
    btn_watered_today_success: "આજની સિંચાઈ નોંધાઈ ગઈ. ભેજ સંતુલન અપડેટ થયું.",
    data_source_fao56_badge: "FAO-56 કૃષિ વિજ્ઞાન મોડેલ",
    ai_model2_fao_source_note: "30 ભારતીય સ્થળોના વાસ્તવિક હવામાન અને FAO-56 જળ સંતુલન પર પ્રશિક્ષિત.",
    ai_soil_depletion_label: "મૂળ વિસ્તારમાં પાણીની ઘટ",
    ai_rainfed_advisory_title: "વરસાદ આધારિત જમીન સલાહ"
  },
  pa: {
    action_hold_rain_coming: "ਸਿੰਚਾਈ ਰੋਕੋ (ਮੀਂਹ ਆਉਣ ਵਾਲਾ ਹੈ)",
    action_irrigate_in_2_3_days: "2-3 ਦਿਨਾਂ ਵਿੱਚ ਸਿੰਚਾਈ ਕਰੋ",
    action_irrigate_now: "ਹੁਣੇ ਸਿੰਚਾਈ ਕਰੋ",
    action_not_needed: "ਸਿੰਚਾਈ ਦੀ ਲੋੜ ਨਹੀਂ",
    action_conserve_soil_moisture: "ਮਿੱਟੀ ਦੀ ਨਮੀ ਬਚਾਓ",
    btn_watered_today: "ਮੈਂ ਅੱਜ ਪਾਣੀ ਲਾਇਆ",
    btn_watered_today_success: "ਅੱਜ ਦਾ ਪਾਣੀ ਦਰਜ ਹੋ ਗਿਆ। ਨਮੀ ਦਾ ਪੱਧਰ ਅੱਪਡੇਟ ਕੀਤਾ ਗਿਆ।",
    data_source_fao56_badge: "FAO-56 ਖੇਤੀ ਵਿਗਿਆਨ ਮਾਡਲ",
    ai_model2_fao_source_note: "30 ਭਾਰਤੀ ਥਾਵਾਂ ਦੇ ਅਸਲ ਮੌਸਮ ਅਤੇ FAO-56 ਪਾਣੀ ਸੰਤੁਲਨ 'ਤੇ ਸਿਖਲਾਈ ਪ੍ਰਾਪਤ।",
    ai_soil_depletion_label: "ਜੜ੍ਹ ਖੇਤਰ ਵਿੱਚ ਪਾਣੀ ਦੀ ਘਾਟ",
    ai_rainfed_advisory_title: "ਬਾਰਾਨੀ ਜ਼ਮੀਨ ਸਲਾਹ"
  }
};

for (const lang of languages) {
  const filePath = path.join(localesDir, `${lang}.json`);
  let content = {};
  if (fs.existsSync(filePath)) {
    content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  Object.assign(content, translations[lang]);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
  console.log(`Updated ${lang}.json with Phase 3 translations (${Object.keys(content).length} total keys).`);
}
