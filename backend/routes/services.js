const express = require('express');
const router = express.Router();

const services = [
    {
        id: 'food',
        category: 'Food & Langars',
        icon: '🍚',
        items: [
            {
                name: 'Government Food Camps',
                detail: 'Free meals at all sectors. Dal, rice, roti served.',
                location: 'Near each sector entry gate',
                timing: '7 AM – 10 PM',
                cost: 'Free',
            },
            {
                name: 'Akhara Langars',
                detail: 'Religious organizations serve free food to all pilgrims.',
                location: 'Near major akharas in tent city',
                timing: '6 AM – 9 PM',
                cost: 'Free (donation optional)',
            },
            {
                name: 'Mela Food Courts',
                detail: 'Certified stalls with snacks, thalis, and tea.',
                location: 'All sectors',
                timing: '5 AM – 11 PM',
                cost: '₹20 – ₹150',
            },
            // INHERITED, NOT independently verified: restored verbatim from the pre-Phase-2 frontend (LocalServices.jsx).
            {
                name: 'Mobile Canteens',
                detail: 'IRCTC and MP Tourism mobile canteens with standard pricing and hygienic food.',
                location: 'Near major ghats in Ujjain',
                timing: '6 AM – 9 PM',
                cost: '₹30 – ₹200',
            },
        ],
    },
    {
        id: 'water',
        category: 'Drinking Water',
        icon: '💧',
        warning: 'Do NOT drink river water. Use designated drinking water points only.',
        items: [
            {
                name: 'Drinking Water Kiosks',
                detail: 'RO-purified water kiosks every 200-300 meters across the mela grounds.',
                location: 'Entire mela area',
                timing: '24 hours',
                cost: 'Free',
            },
            {
                name: 'Packaged Water',
                detail: 'ISI-marked bottled water from certified vendors.',
                location: 'All major markets',
                timing: 'All day',
                cost: '₹15 – ₹25',
            },
        ],
    },
    {
        id: 'sanitation',
        category: 'Toilets & Sanitation',
        icon: '🚻',
        tip: 'Locate the nearest toilet block when you arrive at any sector.',
        items: [
            {
                name: 'Community Toilet Blocks',
                detail: 'Permanent and mobile toilet blocks throughout the mela grounds.',
                location: 'Near all major ghats',
                timing: '24 hours',
                cost: '₹2 – ₹5',
            },
            // INHERITED, NOT independently verified: restored verbatim from the pre-Phase-2 frontend.
            {
                name: 'Mobile Toilet Vans',
                detail: 'Mobile toilet units deployed during peak days and near congested areas.',
                location: 'Amrit Snan routes and crowded ghats',
                timing: '24 hours during Amrit Snan days',
                cost: 'Free',
            },
            {
                name: 'Pink Toilets (Women)',
                detail: 'Dedicated facilities for women at all major sectors.',
                location: 'All sectors — pink signs',
                timing: '24 hours',
                cost: '₹2',
            },
        ],
    },
    {
        id: 'banking',
        category: 'ATMs & Banking',
        icon: '🏧',
        tip: 'Carry ₹2,000-3,000 cash on Amrit Snan days. ATMs may run dry.',
        items: [
            {
                name: 'ATMs',
                detail: 'SBI, HDFC, ICICI, PNB ATMs deployed across the mela grounds.',
                location: 'Near main entry points',
                timing: '24 hours',
                cost: 'Bank charges apply',
            },
            {
                name: 'UPI / Digital Payments',
                detail: 'Google Pay, PhonePe, Paytm accepted at most certified stalls.',
                location: 'Across all markets',
                timing: 'All day',
                cost: 'No extra charge',
            },
            // INHERITED, NOT independently verified: restored verbatim from the pre-Phase-2 frontend.
            {
                name: 'Currency Exchange',
                detail: 'RBI-authorized foreign exchange counters for international pilgrims.',
                location: 'Near Sector 1 main entrance, Ujjain mela grounds',
                timing: '9 AM – 6 PM',
                cost: 'Standard exchange rates',
            },
        ],
    },
    // INHERITED, NOT independently verified: the two categories below were restored verbatim
    // from the pre-Phase-2 frontend (LocalServices.jsx, commit 4c4894a / HEAD), including the
    // warning/tip text exactly as it was (with its original leading symbols).
    {
        id: 'charging',
        category: 'Phone Charging',
        icon: '🔋',
        warning: '⚠\uFE0F A dead phone = serious risk. Always keep at least 30% battery. Carry a power bank!',
        items: [
            {
                name: 'Phone Charging Stations',
                detail: 'Solar-powered and grid-connected charging stations set up across the mela.',
                location: 'Near food courts and waiting areas at all major sectors',
                timing: '6 AM – 10 PM',
                cost: '₹10 – ₹20 per hour',
            },
            {
                name: 'Power Banks',
                detail: 'Carry your own power bank (10,000 mAh minimum recommended). Available to purchase at Ujjain and Indore markets.',
                location: 'Purchase at Freeganj or Tower Chowk market, Ujjain before entering the mela',
                timing: 'As needed',
                cost: '₹500-₹1500 to purchase',
            },
        ],
    },
    {
        id: 'accommodation-nearby',
        category: 'Local Accommodation',
        icon: '🏕',
        tip: '💡 Book accommodation 2-3 months before Amrit Snan dates. Prices triple close to the event.',
        items: [
            {
                name: 'Kumbh Tent Cities',
                detail: 'Organized tent cities with cots, blankets, and basic amenities in Simhastha Kumbh sectors near Ram Ghat, Ujjain.',
                location: 'Sectors 1-20, near Ram Ghat & Kshipra riverbank',
                timing: 'Check-in 24 hrs',
                cost: '₹300 – ₹5,000/night',
            },
            {
                name: 'Dharamshalas',
                detail: 'Traditional pilgrim rest houses run by temples and religious organizations in Ujjain. Book in advance.',
                location: 'Freeganj, Kothi Road, near Mahakal Temple',
                timing: '24 hours',
                cost: '₹100 – ₹500/night',
            },
            {
                name: 'Indore Hotels (Overflow)',
                detail: 'When Ujjain is full, Indore (55 km) hotels are a great base. Daily commute by train (1 hr) or road (1.5 hrs).',
                location: 'Indore city — well connected to Ujjain',
                timing: '24 hours',
                cost: '₹600 – ₹5,000/night',
            },
        ],
    },
];

// GET /api/services
router.get('/', (req, res) => {
    res.json({ services, total: services.length });
});

// GET /api/services/:id
router.get('/:id', (req, res) => {
    const service = services.find((s) => s.id === req.params.id);
    if (!service) {
        return res.status(404).json({ error: 'Service category not found' });
    }
    res.json(service);
});

module.exports = router;
