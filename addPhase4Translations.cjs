const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../frontend/src/i18n/locales');
const languages = ['en', 'ta', 'hi', 'te', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa'];

const translations = {
  en: {
    voice_assistant_title: "AgriAdvisor Assistant",
    voice_assistant_sub: "Push to talk in your language",
    voice_btn_speak: "Push to Talk",
    voice_btn_stop: "Stop",
    voice_state_idle: "Push mic or tap below",
    voice_state_listening: "Listening... speak now",
    voice_state_thinking: "Thinking...",
    voice_state_speaking: "Speaking answer...",
    voice_transcript_label: "You Asked",
    voice_answer_label: "AgriAdvisor Guidance",
    voice_quick_chips_label: "Quick Questions",
    voice_typed_placeholder: "Or type your question here...",
    voice_send_btn: "Ask",
    voice_close_btn: "Close",
    voice_banner_no_voice: "Voice speech is not installed on this device for the selected language. Text answer displayed below.",
    voice_banner_mic_denied: "Microphone permission denied. To enable: Click lock icon in browser URL bar -> Site settings -> Allow Microphone.",
    voice_unsupported: "Speech recognition is not supported in this browser. Please use the typed input box below.",
    voice_error_fallback: "Please check your connection or choose from the quick questions below.",
    voice_officer_contact_note: "Please contact your local agriculture extension officer (KVK) for certified advice."
  },
  ta: {
    voice_assistant_title: "AgriAdvisor குரல் உதவியாளர்",
    voice_assistant_sub: "உங்கள் மொழியில் பேசி அறியலாம்",
    voice_btn_speak: "பேச அழுத்தவும்",
    voice_btn_stop: "நிறுத்து",
    voice_state_idle: "மைக் அழுத்தவும் அல்லது கீழே தட்டவும்",
    voice_state_listening: "கேட்கிறது... இப்போது பேசவும்",
    voice_state_thinking: "சிந்திக்கிறது...",
    voice_state_speaking: "பதில் பேசுகிறது...",
    voice_transcript_label: "நீங்கள் கேட்டது",
    voice_answer_label: "AgriAdvisor ஆலோசனை",
    voice_quick_chips_label: "விரைவு கேள்விகள்",
    voice_typed_placeholder: "அல்லது கேள்வியை இங்கே தட்டச்சு செய்யவும்...",
    voice_send_btn: "கேள்",
    voice_close_btn: "மூடு",
    voice_banner_no_voice: "இந்த மொழிக்கான குரல் ஒலி சாதனம் நிறுவப்படவில்லை. உரை வடிவில் பதில் காட்டப்படுகிறது.",
    voice_banner_mic_denied: "மைக் அனுமதி மறுக்கப்பட்டது. முகவரிப் பட்டியில் பூட்டு குறியை அழுத்தி மைக்ரோஃபோனை அனுமதிக்கவும்.",
    voice_unsupported: "இந்த உலாவியில் பேச்சு அறிதல் ஆதரிக்கப்படவில்லை. கீழே உள்ள தட்டச்சு பெட்டியைப் பயன்படுத்தவும்.",
    voice_error_fallback: "இணைப்பைச் சரிபார்க்கவும் அல்லது கீழே உள்ள விரைவு கேள்விகளில் இருந்து தேர்ந்தெடுக்கவும்.",
    voice_officer_contact_note: "சான்றளிக்கப்பட்ட பரிந்துரைகளுக்கு உங்கள் வட்டார வேளாண்மை அலுவலரை (KVK) அணுகவும்."
  },
  hi: {
    voice_assistant_title: "AgriAdvisor वॉइस असिस्टेंट",
    voice_assistant_sub: "अपनी भाषा में बोलकर पूछें",
    voice_btn_speak: "बोलने के लिए दबाएं",
    voice_btn_stop: "रोकें",
    voice_state_idle: "माइक दबाएं या नीचे चुनें",
    voice_state_listening: "सुन रहा हूँ... अब बोलें",
    voice_state_thinking: "सोच रहा हूँ...",
    voice_state_speaking: "उत्तर बोल रहा हूँ...",
    voice_transcript_label: "आपने पूछा",
    voice_answer_label: "AgriAdvisor सलाह",
    voice_quick_chips_label: "त्वरित प्रश्न",
    voice_typed_placeholder: "या अपना प्रश्न यहाँ लिखें...",
    voice_send_btn: "पूछें",
    voice_close_btn: "बंद करें",
    voice_banner_no_voice: "इस भाषा के लिए इस डिवाइस पर आवाज़ उपलब्ध नहीं है। नीचे लिखित उत्तर देखें।",
    voice_banner_mic_denied: "माइक्रोफ़ोन की अनुमति अस्वीकृत। ब्राउज़र के URL बार में ताला आइकन पर क्लिक करके अनुमति दें।",
    voice_unsupported: "इस ब्राउज़र में स्पीच पहचान समर्थित नहीं है। कृपया टाइपिंग बॉक्स का उपयोग करें।",
    voice_error_fallback: "कृपया इंटरनेट जांचें या नीचे दिए गए प्रश्नों में से चुनें।",
    voice_officer_contact_note: "प्रमाणित सलाह के लिए कृपया अपने स्थानीय कृषि विस्तार अधिकारी (KVK) से संपर्क करें।"
  },
  te: {
    voice_assistant_title: "AgriAdvisor వాయిస్ అసిస్టెంట్",
    voice_assistant_sub: "మీ స్వంత భాషలో మాట్లాడండి",
    voice_btn_speak: "మాట్లాడటానికి నొక్కండి",
    voice_btn_stop: "ఆపండి",
    voice_state_idle: "మైక్ నొక్కండి లేదా క్రింద ఎంచుకోండి",
    voice_state_listening: "వింటోంది... ఇప్పుడు మాట్లాడండి",
    voice_state_thinking: "ఆలోచిస్తోంది...",
    voice_state_speaking: "సమాధానం చెబుతోంది...",
    voice_transcript_label: "మీరు అడిగారు",
    voice_answer_label: "AgriAdvisor సలహా",
    voice_quick_chips_label: "త్వరిత ప్రశ్నలు",
    voice_typed_placeholder: "లేదా ప్రశ్నను ఇక్కడ టైప్ చేయండి...",
    voice_send_btn: "అడుగు",
    voice_close_btn: "మూసివేయి",
    voice_banner_no_voice: "ఈ పరికరంలో ఈ భాష వాయిస్ లేదు. వచన సమాధానం క్రింద ఇవ్వబడింది.",
    voice_banner_mic_denied: "మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. దయచేసి బ్రౌజర్ సెట్టింగ్‌లలో అనుమతించండి.",
    voice_unsupported: "ఈ బ్రౌజర్‌లో వాయిస్ రికగ్నిషన్ సపోర్ట్ లేదు. దయచేసి టైప్ చేయండి.",
    voice_error_fallback: "దయచేసి కనెక్షన్ తనిఖీ చేయండి లేదా క్రింది ప్రశ్నలలో ఒకదాన్ని ఎంచుకోండి.",
    voice_officer_contact_note: "ధృవీకరించబడిన సలహా కోసం స్థానిక వ్యవసాయ విస్తరణ అధికారిని (KVK) సంప్రదించండి."
  },
  kn: {
    voice_assistant_title: "AgriAdvisor ಧ್ವನಿ ಸಹಾಯಕ",
    voice_assistant_sub: "ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ",
    voice_btn_speak: "ಮಾತನಾಡಲು ಒತ್ತಿ",
    voice_btn_stop: "ನಿಲ್ಲಿಸು",
    voice_state_idle: "ಮೈಕ್ ಒತ್ತಿ ಅಥವಾ ಕೆಳಗೆ ಆಯ್ಕೆಮಾಡಿ",
    voice_state_listening: "ಕೇಳುತ್ತಿದೆ... ಈಗ ಮಾತನಾಡಿ",
    voice_state_thinking: "ಯೋಚಿಸುತ್ತಿದೆ...",
    voice_state_speaking: "ಉತ್ತರಿಸುತ್ತಿದೆ...",
    voice_transcript_label: "ನೀವು ಕೇಳಿದ್ದು",
    voice_answer_label: "AgriAdvisor ಮಾರ್ಗದರ್ಶನ",
    voice_quick_chips_label: "ತ್ವರಿತ ಪ್ರಶ್ನೆಗಳು",
    voice_typed_placeholder: "ಅಥವಾ ಇಲ್ಲಿ ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ...",
    voice_send_btn: "ಕೇಳಿ",
    voice_close_btn: "ಮುಚ್ಚಿ",
    voice_banner_no_voice: "ಈ ಭಾಷೆಯ ಧ್ವನಿ ಈ ಸಾಧನದಲ್ಲಿ ಲಭ್ಯವಿಲ್ಲ. ಪಠ್ಯ ಉತ್ತರ ಕೆಳಗೆ ಇದೆ.",
    voice_banner_mic_denied: "ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿ ಅನುಮತಿಸಿ.",
    voice_unsupported: "ಈ ಬ್ರೌಸರ್ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆಯನ್ನು ಬೆಂಬಲಿಸುವುದಿಲ್ಲ. ಟೈಪ್ ಮಾಡಿ.",
    voice_error_fallback: "ದಯವಿಟ್ಟು ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಕೆಳಗಿನ ಪ್ರಶ್ನೆಗಳಿಂದ ಆಯ್ಕೆಮಾಡಿ.",
    voice_officer_contact_note: "ಪ್ರಮಾಣೀಕೃತ ಸಲಹೆಗಾಗಿ ನಿಮ್ಮ ಸ್ಥಳೀಯ ಕೃಷಿ ಅಧಿಕಾರಿಯನ್ನು (KVK) ಸಂಪರ್ಕಿಸಿ."
  },
  ml: {
    voice_assistant_title: "AgriAdvisor വോയ്‌സ് അസിസ്റ്റന്റ്",
    voice_assistant_sub: "നിങ്ങളുടെ ഭാഷയിൽ സംസാരിക്കുക",
    voice_btn_speak: "സംസാരിക്കാൻ അമർത്തുക",
    voice_btn_stop: "നിർത്തുക",
    voice_state_idle: "മൈക്ക് അമർത്തുക അല്ലെങ്കിൽ താഴെ തിരഞ്ഞെടുക്കുക",
    voice_state_listening: "കേൾക്കുന്നു... ഇപ്പോൾ സംസാരിക്കുക",
    voice_state_thinking: "ചിന്തിക്കുന്നു...",
    voice_state_speaking: "മറുപടി പറയുന്നു...",
    voice_transcript_label: "നിങ്ങൾ ചോദിച്ചത്",
    voice_answer_label: "AgriAdvisor മാർഗ്ഗനിർദ്ദേശം",
    voice_quick_chips_label: "ദ്രുത ചോദ്യങ്ങൾ",
    voice_typed_placeholder: "അല്ലെങ്കിൽ ചോദ്യം ഇവിടെ ടൈപ്പ് ചെയ്യുക...",
    voice_send_btn: "ചോദിക്കുക",
    voice_close_btn: "അടയ്ക്കുക",
    voice_banner_no_voice: "ഈ ഭാഷയ്ക്കുള്ള ശബ്ദം ഉപകരണത്തിൽ ലഭ്യമല്ല. വാചക രൂപത്തിൽ മറുപടി താഴെ നൽകിയിരിക്കുന്നു.",
    voice_banner_mic_denied: "മൈക്രോഫോൺ അനുമതി നിരസിച്ചു. ബ്രൗസർ സെറ്റിംഗ്സിൽ അനുവദിക്കുക.",
    voice_unsupported: "ഈ ബ്രൗസറിൽ സംഭാഷണ തിരിച്ചറിയൽ പിന്തുണയ്ക്കുന്നില്ല. ടൈപ്പ് ചെയ്യുക.",
    voice_error_fallback: "ദയവായി കണക്ഷൻ പരിശോധിക്കുക അല്ലെങ്കിൽ താഴെയുള്ള ചോദ്യങ്ങളിൽ ഒന്ന് തിരഞ്ഞെടുക്കുക.",
    voice_officer_contact_note: "കൃത്യമായ ഉപദേശത്തിനായി കൃഷി ഭവൻ ഉദ്യോഗസ്ഥനെ (KVK) സമീപിക്കുക."
  },
  mr: {
    voice_assistant_title: "AgriAdvisor व्हॉइस असिस्टंट",
    voice_assistant_sub: "आपल्या भाषेत बोलून विचारा",
    voice_btn_speak: "बोलण्यासाठी दाबा",
    voice_btn_stop: "थांबवा",
    voice_state_idle: "माइक दाबा किंवा खाली निवडा",
    voice_state_listening: "ऐकत आहे... आता बोला",
    voice_state_thinking: "विचार करत आहे...",
    voice_state_speaking: "उत्तर देत आहे...",
    voice_transcript_label: "तुम्ही विचारले",
    voice_answer_label: "AgriAdvisor सल्ला",
    voice_quick_chips_label: "त्वरित प्रश्न",
    voice_typed_placeholder: "किंवा येथे प्रश्न टाईप करा...",
    voice_send_btn: "विचारा",
    voice_close_btn: "बंद करा",
    voice_banner_no_voice: "या भाषेसाठी डिव्हाइसवर आवाज उपलब्ध नाही. खाली लेखी उत्तर पहा.",
    voice_banner_mic_denied: "मायक्रोफोन परवानगी नाकारली. कृपया ब्राउझर सेटिंग्जमध्ये परवानगी द्या.",
    voice_unsupported: "या ब्राउझरमध्ये व्हॉइस ओळख समर्थित नाही. कृपया टाईप करा.",
    voice_error_fallback: "कृपया कनेक्शन तपासा किंवा खालील प्रश्नांमधून निवडा.",
    voice_officer_contact_note: "प्रमाणित सल्ल्यासाठी स्थानिक कृषी अधिकारी (KVK) यांच्याशी संपर्क साधा."
  },
  bn: {
    voice_assistant_title: "AgriAdvisor ভয়েস সহকারী",
    voice_assistant_sub: "আপনার নিজের ভাষায় কথা বলুন",
    voice_btn_speak: "কথা বলতে টিপুন",
    voice_btn_stop: "থামুন",
    voice_state_idle: "মাইক টিপুন বা নীচে বেছে নিন",
    voice_state_listening: "শুনছি... এখন বলুন",
    voice_state_thinking: "ভাবছি...",
    voice_state_speaking: "উত্তর বলছি...",
    voice_transcript_label: "আপনি জিজ্ঞাসা করেছেন",
    voice_answer_label: "AgriAdvisor পরামর্শ",
    voice_quick_chips_label: "দ্রুত প্রশ্ন",
    voice_typed_placeholder: "অথবা প্রশ্নটি এখানে টাইপ করুন...",
    voice_send_btn: "জিজ্ঞাসা",
    voice_close_btn: "বন্ধ করুন",
    voice_banner_no_voice: "এই ভাষার জন্য ডিভাইসে ভয়েস ইনস্টল করা নেই। নীচে লিখিত উত্তর দেখুন।",
    voice_banner_mic_denied: "মাইক্রোফোনের অনুমতি প্রত্যাখ্যাত হয়েছে। ব্রাউজার সেটিংসে অনুমতি দিন।",
    voice_unsupported: "এই ব্রাউজারে ভয়েস সনাক্তকরণ সমর্থিত নয়। অনুগ্রহ করে টাইপ করুন।",
    voice_error_fallback: "দয়া করে সংযোগ পরীক্ষা করুন অথবা নীচের প্রশ্নগুলির মধ্যে একটি বেছে নিন।",
    voice_officer_contact_note: "প্রত্যয়িত পরামর্শের জন্য আপনার স্থানীয় কৃষি কর্মকর্তার (KVK) সাথে যোগাযোগ করুন।"
  },
  gu: {
    voice_assistant_title: "AgriAdvisor વૉઇસ સહાયક",
    voice_assistant_sub: "તમારી ભાષામાં બોલીને પૂછો",
    voice_btn_speak: "બોલવા માટે દબાવો",
    voice_btn_stop: "રોકો",
    voice_state_idle: "માઇક દબાવો અથવા નીચે પસંદ કરો",
    voice_state_listening: "સાંભળી રહ્યું છે... હવે બોલો",
    voice_state_thinking: "વિચારી રહ્યું છે...",
    voice_state_speaking: "જવાબ બોલી રહ્યું છે...",
    voice_transcript_label: "તમે પૂછ્યું",
    voice_answer_label: "AgriAdvisor સલાહ",
    voice_quick_chips_label: "ઝડપી પ્રશ્નો",
    voice_typed_placeholder: "અથવા તમારો પ્રશ્ન અહીં લખો...",
    voice_send_btn: "પૂછો",
    voice_close_btn: "બંધ કરો",
    voice_banner_no_voice: "આ ભાષા માટે ઉપકરણ પર અવાજ ઉપલબ્ધ નથી. નીચે લખાણમાં જવાબ જુઓ.",
    voice_banner_mic_denied: "માઇક્રોફોનની પરવાનગી નકારી. કૃપા કરીને બ્રાઉઝર સેટિંગ્સમાં પરવાનગી આપો.",
    voice_unsupported: "આ બ્રાઉઝરમાં અવાજ ઓળખ સમર્થિત નથી. કૃપા કરીને ટાઇપ કરો.",
    voice_error_fallback: "કૃપા કરીને ઇન્ટરનેટ તપાસો અથવા નીચે આપેલા પ્રશ્નોમાંથી પસંદ કરો.",
    voice_officer_contact_note: "પ્રમાણિત સલાહ માટે કૃપા કરીને સ્થાનિક કૃષિ અધિકારી (KVK) નો સંપર્ક કરો."
  },
  pa: {
    voice_assistant_title: "AgriAdvisor ਆਵਾਜ਼ ਸਹਾਇਕ",
    voice_assistant_sub: "ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਬੋਲ ਕੇ ਪੁੱਛੋ",
    voice_btn_speak: "ਬੋਲਣ ਲਈ ਦਬਾਓ",
    voice_btn_stop: "ਰੋਕੋ",
    voice_state_idle: "ਮਾਈਕ ਦਬਾਓ ਜਾਂ ਹੇਠਾਂ ਚੁਣੋ",
    voice_state_listening: "ਸੁਣ ਰਿਹਾ ਹੈ... ਹੁਣ ਬੋਲੋ",
    voice_state_thinking: "ਸੋਚ ਰਿਹਾ ਹੈ...",
    voice_state_speaking: "ਜਵਾਬ ਬੋਲ ਰਿਹਾ ਹੈ...",
    voice_transcript_label: "ਤੁਸੀਂ ਪੁੱਛਿਆ",
    voice_answer_label: "AgriAdvisor ਸਲਾਹ",
    voice_quick_chips_label: "ਤੁਰੰਤ ਸਵਾਲ",
    voice_typed_placeholder: "ਜਾਂ ਆਪਣਾ ਸਵਾਲ ਇੱਥੇ ਲਿਖੋ...",
    voice_send_btn: "ਪੁੱਛੋ",
    voice_close_btn: "ਬੰਦ ਕਰੋ",
    voice_banner_no_voice: "ਇਸ ਭਾਸ਼ਾ ਲਈ ਡਿਵਾਈਸ 'ਤੇ ਆਵਾਜ਼ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਹੇਠਾਂ ਲਿਖਤੀ ਜਵਾਬ ਦੇਖੋ।",
    voice_banner_mic_denied: "ਮਾਈਕ੍ਰੋਫੋਨ ਦੀ ਇਜਾਜ਼ਤ ਨਹੀਂ ਮਿਲੀ। ਕਿਰਪਾ ਕਰਕੇ ਬ੍ਰਾਊਜ਼ਰ ਸੈਟਿੰਗਾਂ ਵਿੱਚ ਇਜਾਜ਼ਤ ਦਿਓ।",
    voice_unsupported: "ਇਸ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਆਵਾਜ਼ ਪਛਾਣ ਸਮਰਥਿਤ ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਟਾਈਪ ਕਰੋ।",
    voice_error_fallback: "ਕਿਰਪਾ ਕਰਕੇ ਇੰਟਰਨੈੱਟ ਚੈੱਕ ਕਰੋ ਜਾਂ ਹੇਠਾਂ ਦਿੱਤੇ ਸਵਾਲਾਂ ਵਿੱਚੋਂ ਚੁਣੋ।",
    voice_officer_contact_note: "ਪ੍ਰਮਾਣਿਤ ਸਲਾਹ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਸਥਾਨਕ ਖੇਤੀਬਾੜੀ ਅਧਿਕਾਰੀ (KVK) ਨਾਲ ਸੰਪਰਕ ਕਰੋ।"
  }
};

for (const lang of languages) {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`File missing: ${filePath}`);
    continue;
  }

  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const newKeys = translations[lang] || translations.en;

  let added = 0;
  for (const [k, v] of Object.entries(newKeys)) {
    if (!content[k]) {
      content[k] = v;
      added++;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf-8');
  console.log(`[${lang}.json] Synchronized! Total keys: ${Object.keys(content).length} (added ${added})`);
}
