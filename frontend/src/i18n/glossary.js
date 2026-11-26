// Shared transliteration glossary for official place names and terms.
// Status: draft. Needs native-speaker review before any entry is marked reviewed.
export const GLOSSARY_META = { status: 'draft', reviewer: '', date: '' };

export const GLOSSARY = {
    ujjain: { en: 'Ujjain', hi: 'उज्जैन', bn: 'উজ্জয়িনী', ta: 'உஜ்ஜைன்', te: 'ఉజ్జయిని', mr: 'उज्जैन', gu: 'ઉજ્જૈન', pa: 'ਉਜੈਨ' },
    mp: { en: 'MP', hi: 'म.प्र.', bn: 'ম.প্র.', ta: 'ம.பி.', te: 'మ.ప్ర.', mr: 'म.प्र.', gu: 'મ.પ્ર.', pa: 'ਮ.ਪ੍ਰ.' },
    madhyaPradesh: { en: 'Madhya Pradesh', hi: 'मध्य प्रदेश', bn: 'মধ্যপ্রদেশ', ta: 'மத்தியப் பிரதேசம்', te: 'మధ్యప్రదేశ్', mr: 'मध्य प्रदेश', gu: 'મધ્ય પ્રદેશ', pa: 'ਮੱਧ ਪ੍ਰਦੇਸ਼' },
    simhastha: { en: 'Simhastha', hi: 'सिंहस्थ', bn: 'সিংহস্থ', ta: 'சிம்ஹஸ்த', te: 'సింహస్థ', mr: 'सिंहस्थ', gu: 'સિંહસ્થ', pa: 'ਸਿੰਹਸਥ' },
    kumbh: { en: 'Kumbh', hi: 'कुंभ', bn: 'কুম্ভ', ta: 'கும்பமேளா', te: 'కుంభ', mr: 'कुंभ', gu: 'કુંભ', pa: 'ਕੁੰਭ' },
    mahakaleshwar: { en: 'Mahakaleshwar', hi: 'महाकालेश्वर', bn: 'মহাকালেশ্বর', ta: 'மகாகாளேஸ்வரர்', te: 'మహాకాళేశ్వర్', mr: 'महाकालेश्वर', gu: 'મહાકાલેશ્વર', pa: 'ਮਹਾਕਾਲੇਸ਼ਵਰ' },
    kshipra: { en: 'Kshipra', hi: 'क्षिप्रा', bn: 'ক্ষিপ্রা', ta: 'க்ஷிப்ரா', te: 'క్షిప్ర', mr: 'क्षिप्रा', gu: 'ક્ષિપ્રા', pa: 'ਕਸ਼ਿਪਰਾ' },
    amritSnan: { en: 'Amrit Snan', hi: 'अमृत स्नान', bn: 'অমৃত স্নান', ta: 'அம்ருத ஸ்நானம்', te: 'అమృత స్నానం', mr: 'अमृत स्नान', gu: 'અમૃત સ્નાન', pa: 'ਅੰਮ੍ਰਿਤ ਇਸ਼ਨਾਨ' },
    bhasmaAarti: { en: 'Bhasma Aarti', hi: 'भस्म आरती', bn: 'ভস্ম আরতি', ta: 'பஸ்ம ஆரத்தி', te: 'భస్మ ఆరతి', mr: 'भस्म आरती', gu: 'ભસ્મ આરતી', pa: 'ਭਸਮ ਆਰਤੀ' },
    jaiMahakal: { en: 'Jai Mahakal', hi: 'जय महाकाल', bn: 'জয় মহাকাল', ta: 'ஜெய் மகாகால்', te: 'జై మహాకాల్', mr: 'जय महाकाल', gu: 'જય મહાકાલ', pa: 'ਜੈ ਮਹਾਕਾਲ' },
};

export function glossaryTerm(id, lang) {
    const entry = GLOSSARY[id];
    if (!entry) return undefined;
    return entry[lang] || entry.en;
}
