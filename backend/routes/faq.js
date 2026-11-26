const express = require('express');
const defaultRegistry = require('../data/facts').defaultRegistry;
const VERIFICATION = {
    status: 'unverified_inherited',
    note: 'Prices, timings, distances, facilities and other details are inherited and not officially confirmed. Check official sources before relying on them.',
};

const faqs = [
    // Getting There
    {
        id: 1,
        category: 'Getting There',
        question: 'How do I reach Ujjain for Simhastha Kumbh 2028?',
        answer: 'Ujjain is well-connected by train (Ujjain Junction), road (NH-52, NH-47), and via nearby Indore airport (55 km). MP State Roadways runs regular buses. Indian Railways will operate special Simhastha trains from Delhi, Mumbai, Bhopal, and Ahmedabad. The nearest airport is Devi Ahilya Bai Holkar Airport, Indore.',
    },
    {
        id: 2,
        category: 'Getting There',
        question: 'Which trains go to Ujjain for Simhastha 2028?',
        answer: 'Indian Railways will operate special Simhastha trains from Delhi, Mumbai, Bhopal, Ahmedabad, Kolkata, and other cities. Book on IRCTC (irctc.co.in) at least 30-60 days in advance. Ujjain Junction is the main station — centrally located, just 2 km from Ram Ghat.',
    },
    {
        id: 3,
        category: 'Getting There',
        question: 'Can I reach Ujjain by road?',
        answer: 'Yes! Ujjain is connected via NH-52 (Agra-Mumbai), NH-47, and NH-146. MP State Roadways and private buses run from Indore (1.5 hrs), Bhopal (4 hrs), and Ahmedabad (5 hrs). Parking is at designated zones outside the mela area; shuttles ferry pilgrims to ghats.',
    },
    {
        id: 4,
        category: 'Getting There',
        question: 'What is the nearest airport to Ujjain?',
        answer: 'Devi Ahilya Bai Holkar Airport, Indore (IATA: IDR) is 55 km from Ujjain — about 1-1.5 hours by taxi. IndiGo, Air India, and SpiceJet fly here from Delhi, Mumbai, Bangalore, and other cities. Pre-book a taxi for the Indore–Ujjain transfer.',
    },
    {
        id: 5,
        category: 'Getting There',
        question: 'How do I get from Ujjain station to the ghats?',
        answer: 'From Ujjain Junction: government shuttle buses (every 15-20 min), e-rickshaws (₹20-50), autos, or Simhastha mela buses. Ram Ghat is about 2 km from the station. Avoid private vehicles on major bathing days as roads near the ghats are closed to traffic.',
    },
    {
        id: 6,
        category: 'Getting There',
        question: 'When is the best time to visit to avoid heavy crowds?',
        answer: 'Avoid the main snan (bathing) days if you prefer smaller crowds. The individual dates have not been officially confirmed yet; check official announcements. Weekdays are usually calmer than weekends, and early morning is usually quieter for a bath.',
    },

    // Accommodation
    {
        id: 7,
        category: 'Accommodation',
        question: 'Where can I stay during Simhastha Kumbh 2028?',
        answer: 'Options: 1) Government tent cities near Ram Ghat on Kshipra riverbank, 2) Private tent cities (budget to luxury), 3) Dharamshalas and akhara camps (some free), 4) Hotels in Ujjain city — book 2-3 months early, 5) Hotels in Indore (55 km) as an overflow option with daily commute by train or road.',
    },
    {
        id: 8,
        category: 'Accommodation',
        question: 'How much does accommodation cost during Simhastha?',
        answer: 'Costs vary: Basic government tents: ₹200-500/night, Private tent cities: ₹500-5000+/night, Dharamshalas: ₹100-300/night, Hotels in Ujjain: ₹800-5000+/night, Indore hotels: ₹600-4000/night. Prices may surge near major bathing days. Book at least 2-3 months in advance.',
    },
    {
        id: 9,
        category: 'Accommodation',
        question: 'Are there free accommodation options in Ujjain?',
        answer: 'Yes! Many akharas, dharamshalas, and temples offer free or nominal-cost accommodation. ISKCON Ujjain, Sandipani Ashram, and various akhara camps provide accommodation with participation in daily prayers. Book in advance as spaces fill quickly.',
    },
    {
        id: 10,
        category: 'Accommodation',
        question: 'Is it safe to stay in tent cities?',
        answer: 'Yes. The Simhastha Authority sets up well-organized tent cities with security, lighting, and basic amenities. Government camps are regularly patrolled. Keep valuables secure, use locker facilities, and keep emergency numbers handy. Traveling in groups after dark is recommended.',
    },
    {
        id: 11,
        category: 'Accommodation',
        question: 'Can I stay in Indore and commute to Ujjain daily?',
        answer: 'Yes! Many pilgrims base themselves in Indore (55 km) and commute by train (about 1 hr) or road (1.5 hrs). This is a great option when Ujjain accommodation is fully booked.',
    },

    // Religious Events
    {
        id: 12,
        category: 'Religious Events',
        question: 'What are the Amrit Snan dates for Simhastha Kumbh 2028?',
        answer: 'The individual bathing dates have not been officially confirmed yet. The planned schedule is 3 Shahi Snan and 7 Parv Snan during 9 April to 8 May 2028 (proposed, awaiting official confirmation, based on a Madhya Pradesh government publication dated 11-17 March 2024). Please check official announcements from the Madhya Pradesh government or Ujjain District Administration (https://ujjain.nic.in).',
    },
    {
        id: 13,
        category: 'Religious Events',
        question: 'Why is Ujjain special for Kumbh Mela?',
        answer: 'Ujjain is one of four sacred Kumbh Mela cities (with Prayagraj, Haridwar, and Nashik). According to legend, drops of divine nectar fell here during Samudra Manthan. It is called "Simhastha" because the mela occurs when Jupiter enters Leo (Simha Rashi). Ujjain is also home to Mahakaleshwar — one of the 12 Jyotirlingas of Lord Shiva.',
    },
    {
        id: 14,
        category: 'Religious Events',
        question: 'What is Mesh Sankranti and why is it the most important day?',
        answer: 'Mesh Sankranti is when the Sun enters Aries (Mesh Rashi). This astronomical alignment, combined with Jupiter in Leo, is the reason Simhastha is held in Ujjain. Whether it will be a bathing date in 2028 has not been officially confirmed yet. Expect very large crowds on major bathing days.',
    },
    {
        id: 15,
        category: 'Religious Events',
        question: 'What is the Akhara procession at Simhastha?',
        answer: 'The Amrit Snan procession is led by the thirteen akharas of Naga sadhus, saints, and ascetics in a traditional order. The spectacular procession features elephants, chariots, and thousands of ash-clad Naga sadhus. Devotees consider it auspicious to seek blessings from the saints during this once-in-12-years event.',
    },
    {
        id: 16,
        category: 'Religious Events',
        question: 'What should I carry for the holy bath in Kshipra?',
        answer: 'Carry: 2 extra sets of clothes, waterproof bag for valuables, small towel, copper vessel for holy Kshipra water, offerings (flowers, fruits, diyas), and a small first aid kit. Wear simple cotton clothes in saffron/yellow/white. Avoid expensive jewelry. Wet sandals are practical at the ghat.',
    },
    {
        id: 17,
        category: 'Religious Events',
        question: 'What other rituals can I do during Simhastha 2028?',
        answer: 'Beyond the holy dip: attend Bhasma Aarti at Mahakaleshwar Jyotirlinga (4 AM — book passes online in advance), witness Kshipra Aarti at Ram Ghat at sunset, perform Pind Daan at Siddhavat Ghat, visit Kal Bhairav Temple and Harsiddhi Mata, attend pravachans by saints, and complete the Simhastha Parikrama (ritual circumambulation).',
    },

    // Health & Safety
    {
        id: 18,
        category: 'Health & Safety',
        question: 'What health precautions should I take for Simhastha 2028?',
        answer: 'Critical: Ujjain in April-May can reach 40-43°C. Carry 2-3 litres of water at all times, drink only bottled/filtered water, eat at certified stalls, carry ORS sachets and heatstroke medicine, wear light cotton clothes with a cap or umbrella, apply SPF 50+ sunscreen, avoid being outdoors 11 AM-4 PM, and get Hepatitis A/B and Typhoid vaccinations.',
    },
    {
        id: 19,
        category: 'Health & Safety',
        question: 'How do I handle crowd safety at Simhastha?',
        answer: 'Crowd safety: Set a specific meeting point before entering crowded areas (Ram Ghat Gate or Mahakal Temple entrance), carry a whistle, keep phone charged with a power bank, avoid pushing in dense crowds, move with the crowd flow if caught in a surge, identify nearest exits when you arrive, and follow police and volunteer instructions.',
    },
    {
        id: 20,
        category: 'Health & Safety',
        question: 'What if I lose my companions in the Simhastha crowd?',
        answer: 'If separated: 1) Go to the nearest police post or volunteer booth immediately, 2) Call 112 (national emergency number), 3) Loudspeaker announcements are made across mela grounds, 4) Visit Lost & Found Center near Ram Ghat Sector 1 gate. Prevention: agree on a meeting point, share phone numbers, write your number on children\'s wrists.',
    },
    {
        id: 21,
        category: 'Health & Safety',
        question: 'What medical facilities are available at Simhastha 2028?',
        answer: 'The Simhastha Authority deploys medical camps across all sectors, main hospital within the mela grounds, heatstroke treatment centres (essential given April-May temperatures), mobile medical units, and ORS distribution points. Nearest major hospital: District Hospital Ujjain; for serious cases: MY Hospital Indore (55 km).',
    },
    {
        id: 22,
        category: 'Health & Safety',
        question: 'How do I deal with the intense heat at Simhastha?',
        answer: 'Beat the heat: carry a 2-litre water bottle and refill at free kiosks, wear loose cotton clothes in light colours, use an umbrella or wide-brim hat, avoid direct sun 11 AM-4 PM, eat light meals and avoid oily food in the heat, carry ORS sachets and use them if you feel dizzy, and rest in shaded mela rest zones during peak heat hours.',
    },

    // General
    {
        id: 23,
        category: 'General',
        question: 'What is Simhastha Kumbh 2028 and why is it special?',
        answer: 'Simhastha Kumbh 2028 is the grand Kumbh Mela held in Ujjain, Madhya Pradesh from 27 March to 27 May 2028 (planned period, proposed and awaiting official confirmation) on the Kshipra riverbank. It occurs every 12 years when Jupiter enters Leo (Simha Rashi) and the Sun enters Aries. The last Simhastha was in 2016. Attendance estimates have varied; there is no official figure.',
    },
    {
        id: 24,
        category: 'General',
        question: 'What should I pack for Simhastha Kumbh 2028?',
        answer: 'Pack: light cotton clothes (April-May is 40°C+), wide-brim hat and umbrella for sun, sunscreen SPF 50+, multiple sets of clothes for bathing, ORS sachets and heatstroke medicine, phone charger and power bank, water bottle, ID documents (Aadhaar), cash, small lock for tent, whistle, and a light backpack. You\'ll walk 8-12 km daily.',
    },
    {
        id: 25,
        category: 'General',
        question: 'What major temples should I visit in Ujjain during Simhastha?',
        answer: 'Must-visit: Mahakaleshwar Jyotirlinga (one of 12 Jyotirlingas — Bhasma Aarti at 4 AM), Kal Bhairav Temple, Harsiddhi Mata Temple (Shakti Peeth), Mangalnath Temple (birthplace of Mars), Sandipani Ashram (where Krishna studied), Chintaman Ganesh Temple, Bade Ganeshji Ka Mandir, and Ram Ghat for evening Kshipra Aarti.',
    },
    {
        id: 26,
        category: 'General',
        question: 'What ghat etiquette should I follow at Kshipra river?',
        answer: 'Ghat etiquette: Maintain silence or speak softly, remove footwear before ghat areas, dress modestly (cover shoulders and knees), do not litter, do not photograph people bathing without consent, avoid using soap/shampoo directly in the river, follow designated entry/exit flow, and respect others\' rituals and prayers.',
    },
    {
        id: 27,
        category: 'General',
        question: 'Are ATMs and digital payments available at Simhastha?',
        answer: 'Yes, ATMs from SBI, HDFC, and other banks will be deployed across mela grounds. ATMs may run dry on major bathing days, so carry ₹2,000-3,000 in cash. Digital payments (UPI, Google Pay, PhonePe) are widely accepted at certified stalls and shops in the mela area.',
    },
    {
        id: 28,
        category: 'General',
        question: 'Is Simhastha accessible for elderly and differently-abled pilgrims?',
        answer: 'Yes. The Simhastha Authority makes special arrangements: wheelchair-accessible paths to major ghats, dedicated bathing areas for elderly and differently-abled, volunteer helpers, golf carts for mobility assistance, special medical support, and accessible toilet facilities. Check official sources such as Ujjain District Administration (https://ujjain.nic.in) in advance to arrange specific assistance.',
    },
];

// The two answers below state calendar facts. They are kept only while the calendar records are
// public (not stale); otherwise they say the information is not currently verified.
const NO_DATES_ANSWER = 'Official dates for Simhastha Kumbh 2028, including bathing dates, are not currently verified in this app. Please check official announcements from the Madhya Pradesh government or Ujjain District Administration (https://ujjain.nic.in).';
const NO_PERIOD_GENERAL = 'Simhastha Kumbh 2028 is the grand Kumbh Mela to be held in Ujjain, Madhya Pradesh on the Kshipra riverbank. The dates are not currently verified in this app; please check official announcements. It occurs every 12 years when Jupiter enters Leo (Simha Rashi) and the Sun enters Aries. The last Simhastha was in 2016.';
function faqsFor(facts) {
    const ids = new Set(facts.getPublicFacts().map((r) => r.id));
    const hasPeriod = ids.has('calendar.simhastha2028.period');
    const hasPlan = ids.has('calendar.simhastha2028.snan_plan');
    return faqs.map((f) => {
        if (f.id === 12 && !(hasPeriod && hasPlan)) return { ...f, answer: NO_DATES_ANSWER };
        if (f.id === 23 && !hasPeriod) return { ...f, answer: NO_PERIOD_GENERAL };
        return f;
    });
}
// GET /api/faq
function createRouter(facts = defaultRegistry) {
    const router = express.Router();
    router.get('/', (req, res) => {
        const { category, search } = req.query;
        const all = faqsFor(facts);
        let result = [...all];
        if (category && category !== 'All') {
            result = result.filter((f) => f.category === category);
        }
        if (search && search.trim() !== '') {
            const q = search.toLowerCase();
            result = result.filter(
                (f) =>
                    f.question.toLowerCase().includes(q) ||
                    f.answer.toLowerCase().includes(q)
            );
        }
        const categories = [...new Set(all.map((f) => f.category))];
        res.json({ faqs: result, categories, total: result.length, verification: VERIFICATION });
    });
    return router;
}
module.exports = createRouter();
module.exports.createRouter = createRouter;