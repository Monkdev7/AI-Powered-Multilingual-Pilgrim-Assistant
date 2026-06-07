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
