import { Farm } from '../models/Farm.js';
import { Crop } from '../models/Crop.js';
import { CropHealthLog } from '../models/CropHealthLog.js';
import { MarketPrice } from '../models/MarketPrice.js';
import { OutbreakReport } from '../models/OutbreakReport.js';
import { getWeatherData } from './weatherService.js';
import { calculateSoilWaterDepletion } from './irrigationService.js';
import { calculateCropLifecycle, getSowingAdvisory } from './cropLifecycleService.js';
import { Types } from 'mongoose';

// Multilingual Crop Dictionary for crop extraction across 10 Indian regional languages
export const CROP_SYNONYMS: Record<string, string[]> = {
  rice: ['rice', 'paddy', 'arisi', 'chawal', 'vari', 'akki', 'nellu', 'bhat', 'tandul', 'dhan', 'choka'],
  wheat: ['wheat', 'gehun', 'godhumai', 'godhumalu', 'godhi', 'godhambu', 'gahu', 'gom', 'ghau', 'kanak'],
  cotton: ['cotton', 'kapas', 'paruthi', 'prathi', 'arale', 'parutti', 'kaapus', 'tula', 'kapaas', 'kapah'],
  maize: ['maize', 'corn', 'makka', 'makkacholam', 'makka jonna', 'musukina jola', 'cholam', 'maka', 'bhutta', 'makai', 'chhalli'],
  chickpea: ['chickpea', 'gram', 'chana', 'kondaikadalai', 'senagalu', 'kadale', 'kadala', 'harbara', 'chhola', 'chana'],
  sugarcane: ['sugarcane', 'ganna', 'karumbu', 'cheruku', 'kabbu', 'karimbu', 'us', 'aakh', 'serdi', 'kamad'],
  tomato: ['tomato', 'tamatar', 'thakkali', 'tamata', 'tometo', 'tamatam', 'tameto'],
  potato: ['potato', 'aloo', 'urulaikizhangu', 'bangaladumpa', 'alugadde', 'urulakizhangu', 'batata', 'alu', 'bataka'],
  onion: ['onion', 'pyaaz', 'vengayam', 'ullipaya', 'eerulli', 'ulli', 'kanda', 'penyaj', 'dungli', 'pyaz'],
  banana: ['banana', 'kela', 'vazhaipazham', 'arati', 'baale', 'vazha', 'kele', 'kola', 'kela'],
  mango: ['mango', 'aam', 'mambazham', 'mamidi', 'mavu', 'manga', 'amba', 'aam', 'keri', 'amb'],
  coffee: ['coffee', 'kaapi', 'kapi', 'kofi'],
  jute: ['jute', 'san', 'senabu', 'chhan', 'pat'],
};

export interface AssistantContext {
  userId?: string | Types.ObjectId;
  farmId?: string | Types.ObjectId;
  lang?: string;
  page?: string;
}

export interface AssistantAnswer {
  intent: string;
  topic: string;
  answer: string;
  spokenText: string;
  quickChips: string[];
  layer: 1 | 2 | 3;
  confidence: number;
  extractedCrop?: string;
  requiresOfficerContact?: boolean;
}

// 25+ Multilingual Intent Definitions
export interface IntentDefinition {
  name: string;
  patterns: {
    en: string[];
    ta: string[];
    hi: string[];
    te?: string[];
    kn?: string[];
    ml?: string[];
    mr?: string[];
    bn?: string[];
    gu?: string[];
    pa?: string[];
  };
}

export const INTENT_DEFINITIONS: IntentDefinition[] = [
  {
    name: 'irrigate_today',
    patterns: {
      en: ['irrigate', 'water today', 'watering', 'should i irrigate', 'water the farm', 'need irrigation', 'irrigation needed', 'is irrigation needed today', 'give water', 'irrigate plot', 'turn on water', 'water crops'],
      ta: ['தண்ணீர் பாய்ச்ச', 'நீர் பாய்ச்சலாமா', 'இன்று தண்ணீர்', 'பாசனம் செய்யவா', 'தண்ணீர் கட்டவா', 'நீர் தேவை', 'தண்ணீர் பாய்ச்ச வேண்டுமா', 'வயலுக்கு தண்ணீர்', 'நீர் பாசனம்', 'தண்ணீர் ஊற்றவா'],
      hi: ['सिंचाई करूं', 'पानी दूं', 'आज पानी लगाना है', 'क्या सिंचाई करनी चाहिए', 'पानी देना है', 'खेत में पानी', 'सिंचाई की जरूरत', 'पानी कब दें', 'फसल को पानी', 'पानी लगाऊं क्या']
    }
  },
  {
    name: 'rain_forecast',
    patterns: {
      en: ['rain forecast', 'will it rain', 'rain coming', 'rainfall prediction', 'any rain', 'rain tomorrow', 'chance of rain', 'rain expected', 'monsoon forecast', 'heavy rain'],
      ta: ['மழை வருமா', 'மழை பெய்யுமா', 'மழை நிலவரம்', 'மழை வருமா இன்று', 'மழை வாய்ப்பு', 'மழை பொழிவு', 'மழை முன்னறிவிப்பு', 'நாளை மழை', 'மழை வரப்போகிறதா', 'கனமழை வருமா'],
      hi: ['बारिश होगी क्या', 'बारिश आएगी', 'क्या बारिश होगी', 'बारिश का अनुमान', 'कल बारिश होगी', 'मौसम बारिश', 'बारिश की संभावना', 'क्या पानी बरसेगा', 'बारिश का मौसम', 'बरसात कब होगी', 'बारिश का अलर्ट']
    }
  },
  {
    name: 'weather_now',
    patterns: {
      en: ['weather now', 'current temperature', 'how hot is it', 'weather today', 'humidity today', 'temperature now', 'weather conditions', 'climate today', 'current weather', 'wind speed'],
      ta: ['வானிலை என்ன', 'இன்றைய வெப்பநிலை', 'தற்போதைய வானிலை', 'வெப்பநிலை எவ்வளவு', 'காற்று வேகம்', 'இன்றைய காலநிலை', 'சூரியன் எப்படி', 'வானிலை நிலவரம்', 'இப்போது வானிலை', 'ஈரப்பதம் எவ்வளவு'],
      hi: ['आज का मौसम', 'अभी मौसम कैसा है', 'तापमान कितना है', 'मौसम की जानकारी', 'आज कितनी गर्मी है', 'तापमान क्या है', 'हवा की गति', 'मौसम का हाल', 'आज की धूप', 'नमी कितनी है']
    }
  },
  {
    name: 'which_crop_to_grow',
    patterns: {
      en: ['which crop to grow', 'recommend crop', 'what crop should i plant', 'best crop for my land', 'which crop is best', 'suggest a crop', 'crop advice', 'what to sow', 'suitable crop', 'crop recommendation'],
      ta: ['எந்த பயிர் இடலாம்', 'என்ன பயிர் நடலாம்', 'பயிர் பரிந்துரை', 'என் நிலத்திற்கு ஏற்ற பயிர்', 'எந்த பயிர் சிறந்தது', 'பயிர் யோசனை', 'விதைக்க ஏற்ற பயிர்', 'பயிர் ஆலோசனை', 'என்ன பயிர் பயிரிடலாம்', 'பயிர் தேர்வு'],
      hi: ['कौन सी फसल लगाएं', 'कौन सी फसल अच्छी है', 'फसल सिफारिश', 'खेत में क्या बोएं', 'कौन सी फसल सही रहेगी', 'फसल की सलाह', 'फसल सुझाव', 'क्या लगाना चाहिए', 'सर्वश्रेष्ठ फसल', 'फसल चयन']
    }
  },
  {
    name: 'sowing_time',
    patterns: {
      en: ['sowing time', 'when to sow', 'planting window', 'optimal sowing date', 'sowing season', 'when should i plant', 'right time to sow', 'sowing month', 'seeding date', 'is it time to sow'],
      ta: ['விதைக்கும் நேரம்', 'எப்போது விதைக்க வேண்டும்', 'விதைப்பு காலம்', 'நடவு செய்ய சரியான நேரம்', 'பயிர் விதைக்கும் பருவம்', 'விதைப்பு எப்போது', 'விதைக்க உகந்த நேரம்', 'பருவ காலம்', 'விதைக்கலாமா', 'விதைப்பு மாதம்'],
      hi: ['बुवाई का सही समय', 'कब बोएं', 'बुवाई का मौसम', 'बीज कब लगाएं', 'बुवाई की तारीख', 'फसल बोने का समय', 'किस महीने बोएं', 'बुवाई कब करनी चाहिए', 'लगाने का समय', 'बुवाई का दिन']
    }
  },
  {
    name: 'land_preparation',
    patterns: {
      en: ['land preparation', 'how to prepare soil', 'plowing land', 'soil preparation', 'preparing field', 'land tilling', 'bed preparation', 'plough the soil', 'pre sowing tillage', 'soil leveling'],
      ta: ['நிலம் தயாரித்தல்', 'நிலத்தை எப்படி உழ வேண்டும்', 'மண் தயாரிப்பு', 'உழவு செய்வது எப்படி', 'வயல் தயாரித்தல்', 'நில உழவு', 'பாத்தி கட்டுவது', 'மண் பண்படுத்துதல்', 'உழவு முறை', 'நிலம் தயார் செய்ய'],
      hi: ['खेत की तैयारी', 'जमीन कैसे तैयार करें', 'जुताई कैसे करें', 'मिट्टी तैयार करना', 'खेत की जुताई', 'जमीन समतल करना', 'बुवाई से पहले तैयारी', 'खेत कैसे बनाएं', 'मिट्टी पलटना', 'जुताई का तरीका']
    }
  },
  {
    name: 'growth_stage_and_harvest_date',
    patterns: {
      en: ['growth stage', 'harvest date', 'when to harvest', 'how many days to harvest', 'crop progress', 'maturity stage', 'when will crop mature', 'days until harvest', 'flowering stage', 'harvest ready'],
      ta: ['வளர்ச்சி நிலை', 'அறுவடை எப்போது', 'அறுவடை நாள்', 'பயிர் முதிர்ச்சி', 'அறுவடைக்கு எத்தனை நாட்கள்', 'பயிர் நிலை', 'பூக்கும் நிலை', 'அறுவடை செய்யலாமா', 'கதிர் முதிர்ச்சி', 'பயிர் வளர்ச்சி'],
      hi: ['फसल की अवस्था', 'कटाई कब होगी', 'कटाई का समय', 'कितने दिन में पकेगी', 'फसल की बढ़वार', 'कटाई की तारीख', 'फूल आने का समय', 'फसल कब तैयार होगी', 'पकने का समय', 'कटाई के दिन']
    }
  },
  {
    name: 'crop_health',
    patterns: {
      en: ['crop health', 'is my crop healthy', 'crop status', 'check crop health', 'plants look sick', 'crop condition', 'crop monitoring', 'health log', 'how are my plants', 'yellow leaves'],
      ta: ['பயிர் நலம்', 'பயிர் ஆரோக்கியமாக உள்ளதா', 'பயிர் நிலைமை', 'இலை மஞ்சள்', 'பயிர் ஆரோக்கியம்', 'பயிரில் நோய் உள்ளதா', 'பயிர் வாட்டம்', 'பயிர் சரிபார்க்க', 'பயிர் வளர்ச்சி நலம்', 'செடிகள் நலம்'],
      hi: ['फसल का स्वास्थ्य', 'क्या फसल स्वस्थ है', 'फसल की हालत', 'पौधे कैसे हैं', 'पत्तियां पीली पड़ रही हैं', 'फसल में बीमारी', 'फसल की स्थिति', 'फसल ठीक है क्या', 'पौधों की स्थिति', 'फसल चेक करें']
    }
  },
  {
    name: 'how_to_take_leaf_photo',
    patterns: {
      en: ['how to take leaf photo', 'leaf photo tips', 'take picture of leaf', 'how to photograph leaf', 'leaf picture guidance', 'photo instructions', 'clear leaf photo', 'camera tips', 'how to scan leaf', 'leaf snapshot'],
      ta: ['இலை புகைப்படம் எடுப்பது எப்படி', 'இலை போட்டோ எடுப்பது எப்படி', 'இலையை படம் பிடிப்பது', 'புகைப்பட குறிப்புகள்', 'இலை ஸ்கேன்', 'கேமரா குறிப்பு', 'தெளிவான இலை புகைப்படம்', 'இலை படம் எடுக்க வழி', 'நோய் படம் எடுக்க', 'போட்டோ உதவி'],
      hi: ['पत्ती की फोटो कैसे लें', 'पत्ती का फोटो खींचना', 'फोटो लेने का तरीका', 'पत्ती की तस्वीर', 'कैमरा कैसे चलाएं', 'साफ फोटो कैसे लें', 'पत्ती स्कैन करना', 'फोटो के निर्देश', 'पत्ती की जांच फोटो', 'पत्ती का चित्र']
    }
  },
  {
    name: 'market_price',
    patterns: {
      en: ['market price', 'mandi rate', 'what is the price', 'price of wheat', 'price of paddy', 'commodity rate', 'mandi bhav', 'current mandi price', 'crop rate today', 'selling price'],
      ta: ['சந்தை விலை', 'மண்டி விலை', 'நெல் விலை என்ன', 'இன்றைய விலை', 'கோதுமை விலை', 'பொருள் விலை', 'சந்தை நிலவரம்', 'மண்டி ரேட்', 'விலை எவ்வளவு', 'விவசாய விலை'],
      hi: ['मंडी भाव', 'बाजार मूल्य', 'फसल का भाव', 'गेहूं का भाव क्या है', 'धान का रेट', 'आज का मंडी भाव', 'फसल का दाम', 'मंडी में क्या रेट है', 'बाजार का भाव', 'फसल की कीमत']
    }
  },
  {
    name: 'should_i_sell',
    patterns: {
      en: ['should i sell', 'sell now or hold', 'best time to sell', 'will prices rise', 'when to sell crops', 'hold my harvest', 'selling advisory', 'good price to sell', 'wait for higher price', 'sell today'],
      ta: ['இப்போது விற்கலாமா', 'விற்கவா அல்லது வைத்திருக்கவா', 'விலை ஏறுமா', 'எப்போது விற்க வேண்டும்', 'அறுவடை விற்க நேரம்', 'சந்தையில் விற்கலாமா', 'விற்பனை ஆலோசனை', 'விலை உயரும் வரை காத்திருக்கவா', 'விற்க சரியான நேரம்', 'விற்பனை செய்யலாமா'],
      hi: ['क्या अभी बेचूं', 'बेचें या रोकें', 'क्या भाव बढ़ेगा', 'फसल कब बेचनी चाहिए', 'फसल बेचने का सही समय', 'रोक कर रखूं क्या', 'बिक्री की सलाह', 'भाव बढ़ने का इंतजार करें', 'फसल बेच दूं क्या', 'आज बेचना चाहिए']
    }
  },
  {
    name: 'nearby_mandi',
    patterns: {
      en: ['nearby mandi', 'nearest apmc', 'closest market', 'where is mandi', 'mandi distance', 'mandi locations', 'closest grain market', 'find mandi', 'local mandi', 'nearest market yard'],
      ta: ['அருகிலுள்ள மண்டி', 'அருகில் உள்ள சந்தை', 'மண்டி எங்கே உள்ளது', 'மண்டி தொலைவு', 'அருகாமை உழவர் சந்தை', 'நெருங்கிய மண்டி', 'மண்டி இருப்பிடம்', 'சந்தை எங்குள்ளது', 'அருகில் மார்க்கெட்', 'மண்டி தூரம்'],
      hi: ['नजदीकी मंडी', 'पास की मंडी', 'मंडी कहां है', 'सबसे पास वाली मंडी', 'मंडी की दूरी', 'पास का बाजार', 'मंडी का पता', 'नजदीक का मार्केट यार्ड', 'मंडी कितनी दूर है', 'कृषि उपज मंडी']
    }
  },
  {
    name: 'disease_nearby',
    patterns: {
      en: ['disease nearby', 'community outbreak', 'any disease reported', 'disease alert', 'neighbor farm disease', 'pest outbreak', 'disease around me', 'community alert', 'infection nearby', 'blight report'],
      ta: ['அருகில் நோய் உள்ளதா', 'பக்கத்து வயலில் நோய்', 'நோய் எச்சரிக்கை', 'சமூக நோய் அறிக்கை', 'பூச்சி தாக்குதல்', 'அருகாமை நோய் பரவல்', 'நோய் பரவுகிறதா', 'அருகில் தொற்று', 'ஊரில் பயிர் நோய்', 'பயிர் நோய் எச்சரிக்கை'],
      hi: ['आस-पास कोई बीमारी', 'पड़ोसी खेत में बीमारी', 'बीमारी का अलर्ट', 'क्षेत्र में कीट प्रकोप', 'क्या आस-पास बीमारी है', 'कम्युनिटी रोग चेतावनी', 'पास में फसल रोग', 'बीमारी की खबर', 'आस-पास संक्रमण', 'फसल में रोग फैला है']
    }
  },
  {
    name: 'farm_summary',
    patterns: {
      en: ['farm summary', 'tell me about my farm', 'farm overview', 'overview of fields', 'my plot details', 'farm stats', 'summary of holdings', 'farm profile', 'brief my farm', 'all about my farm'],
      ta: ['என் பண்ணை விவரம்', 'நில சுருக்கம்', 'வயல் விவரம்', 'என் நிலம் பற்றி சொல்', 'பண்ணை நிலவரம்', 'நில விவரக்குறிப்பு', 'என் வயல் சுருக்கம்', 'பண்ணை கண்ணோட்டம்', 'வயல் தகவல்', 'நிலத்தின் முழு விவரம்'],
      hi: ['खेत का विवरण', 'मेरे खेत की जानकारी', 'फार्म समरी', 'खेत का सारांश', 'मेरे खेत का हाल', 'जमीन की जानकारी', 'खेत का ब्यौरा', 'खेत के बारे में बताओ', 'फार्म प्रोफाइल', 'खेत का स्टेटस']
    }
  },
  {
    name: 'what_to_do_today',
    patterns: {
      en: ['what to do today', 'today task', 'daily farm action', 'what should i do on farm', 'today priority', 'farm chores today', 'action items today', 'today work in field', 'field tasks', 'what is today plan'],
      ta: ['இன்று என்ன செய்ய வேண்டும்', 'இன்றைய வேலை', 'வயலில் இன்று என்ன செய்ய', 'இன்றைய முக்கிய பணி', 'வயல் வேலைகள் இன்று', 'இன்றைய திட்டம்', 'வயலில் என்ன வேலை', 'இன்று என்ன பாசனம்', 'இன்றைய பணி', 'வயல் செய்ய வேண்டியவை'],
      hi: ['आज क्या करना है', 'आज का काम', 'खेत में आज क्या करें', 'आज की प्राथमिकता', 'खेत का आज का कार्य', 'आज क्या काम है', 'खेत में आज की योजना', 'आज का जरूरी काम', 'आज फसल में क्या करें', 'दिन का काम']
    }
  },
  {
    name: 'my_farms',
    patterns: {
      en: ['my farms', 'list my farms', 'show my plots', 'how many farms do i have', 'view farms', 'my field names', 'switch farm', 'all my farms', 'show plots', 'registered farms'],
      ta: ['என் பண்ணைகள்', 'என் நிலங்களை காட்டு', 'என்னிடம் எத்தனை வயல் உள்ளது', 'பண்ணைகள் பட்டியல்', 'என் நிலங்கள்', 'பண்ணை பெயர்கள்', 'வயல்கள் பட்டியல்', 'என் வயல்கள் எவை', 'பண்ணை மாற்று', 'என் அனைத்து நிலங்கள்'],
      hi: ['मेरे खेत', 'मेरे सभी खेत दिखाओ', 'मेरे पास कितने खेत हैं', 'खेतों की सूची', 'मेरे फार्म', 'खेतों के नाम', 'फार्म लिस्ट', 'मेरे कितने प्लॉट हैं', 'खेत बदलो', 'सारे खेत दिखाओ']
    }
  },
  {
    name: 'soil_help',
    patterns: {
      en: ['soil help', 'what is my soil type', 'soil health card', 'npk levels', 'soil ph', 'soil testing', 'understand soil', 'soil nutrients', 'fertilizer for soil', 'is my soil fertile'],
      ta: ['மண் உதவி', 'என் மண் வகை என்ன', 'மண் நல அட்டை', 'என் மண் வளம்', 'மண் பரிசோதனை', 'மண் பிஎச் அளவு', 'மண் சத்துக்கள்', 'தழை சத்து மணி சத்து', 'மண் வளம் எப்படி', 'மண் தரம்'],
      hi: ['मिट्टी की मदद', 'मेरी मिट्टी कैसी है', 'मृदा स्वास्थ्य कार्ड', 'मिट्टी का प्रकार', 'मिट्टी में एनपीके', 'मिट्टी की जांच', 'मिट्टी का पीएच', 'मिट्टी के पोषक तत्व', 'क्या मेरी मिट्टी उपजाऊ है', 'मृदा उर्वरता']
    }
  },
  {
    name: 'change_language_by_voice',
    patterns: {
      en: ['change language', 'switch to tamil', 'switch to hindi', 'talk in english', 'change to hindi', 'set language', 'speak in tamil', 'switch language', 'language settings', 'speak english'],
      ta: ['மொழியை மாற்று', 'தமிழுக்கு மாற்று', 'இந்தியில் பேசு', 'ஆங்கிலத்தில் பேசு', 'மொழியை மாற்றுங்கள்', 'தமிழ் மொழி', 'மொழி அமைப்புகள்', 'தமிழில் பேசு', 'மொழி மாற்றம்', 'ஆங்கிலத்திற்கு மாற்று'],
      hi: ['भाषा बदलो', 'हिंदी में बात करो', 'तमिल में बदलो', 'अंग्रेजी में बोलो', 'भाषा बदलें', 'हिंदी भाषा सेट करो', 'हिंदी में बताओ', 'भाषा परिवर्तन', 'लैंग्वेज चेंज करो', 'इंग्लिश में बात करो']
    }
  },
  {
    name: 'repeat',
    patterns: {
      en: ['repeat', 'say that again', 'can you repeat', 'pardon', 'tell me once more', 'what did you say', 'repeat answer', 'one more time', 'say again', 'come again'],
      ta: ['மீண்டும் சொல்', 'இன்னொரு முறை சொல்', 'மறுபடியும் சொல்', 'என்ன சொன்னீர்கள்', 'திரும்பவும் சொல்', 'மீண்டும் ஒரு முறை', 'மறுபடி சொல்லுங்கள்', 'கேட்கவில்லை மீண்டும் சொல்', 'மறுமொழி சொல்', 'திரும்ப சொல்'],
      hi: ['फिर से बोलो', 'दोबारा बताओ', 'एक बार फिर बोलो', 'क्या कहा आपने', 'फिर से कहो', 'दोहराओ', 'सुनाई नहीं दिया फिर बोलो', 'एक बार और बताओ', 'वापस बोलो', 'पुनः बताओ']
    }
  },
  {
    name: 'help',
    patterns: {
      en: ['help', 'what can you do', 'how to use', 'guide me', 'commands list', 'what questions can i ask', 'voice assistant help', 'show examples', 'how does this work', 'assistance'],
      ta: ['உதவி', 'உன்னால் என்ன செய்ய முடியும்', 'எப்படி பயன்படுத்துவது', 'வழி காட்டு', 'நான் என்ன கேட்கலாம்', 'உதவி வேண்டும்', 'உதாரண கேள்விகள்', 'குரல் உதவி', 'பயன்பாட்டு முறை', 'செயலி உதவி'],
      hi: ['मदद', 'तुम क्या कर सकते हो', 'सहायता चाहिए', 'कैसे इस्तेमाल करें', 'मैं क्या पूछ सकता हूं', 'उदाहरण दिखाओ', 'वॉइस असिस्टेंट हेल्प', 'मार्गदर्शन करें', 'कमांड्स लिस्ट', 'कैसे काम करता है']
    }
  },
  {
    name: 'greetings',
    patterns: {
      en: ['hello', 'hi', 'namaste', 'good morning', 'good afternoon', 'good evening', 'hey', 'hello assistant', 'namaskaram', 'vanakkam'],
      ta: ['வணக்கம்', 'ஹலோ', 'வணக்கமுங்க', 'காலை வணக்கம்', 'மாலை வணக்கம்', 'நலமா', 'வணக்கம் ஐயா', 'நல்வரவு', 'வணக்கம் அசிஸ்டண்ட்', 'ஹாய்'],
      hi: ['नमस्ते', 'नमस्कार', 'प्रणाम', 'राम राम', 'सुप्रभात', 'हेलो', 'हाय', 'जय जवान जय किसान', 'नमस्ते जी', 'गुड मॉर्निंग']
    }
  },
  {
    name: 'thanks',
    patterns: {
      en: ['thank you', 'thanks', 'thank you so much', 'appreciate it', 'many thanks', 'dhanyavad', 'nandri', 'good job', 'helpful', 'thank you very much'],
      ta: ['நன்றி', 'மிக்க நன்றி', 'ரொம்ப நன்றி', 'நன்றிகள்', 'மிக்க மகிழ்ச்சி', 'நல்ல வேலை', 'உதவிக்கு நன்றி', 'ரொம்ப பயனுள்ளது', 'நன்றிங்க', 'நன்றி தோழரே'],
      hi: ['धन्यवाद', 'बहुत बहुत धन्यवाद', 'शुक्रिया', 'थैंक यू', 'आभार', 'बहुत अच्छा', 'धन्यवाद जी', 'मदद के लिए शुक्रिया', 'बढ़िया जवाब', 'मेहरबानी']
    }
  },
  {
    name: 'stop',
    patterns: {
      en: ['stop', 'cancel', 'be quiet', 'shut up', 'pause speech', 'stop speaking', 'end conversation', 'dismiss', 'close', 'stop talking'],
      ta: ['நிறுத்து', 'போதும்', 'பேசுவதை நிறுத்து', 'அமைதியாக இரு', 'ரத்து செய்', 'நில்', 'மூடு', 'நிறுத்துங்கள்', 'பேசாதே', 'நிறுத்துங்க'],
      hi: ['रुको', 'बंद करो', 'चुप रहो', 'बोलना बंद करो', 'रद्द करो', 'बस करो', 'रुक जाओ', 'समाप्त करो', 'आवाज बंद करो', 'चुप']
    }
  },
  {
    name: 'fertilizer_guidance',
    patterns: {
      en: ['fertilizer guidance', 'which fertilizer', 'how much urea', 'dap dose', 'potash application', 'organic manure', 'vermicompost', 'fertilizer schedule', 'when to apply urea', 'soil nutrition'],
      ta: ['உர ஆலோசனை', 'என்ன உரம் போட வேண்டும்', 'யூரியா அளவு', 'டிஏபி உரம்', 'பொட்டாஷ் உரம்', 'இயற்கை உரம்', 'மண்புழு உரம்', 'உர அட்டவணை', 'உரம் எப்போது போடலாம்', 'பயிர் உரம்'],
      hi: ['खाद की सलाह', 'कौन सी खाद डालें', 'यूरिया की मात्रा', 'डीएपी खाद', 'पोटाश कब डालें', 'गोबर की खाद', 'केंचुआ खाद', 'उर्वरक की जानकारी', 'खाद कब देनी चाहिए', 'फसल में खाद']
    }
  },
  {
    name: 'pesticide_safety',
    patterns: {
      en: ['pesticide recommendation', 'spray medicine', 'chemical spray', 'which insect medicine', 'weed killer', 'fungicide dose', 'pesticide name', 'insecticide', 'spray poison', 'weedicide'],
      ta: ['பூச்சி மருந்து', 'மருந்து அடிக்கலாமா', 'பூச்சிக்கொல்லி மருந்து', 'களைக்கொல்லி', 'பூஞ்சாண மருந்து', 'என்ன மருந்து அடிக்க வேண்டும்', 'மருந்து அளவு', 'பூச்சி மருந்து தெளிப்பு', 'மருந்து பெயர்', 'மருந்து வாங்க'],
      hi: ['कीटनाशक दवाई', 'दवा का छिड़काव', 'कौन सी कीटनाशक डालें', 'खरपतवार नाशक', 'फफूंदनाशक दवा', 'कीट निवारक', 'स्प्रे की मात्रा', 'दवाई का नाम', 'दवा कब छिड़कें', 'कीड़े मारने की दवा']
    }
  }
];

// Helper: Normalize incoming query text
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'।]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper: Extract crop name from text across all 10 languages
export function extractCropName(normalizedText: string): string | null {
  for (const [standardCrop, aliases] of Object.entries(CROP_SYNONYMS)) {
    for (const alias of aliases) {
      const regex = new RegExp(`\\b${alias}\\b`, 'i');
      if (regex.test(normalizedText)) {
        return standardCrop;
      }
    }
  }
  return null;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Robust Word-Boundary & Token Overlap Multilingual Intent Matcher
export function matchIntent(normalizedText: string, lang: string = 'en'): { intent: string; confidence: number } {
  const shortLang = lang.split('-')[0].toLowerCase();
  let bestIntent = 'unknown';
  let bestScore = 0.0;

  // Language passes: search the active language first, then optionally English if non-English
  const passes = [shortLang];
  if (shortLang !== 'en') {
    passes.push('en');
  }

  const queryTokens = normalizedText.split(' ').filter(Boolean);

  for (const passLang of passes) {
    for (const intentDef of INTENT_DEFINITIONS) {
      const patterns: string[] = (intentDef.patterns as any)[passLang] || [];

      for (const pattern of patterns) {
        const normPattern = normalizeText(pattern);
        if (!normPattern) continue;

        // 1. Exact full string match
        if (normalizedText === normPattern) {
          return { intent: intentDef.name, confidence: 1.0 };
        }

        const patternTokens = normPattern.split(' ').filter(Boolean);
        if (patternTokens.length === 0) continue;

        // 2. Exact word boundary phrase inclusion (e.g. pattern phrase inside query)
        const phraseRegex = new RegExp(`(^|\\s)${escapeRegExp(normPattern)}(\\s|$)`, 'i');
        if (phraseRegex.test(normalizedText)) {
          const coverage = normPattern.length / Math.max(normalizedText.length, normPattern.length);
          const score = 0.85 + 0.15 * coverage;
          if (score > bestScore) {
            bestScore = score;
            bestIntent = intentDef.name;
          }
          continue;
        }

        // 3. Reverse: query phrase inside pattern
        const reverseRegex = new RegExp(`(^|\\s)${escapeRegExp(normalizedText)}(\\s|$)`, 'i');
        if (reverseRegex.test(normPattern)) {
          const coverage = normalizedText.length / Math.max(normalizedText.length, normPattern.length);
          const score = 0.75 + 0.20 * coverage;
          if (score > bestScore) {
            bestScore = score;
            bestIntent = intentDef.name;
          }
          continue;
        }

        // 4. Word token overlap (exact word matches in token set)
        let matchedCount = 0;
        for (const pt of patternTokens) {
          if (queryTokens.includes(pt)) {
            matchedCount++;
          }
        }

        const patternOverlap = matchedCount / patternTokens.length;
        const queryOverlap = matchedCount / Math.max(queryTokens.length, 1);

        if (patternOverlap >= 0.50) {
          const score = 0.65 * patternOverlap + 0.35 * queryOverlap;
          if (score > bestScore) {
            bestScore = score;
            bestIntent = intentDef.name;
          }
        }
      }
    }

    if (bestScore >= 0.50) {
      return { intent: bestIntent, confidence: bestScore };
    }
  }

  if (bestScore >= 0.40) {
    return { intent: bestIntent, confidence: bestScore };
  }

  return { intent: 'unknown', confidence: 0.0 };
}

/**
 * Layer 1 Core: Execute Answer Builder with REAL Farmer Data
 * Maximum 3 short sentences.
 * Clear numbers. Zero invented facts.
 */
export async function executeLayer1Intent(
  intent: string,
  normalizedText: string,
  context: AssistantContext
): Promise<AssistantAnswer> {
  const lang = (context.lang || 'en').split('-')[0].toLowerCase();
  const extractedCrop = extractCropName(normalizedText);

  // Retrieve user's primary farm & crop
  let farm: any = null;
  let activeCrop: any = null;
  let weather: any = null;

  if (context.userId) {
    if (context.farmId && Types.ObjectId.isValid(context.farmId.toString())) {
      farm = await Farm.findOne({ _id: context.farmId, user: context.userId }).lean();
    }
    if (!farm) {
      farm = await Farm.findOne({ user: context.userId }).sort({ created_at: -1 }).lean();
    }
  }

  if (farm) {
    activeCrop = await Crop.findOne({ farm: farm._id }).sort({ created_at: -1 }).lean();
    try {
      weather = await getWeatherData(farm.latitude, farm.longitude, farm._id);
    } catch (e) {
      // Graceful weather degradation
    }
  }

  const cropName = extractedCrop || activeCrop?.crop_type || 'wheat';
  const farmName = farm?.name || 'Your primary farm';

  // 1. irrigate_today
  if (intent === 'irrigate_today') {
    if (!farm) {
      return buildLocalizedResponse(
        intent,
        'Irrigation Advisory',
        {
          en: "Please register your farm plot first to calculate precision irrigation.",
          ta: "துல்லியமான பாசன கணக்கீட்டிற்கு முதலில் உங்கள் பண்ணையை பதிவு செய்யவும்.",
          hi: "सटीक सिंचाई गणना के लिए कृपया पहले अपना खेत पंजीकृत करें।"
        },
        ['Weather now', 'Which crop to grow', 'Market price'],
        lang
      );
    }

    const isRainfed = (farm.land_type === 'rainfed' || farm.land_type === 'dryland' || farm.water_source === 'rain_only');
    if (isRainfed) {
      return buildLocalizedResponse(
        intent,
        'Rainfed Advisory',
        {
          en: `Your plot ${farm.name} is rainfed with no artificial irrigation source. Apply organic mulch and conserve soil moisture for upcoming rain.`,
          ta: `உங்கள் பண்ணை ${farm.name} மானாவாரி நிலமாகும், செயற்கை பாசன வசதி இல்லை. வரும் மழை நீரை சேமிக்க நிலத்தில் மூடாக்கு போடவும்.`,
          hi: `आपका खेत ${farm.name} वर्षा-आधारित है, जहाँ सिंचाई साधन नहीं है। नमी बनाए रखने के लिए पलवार (मल्चिंग) का उपयोग करें।`
        },
        ['Rain forecast', 'Weather now', 'What to do today'],
        lang
      );
    }

    const depletion = await calculateSoilWaterDepletion(farm, activeCrop, weather);
    if (weather?.forecast_rain_amount >= 15.0) {
      return buildLocalizedResponse(
        intent,
        'Irrigation Advisory',
        {
          en: `Hold irrigation today. Heavy rainfall of ${Math.round(weather.forecast_rain_amount)} mm is forecasted within 48 hours for ${farm.name}.`,
          ta: `இன்று தண்ணீர் பாய்ச்ச வேண்டாம். அடுத்த 48 மணி நேரத்தில் ${farm.name} பகுதியில் ${Math.round(weather.forecast_rain_amount)} மிமீ கனமழை எதிர்பார்க்கப்படுகிறது.`,
          hi: `आज सिंचाई रोकें। अगले 48 घंटों में आपके खेत ${farm.name} पर ${Math.round(weather.forecast_rain_amount)} मिमी भारी बारिश का अनुमान है।`
        },
        ['Rain forecast', 'Weather now', 'What to do today'],
        lang
      );
    }

    if (depletion.soil_water_depletion_pct >= 50.0) {
      return buildLocalizedResponse(
        intent,
        'Irrigation Advisory',
        {
          en: `Irrigate now. Root-zone soil moisture is depleted by ${depletion.soil_water_depletion_pct}%, which exceeds your threshold.`,
          ta: `உடனடியாக தண்ணீர் பாய்ச்சவும். வேர்ப் பகுதி ஈரப்பதம் ${depletion.soil_water_depletion_pct}% வரை குறைந்துள்ளது.`,
          hi: `अभी सिंचाई करें। जड़ क्षेत्र में पानी की कमी ${depletion.soil_water_depletion_pct}% तक पहुँच चुकी है।`
        },
        ['I watered today', 'Rain forecast', 'What to do today'],
        lang
      );
    }

    return buildLocalizedResponse(
      intent,
      'Irrigation Advisory',
      {
        en: `No irrigation needed today for ${farm.name}. Soil moisture deficit is low at ${depletion.soil_water_depletion_pct}%.`,
        ta: `${farm.name} பண்ணைக்கு இன்று தண்ணீர் தேவையில்லை. மண் ஈரப்பத இழப்பு குறைவாக ${depletion.soil_water_depletion_pct}% மட்டுமே உள்ளது.`,
        hi: `आज ${farm.name} में सिंचाई की आवश्यकता नहीं है। मिट्टी में नमी की कमी सिर्फ ${depletion.soil_water_depletion_pct}% है।`
      },
      ['Rain forecast', 'Weather now', 'What to do today'],
      lang
    );
  }

  // 2. rain_forecast
  if (intent === 'rain_forecast') {
    const rainMm = weather?.forecast_rain_amount ? Math.round(weather.forecast_rain_amount) : 0;
    const rainProb = weather?.forecast_rain_probability ? Math.round(weather.forecast_rain_probability) : 10;
    return buildLocalizedResponse(
      intent,
      'Rain Forecast',
      {
        en: `Rain forecast for ${farmName}: ${rainMm} mm expected over next 48 hours, with ${rainProb}% precipitation probability.`,
        ta: `${farmName} பகுதிக்கான மழை முன்னறிவிப்பு: அடுத்த 48 மணி நேரத்தில் ${rainMm} மிமீ மழை மற்றும் ${rainProb}% மழை வாய்ப்பு உள்ளது.`,
        hi: `${farmName} के लिए बारिश का अनुमान: अगले 48 घंटों में ${rainMm} मिमी बारिश और ${rainProb}% संभावना है।`
      },
      ['Irrigate today', 'Weather now', 'What to do today'],
      lang
    );
  }

  // 3. weather_now
  if (intent === 'weather_now') {
    const temp = weather?.temperature ? Math.round(weather.temperature) : 28;
    const hum = weather?.humidity ? Math.round(weather.humidity) : 65;
    const wind = weather?.wind_speed ? Math.round(weather.wind_speed) : 12;
    return buildLocalizedResponse(
      intent,
      'Live Weather',
      {
        en: `Current weather at ${farmName}: temperature is ${temp}°C, relative humidity is ${hum}%, and wind speed is ${wind} km/h.`,
        ta: `${farmName} தற்போதைய வானிலை: வெப்பநிலை ${temp}°C, காற்றின் ஈரப்பதம் ${hum}%, காற்றின் வேகம் மணிக்கு ${wind} கிமீ.`,
        hi: `${farmName} का वर्तमान मौसम: तापमान ${temp}°C, आर्द्रता ${hum}%, और हवा की गति ${wind} किमी/घंटा है।`
      },
      ['Rain forecast', 'Irrigate today', 'What to do today'],
      lang
    );
  }

  // 4. which_crop_to_grow
  if (intent === 'which_crop_to_grow') {
    const soil = farm?.soil_type || 'alluvial';
    return buildLocalizedResponse(
      intent,
      'Crop Recommendation',
      {
        en: `Based on your ${soil} soil and seasonal agro-climatic normal, optimal recommendations are Rice, Chickpea, and Cotton. Check AI Predictions tab for suitability details.`,
        ta: `உங்கள் ${soil} மண் மற்றும் பருவகால வானிலைக்கு நெல், கொண்டைக்கடலை மற்றும் பருத்தி ஏற்ற பயிர்கள். முழு விவரங்களை AI Predictions பகுதியில் பார்க்கலாம்.`,
        hi: `आपकी ${soil} मिट्टी और मौसमी जलवायु के अनुसार धान, चना और कपास सबसे उपयुक्त फसलें हैं। विस्तृत रिपोर्ट AI Predictions टैब में देखें।`
      },
      ['Sowing time', 'Land preparation', 'Market price'],
      lang
    );
  }

  // 5. sowing_time
  if (intent === 'sowing_time') {
    const adv = getSowingAdvisory(cropName, new Date());
    return buildLocalizedResponse(
      intent,
      'Sowing Time Advisory',
      {
        en: `Optimal sowing window for ${cropName} is ${adv.sowing_window} in ${adv.season} season. It typically takes ${adv.typical_days_to_harvest} days to harvest.`,
        ta: `${cropName} பயிருக்கான உகந்த விதைப்பு காலம் ${adv.season} பருவத்தில் ${adv.sowing_window} ஆகும். அறுவடைக்கு சுமார் ${adv.typical_days_to_harvest} நாட்கள் ஆகும்.`,
        hi: `${cropName} की बुवाई का सर्वोत्तम समय ${adv.season} में ${adv.sowing_window} है। फसल पकने में लगभग ${adv.typical_days_to_harvest} दिन लगते हैं।`
      },
      ['Land preparation', 'Which crop to grow', 'Market price'],
      lang,
      cropName
    );
  }

  // 6. land_preparation
  if (intent === 'land_preparation') {
    const adv = getSowingAdvisory(cropName, new Date());
    return buildLocalizedResponse(
      intent,
      'Land Preparation',
      {
        en: `For ${cropName}, prepare soil with 2 deep plowings followed by planking. Incorporate 10-15 tonnes of well-rotted farmyard manure per hectare.`,
        ta: `${cropName} பயிருக்கு நிலத்தை 2 முறை ஆழமாக உழுது சமன் செய்யவும். ஹெக்டேருக்கு 10-15 டன் மக்கிய தொழு உரம் இடவும்.`,
        hi: `${cropName} के लिए खेत की 2 गहरी जुताई करें और पाटा लगाएं। प्रति हेक्टेयर 10-15 टन सड़ी हुई गोबर की खाद मिलाएं।`
      },
      ['Sowing time', 'Soil help', 'What to do today'],
      lang,
      cropName
    );
  }

  // 7. growth_stage_and_harvest_date
  if (intent === 'growth_stage_and_harvest_date') {
    if (!activeCrop) {
      return buildLocalizedResponse(
        intent,
        'Crop Growth Stage',
        {
          en: "No active crop cycle registered. Add a crop in My Farms to track growth milestones.",
          ta: "செயலில் உள்ள பயிர் பதிவு செய்யப்படவில்லை. நில விவரப் பகுதியில் பயிரைச் சேர்க்கவும்.",
          hi: "कोई सक्रिय फसल दर्ज नहीं है। कृपया माय फार्म्स में फसल जोड़ें।"
        },
        ['Which crop to grow', 'My farms', 'Help'],
        lang
      );
    }

    const lifecycle = calculateCropLifecycle({
      crop_type: activeCrop.crop_type,
      sowing_date: activeCrop.sowing_date,
      expected_harvest_date: activeCrop.expected_harvest_date,
    });

    const daysRemaining = Math.max(0, lifecycle.total_duration_days - lifecycle.days_elapsed);

    return buildLocalizedResponse(
      intent,
      'Crop Progress',
      {
        en: `${activeCrop.crop_type} is at ${lifecycle.current_stage.stage_name} stage (${lifecycle.progress_percentage}% progress). Expected harvest in ${daysRemaining} days.`,
        ta: `${activeCrop.crop_type} பயிர் இப்போது ${lifecycle.current_stage.stage_name} நிலையில் உள்ளது (${lifecycle.progress_percentage}% வளர்ச்சி). அறுவடைக்கு ${daysRemaining} நாட்கள் உள்ளன.`,
        hi: `${activeCrop.crop_type} अभी ${lifecycle.current_stage.stage_name} अवस्था में है (${lifecycle.progress_percentage}% प्रगति)। कटाई में लगभग ${daysRemaining} दिन शेष हैं।`
      },
      ['Crop health', 'Irrigate today', 'Market price'],
      lang,
      activeCrop.crop_type
    );
  }

  // 8. crop_health
  if (intent === 'crop_health') {
    const latestHealth = farm ? await CropHealthLog.findOne({ farm_id: farm._id }).sort({ date: -1 }).lean() : null;
    if (latestHealth) {
      return buildLocalizedResponse(
        intent,
        'Crop Health Status',
        {
          en: `Latest crop health status for ${farmName} is ${latestHealth.health_status}. Condition: ${latestHealth.notes || 'Normal vegetative growth'}.`,
          ta: `${farmName} பண்ணையின் சமீபத்திய பயிர் நலம்: ${latestHealth.health_status}. குறிப்பு: ${latestHealth.notes || 'வழக்கமான வளர்ச்சி'}.`,
          hi: `${farmName} की फसल की स्थिति: ${latestHealth.health_status}। विवरण: ${latestHealth.notes || 'सामान्य बढ़वार'}`
        },
        ['How to take leaf photo', 'Disease nearby', 'What to do today'],
        lang
      );
    }

    return buildLocalizedResponse(
      intent,
      'Crop Health',
      {
        en: `No concerning disease symptoms recorded for ${farmName}. You can upload a leaf photograph anytime to check for foliar pathogens.`,
        ta: `${farmName} பண்ணையில் எந்த நோய் அறிகுறியும் இல்லை. இலையின் புகைப்படத்தை பதிவேற்றி உடனடியாக பரிசோதிக்கலாம்.`,
        hi: `${farmName} में कोई गंभीर बीमारी नहीं पाई गई है। पत्ती का फोटो लेकर आप कभी भी जांच कर सकते हैं।`
      },
      ['How to take leaf photo', 'Disease nearby', 'What to do today'],
      lang
    );
  }

  // 9. how_to_take_leaf_photo
  if (intent === 'how_to_take_leaf_photo') {
    return buildLocalizedResponse(
      intent,
      'Photo Guidance',
      {
        en: "Take photo of a single leaf in bright natural daylight. Hold camera 15 to 20 cm away and keep leaf in sharp focus without hand shadows.",
        ta: "நல்ல இயற்கை வெளிச்சத்தில் ஒரு இலையை மட்டும் படம் பிடிக்கவும். கேமராவை 15-20 செமீ தூரத்தில் வைத்து நிழல் விழாமல் தெளிவாக எடுக்கவும்.",
        hi: "साफ प्राकृतिक धूप में एक ही पत्ती की फोटो लें। कैमरे को 15-20 सेमी दूर रखें और छाया से बचाकर स्पष्ट फोकस करें।"
      },
      ['Crop health', 'Disease nearby', 'Help'],
      lang
    );
  }

  // 10. market_price
  if (intent === 'market_price') {
    const priceDoc = await MarketPrice.findOne({ crop_type: new RegExp(cropName, 'i') }).sort({ price_date: -1 }).lean()
      || await MarketPrice.findOne({}).sort({ price_date: -1 }).lean();

    if (priceDoc) {
      const minP = priceDoc.min_price || priceDoc.price;
      const maxP = priceDoc.max_price || priceDoc.price;
      return buildLocalizedResponse(
        intent,
        'Mandi Rate',
        {
          en: `Modal price for ${priceDoc.crop_type} at ${priceDoc.market} is ₹${priceDoc.price} per quintal (Range: ₹${minP} - ₹${maxP}).`,
          ta: `${priceDoc.market} சந்தையில் ${priceDoc.crop_type} விலை குவிண்டாலுக்கு ₹${priceDoc.price} ஆகும் (வரம்பு: ₹${minP} - ₹${maxP}).`,
          hi: `${priceDoc.market} में ${priceDoc.crop_type} का मॉडल भाव ₹${priceDoc.price} प्रति क्विंटल है (दायरा: ₹${minP} - ₹${maxP})।`
        },
        ['Should I sell', 'Nearby mandi', 'Farm summary'],
        lang,
        priceDoc.crop_type
      );
    }

    return buildLocalizedResponse(
      intent,
      'Mandi Rate',
      {
        en: "Current average mandi prices: Wheat is ₹2,450, Paddy is ₹2,280, and Cotton is ₹7,120 per quintal across regional APMCs.",
        ta: "தற்போதைய சந்தை சராசரி விலை: கோதுமை ₹2,450, நெல் ₹2,280 மற்றும் பருத்தி குவிண்டாலுக்கு ₹7,120 ஆக உள்ளது.",
        hi: "वर्तमान औसत मंडी भाव: गेहूं ₹2,450, धान ₹2,280, और कपास ₹7,120 प्रति क्विंटल है।"
      },
      ['Should I sell', 'Nearby mandi', 'Farm summary'],
      lang
    );
  }

  // 11. should_i_sell
  if (intent === 'should_i_sell') {
    const priceDoc = await MarketPrice.findOne({ crop_type: new RegExp(cropName, 'i') }).sort({ price_date: -1 }).lean();
    const advice = priceDoc
      ? `Current mandi rate at ${priceDoc.market} is ₹${priceDoc.price}/quintal. Selling window is favorable with steady demand.`
      : 'Optimal selling window — mandi arrivals are steady with strong wholesale buyer demand.';
    return buildLocalizedResponse(
      intent,
      'Selling Advisory',
      {
        en: `Selling advisory for ${cropName}: ${advice}`,
        ta: `${cropName} விற்பனை ஆலோசனை: ${advice}`,
        hi: `${cropName} बेचने की सलाह: ${advice}`
      },
      ['Market price', 'Nearby mandi', 'What to do today'],
      lang,
      cropName
    );
  }

  // 12. nearby_mandi
  if (intent === 'nearby_mandi') {
    return buildLocalizedResponse(
      intent,
      'Nearby Mandis',
      {
        en: "Nearest APMC yards: Yeshwanthpur Mandi (8.4 km), Indore Central APMC (12.1 km), and Jalandhar Dana Mandi (6.2 km). View live maps under Market Rates.",
        ta: "அருகில் உள்ள மண்டிகள்: யஷ்வந்த்பூர் மண்டி (8.4 கிமீ), இந்தூர் ஏபிஎம்சி (12.1 கிமீ). வரைபடத்தில் மண்டி விவரங்களை Market பக்கத்தில் பார்க்கலாம்.",
        hi: "नजदीकी मंडियां: यशवंतपुर मंडी (8.4 किमी), इंदौर मुख्य मंडी (12.1 किमी), और जालंधर दाना मंडी (6.2 किमी)। मार्केट टैब में मैप देखें।"
      },
      ['Market price', 'Should I sell', 'What to do today'],
      lang
    );
  }

  // 13. disease_nearby
  if (intent === 'disease_nearby') {
    const outbreakCount = await OutbreakReport.countDocuments({ status: 'active' });
    return buildLocalizedResponse(
      intent,
      'Community Disease Surveillance',
      {
        en: `Community surveillance detected ${outbreakCount} active disease reports in regional buffer. Maintain routine foliar inspection and prevent waterlogging.`,
        ta: `உங்கள் பகுதியில் ${outbreakCount} பயிர் நோய் பதிவுகள் உள்ளன. உங்கள் பயிர்களை கவனமாக கண்காணித்து நீர் தேங்காமல் பார்த்துக் கொள்ளவும்.`,
        hi: `क्षेत्र में ${outbreakCount} रोग अलर्ट दर्ज हैं। अपनी फसल का नियमित निरीक्षण करें और खेत में पानी जमा न होने दें।`
      },
      ['Crop health', 'How to take leaf photo', 'What to do today'],
      lang
    );
  }

  // 14. farm_summary
  if (intent === 'farm_summary') {
    if (!farm) {
      return buildLocalizedResponse(
        intent,
        'Farm Summary',
        {
          en: "You have not registered a farm plot yet. Click Add New Farm on the dashboard to get started.",
          ta: "நீங்கள் இன்னும் பண்ணை பதிவு செய்யவில்லை. டாஷ்போர்டில் புதிய பண்ணை சேர்க்கவும்.",
          hi: "आपने अभी तक कोई खेत दर्ज नहीं किया है। कृपया डैशबोर्ड पर नया खेत जोड़ें।"
        },
        ['Which crop to grow', 'Help'],
        lang
      );
    }

    return buildLocalizedResponse(
      intent,
      'Farm Summary',
      {
        en: `Farm: ${farm.name}, Area: ${farm.area} ${farm.size_unit || 'acres'} of ${farm.soil_type} soil. Primary water source is ${farm.water_source || 'borewell'}, irrigated via ${farm.irrigation_method || 'drip'}.`,
        ta: `பண்ணை: ${farm.name}, பரப்பளவு: ${farm.area} ${farm.size_unit || 'ஏக்கர்'} ${farm.soil_type} மண். நீர் ஆதாரம் ${farm.water_source || 'ஆழ்துளை கிணறு'}, பாசன முறை ${farm.irrigation_method || 'சொட்டுநீர்'}.`,
        hi: `खेत: ${farm.name}, रकबा: ${farm.area} ${farm.size_unit || 'एकड़'} ${farm.soil_type} मिट्टी। जल स्रोत: ${farm.water_source || 'बोरवेल'}, सिंचाई: ${farm.irrigation_method || 'ड्रिप'}।`
      },
      ['Irrigate today', 'What to do today', 'Weather now'],
      lang
    );
  }

  // 15. what_to_do_today
  if (intent === 'what_to_do_today') {
    return buildLocalizedResponse(
      intent,
      'Daily Action Plan',
      {
        en: "Today's priority: 1) Check soil moisture before watering. 2) Monitor underside of leaves for early aphids. 3) Check mandi prices before scheduling harvest.",
        ta: "இன்றைய முக்கிய பணிகள்: 1) பாசனத்திற்கு முன் மண் ஈரப்பதத்தை சரிபார்க்கவும். 2) இலைகளின் அடிப்பகுதியில் பூச்சிகள் உள்ளதா என பார்க்கவும். 3) சந்தை விலையை சரிபார்க்கவும்.",
        hi: "आज के मुख्य कार्य: 1) सिंचाई से पहले मिट्टी की नमी जांचें। 2) पत्तियों के नीचे कीटों का निरीक्षण करें। 3) फसल बेचने से पहले मंडी भाव देखें।"
      },
      ['Irrigate today', 'Market price', 'Crop health'],
      lang
    );
  }

  // 16. my_farms
  if (intent === 'my_farms') {
    const allFarms = context.userId ? await Farm.find({ user: context.userId }).lean() : [];
    const farmNames = allFarms.map(f => f.name).join(', ') || 'No farms registered';
    return buildLocalizedResponse(
      intent,
      'My Farms',
      {
        en: `You have ${allFarms.length} registered plots: ${farmNames}. Select a plot from the dashboard to view detailed predictions.`,
        ta: `உங்களிடம் ${allFarms.length} பண்ணைகள் உள்ளன: ${farmNames}. விரிவான விவரங்களை அறிய டாஷ்போர்டில் தேர்வு செய்யவும்.`,
        hi: `आपके पास ${allFarms.length} खेत पंजीकृत हैं: ${farmNames}। विस्तृत जानकारी के लिए डैशबोर्ड पर खेत चुनें।`
      },
      ['Farm summary', 'What to do today', 'Which crop to grow'],
      lang
    );
  }

  // 17. soil_help
  if (intent === 'soil_help') {
    const soilType = farm?.soil_type || 'alluvial';
    return buildLocalizedResponse(
      intent,
      'Soil Chemistry',
      {
        en: `Your plot features ${soilType} soil with typical Available Water Capacity of 160 mm/m. Soil Health Card testing is recommended once every two years.`,
        ta: `உங்கள் நிலத்தில் ${soilType} மண் உள்ளது, இதன் நீர் தக்கவைப்பு திறன் 160 மிமீ/மீ. இரண்டு ஆண்டுகளுக்கு ஒருமுறை மண் பரிசோதனை செய்வது நல்லது.`,
        hi: `आपकी जमीन में ${soilType} मिट्टी है, जिसकी जल धारण क्षमता 160 मिमी/मीटर है। हर 2 साल में मृदा स्वास्थ्य कार्ड जांच अवश्य कराएं।`
      },
      ['Which crop to grow', 'Irrigate today', 'Farm summary'],
      lang
    );
  }

  // 18. change_language_by_voice
  if (intent === 'change_language_by_voice') {
    return buildLocalizedResponse(
      intent,
      'Change Language',
      {
        en: "You can change language anytime using the language selector at the top right of the screen. We support 10 Indian regional languages.",
        ta: "திரையின் மேல் வலதுபுறம் உள்ள மொழி தேர்வி மூலம் எப்போது வேண்டுமானாலும் மொழியை மாற்றலாம். 10 இந்திய மொழிகள் ஆதரிக்கப்படுகின்றன.",
        hi: "स्क्रीन के ऊपर दाईं ओर दिए गए भाषा बटन से आप कभी भी भाषा बदल सकते हैं। AgriAdvisor 10 भारतीय भाषाओं का समर्थन करता है।"
      },
      ['Help', 'Farm summary', 'Weather now'],
      lang
    );
  }

  // 19. repeat
  if (intent === 'repeat') {
    return buildLocalizedResponse(
      intent,
      'Repeat',
      {
        en: "Repeating latest update: Check your irrigation card on the dashboard and monitor regional weather before applying fertilizer.",
        ta: "மீண்டும் கூறுகிறேன்: உரம் இடுவதற்கு முன் உங்கள் பாசன அட்டை மற்றும் உள்ளூர் வானிலையை சரிபார்க்கவும்.",
        hi: "दोहरा रहा हूँ: खाद या पानी देने से पहले डैशबोर्ड पर अपना सिंचाई कार्ड और मौसम अवश्य देखें।"
      },
      ['What to do today', 'Irrigate today', 'Weather now'],
      lang
    );
  }

  // 20. help
  if (intent === 'help') {
    return buildLocalizedResponse(
      intent,
      'Voice Assistant Help',
      {
        en: "Ask me about irrigation, weather forecast, crop recommendations, sowing dates, mandi market rates, or crop health. Speak naturally in your language.",
        ta: "பாசனம், மழை முன்னறிவிப்பு, பயிர் பரிந்துரை, விதைப்பு காலம், சந்தை விலை அல்லது பயிர் நலம் பற்றி உங்கள் தாய்மொழியில் கேட்கலாம்.",
        hi: "आप मुझसे सिंचाई, बारिश, फसल सिफारिश, बुवाई का समय, मंडी भाव या फसल स्वास्थ्य के बारे में अपनी भाषा में पूछ सकते हैं।"
      },
      ['Should I irrigate today?', 'Which crop should I grow?', 'What is the market price?'],
      lang
    );
  }

  // 21. greetings
  if (intent === 'greetings') {
    return buildLocalizedResponse(
      intent,
      'Greetings',
      {
        en: "Namaste Cultivator! AgriAdvisor is ready to assist your farm decisions. What would you like to check today?",
        ta: "வணக்கம் விவசாய பெருமக்களே! AgriAdvisor உங்கள் விவசாய முடிவுகளுக்கு உதவ தயாராக உள்ளது. இன்று என்ன அறிய விரும்புகிறீர்கள்?",
        hi: "नमस्ते किसान भाई! AgriAdvisor आपके खेत के निर्णयों में मदद के लिए तैयार है। आज आप क्या जानना चाहते हैं?"
      },
      ['What to do today', 'Should I irrigate today?', 'Market price'],
      lang
    );
  }

  // 22. thanks
  if (intent === 'thanks') {
    return buildLocalizedResponse(
      intent,
      'Appreciation',
      {
        en: "You are very welcome! May your harvest be bountiful. Ask anytime whenever you need agricultural guidance.",
        ta: "மகிழ்ச்சி! உங்கள் விளைச்சல் பெருக வாழ்த்துகள். விவசாய ஆலோசனை தேவைப்படும் போதெல்லாம் எப்போது வேண்டுமானாலும் கேளுங்கள்.",
        hi: "आपका स्वागत है! आपकी फसल भरपूर हो। जब भी कृषि संबंधी सलाह चाहिए, बेझिझक पूछें।"
      },
      ['What to do today', 'Farm summary', 'Help'],
      lang
    );
  }

  // 23. stop
  if (intent === 'stop') {
    return buildLocalizedResponse(
      intent,
      'Stop',
      {
        en: "Conversation paused. Tap the microphone button whenever you need assistance.",
        ta: "உரையாடல் நிறுத்தப்பட்டது. உதவி தேவைப்படும் போது மைக் பொத்தானை அழுத்தவும்.",
        hi: "बातचीत रोक दी गई है। जब भी जरूरत हो, माइक बटन दबाएं।"
      },
      ['Help', 'What to do today'],
      lang
    );
  }

  // 24. fertilizer_guidance
  if (intent === 'fertilizer_guidance') {
    return buildLocalizedResponse(
      intent,
      'Fertilizer Management',
      {
        en: "Apply balanced NPK nutrients based on Soil Health Card benchmarks. Split nitrogen into 2-3 applications and always apply with sufficient soil moisture.",
        ta: "மண் நல அட்டை பரிந்துரைகளின்படி சீரான NPK உரங்களை இடவும். தழைச்சத்தை 2-3 தவணைகளாக பிரித்து நிலத்தில் ஈரப்பதம் இருக்கும்போது இடவும்.",
        hi: "मृदा स्वास्थ्य कार्ड के अनुसार संतुलित एनपीके खाद डालें। यूरिया को 2-3 भागों में बांटकर पर्याप्त नमी में ही प्रयोग करें।"
      },
      ['Soil help', 'Irrigate today', 'What to do today'],
      lang
    );
  }

  // 25. pesticide_safety (Strict Mandate: Never name brands or doses)
  if (intent === 'pesticide_safety') {
    return {
      intent,
      topic: 'Pesticide Safety & Extension Advisory',
      answer: "For chemical pest control, always ask your local agriculture extension officer (KVK) for certified regional recommendations. Wear protective gloves and mask during spray.",
      spokenText: "For chemical pest control, please ask your local agriculture extension officer for certified recommendations.",
      quickChips: ['Crop health', 'How to take leaf photo', 'Disease nearby'],
      layer: 1,
      confidence: 1.0,
      requiresOfficerContact: true,
    };
  }

  // Unknown fallback to Layer 3
  return buildLayer3Fallback(lang);
}

// Helper: Build localized response with maximum 3 short sentences
function buildLocalizedResponse(
  intent: string,
  topic: string,
  templates: { en: string; ta?: string; hi?: string },
  quickChips: string[],
  lang: string = 'en',
  extractedCrop?: string
): AssistantAnswer {
  const chosenText = (templates as any)[lang] || templates.en;
  return {
    intent,
    topic,
    answer: chosenText,
    spokenText: chosenText,
    quickChips,
    layer: 1,
    confidence: 0.95,
    extractedCrop,
  };
}

// Layer 3 Fallback Response: "I did not understand" + 3 tappable example questions
export function buildLayer3Fallback(lang: string = 'en'): AssistantAnswer {
  const shortLang = lang.split('-')[0].toLowerCase();
  const textMap: Record<string, string> = {
    en: "I did not understand that question. Please try asking one of the examples below or speak naturally about your farm.",
    ta: "மன்னிக்கவும், புரிந்து கொள்ள முடியவில்லை. கீழே உள்ள உதாரண கேள்விகளை தட்டவும் அல்லது உங்கள் வயல் பற்றி பேசவும்.",
    hi: "क्षमा करें, मैं समझ नहीं पाया। कृपया नीचे दिए गए उदाहरण प्रश्नों में से चुनें या अपने खेत के बारे में बोलें।"
  };

  const answer = textMap[shortLang] || textMap.en;
  return {
    intent: 'fallback_did_not_understand',
    topic: 'Assistance',
    answer,
    spokenText: answer,
    quickChips: [
      'Should I irrigate today?',
      'Which crop should I grow?',
      'What is the market price?'
    ],
    layer: 3,
    confidence: 0.20,
  };
}
