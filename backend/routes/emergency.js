const express = require('express');
const router = express.Router();

const emergencyContacts = [
    {
        id: 1,
        name: 'Police',
        number: '100',
        icon: 'shield',
        color: 'blue',
        description: 'For law and order emergencies',
        available: '24/7',
    },
    {
        id: 2,
        name: 'Ambulance',
        number: '108',
        icon: 'ambulance',
        color: 'red',
        description: 'Medical emergencies and first aid',
        available: '24/7',
    },
    {
        id: 3,
        name: 'Fire Brigade',
        number: '101',
        icon: 'flame',
        color: 'orange',
        description: 'Fire and rescue services',
        available: '24/7',
    },
    {
        id: 4,
        name: 'Tourist Helpline',
        number: '1800-180-5522',
        icon: 'info',
        color: 'green',
        description: 'Tourist assistance and information',
        available: '24/7',
        tollFree: true,
    },
    {
        id: 5,
        name: 'Simhastha Control Room',
        number: '0734-2551234',
        icon: 'radio',
        color: 'purple',
        description: 'Central coordination — Simhastha 2028, Ujjain',
        available: '24/7',
    },
    {
        id: 6,
        name: 'Women Helpline',
        number: '1090',
        icon: 'user',
        color: 'pink',
        description: 'Safety and assistance for women',
        available: '24/7',
    },
    {
        id: 7,
        name: 'Child Helpline',
        number: '1098',
        icon: 'heart',
        color: 'yellow',
        description: 'Help for lost or distressed children',
        available: '24/7',
    },
    {
        id: 8,
        name: 'NDRF',
        number: '011-24363260',
        icon: 'alert',
        color: 'teal',
        description: 'National Disaster Response Force',
        available: '24/7',
    },
];

const infoCards = [
    {
        id: 'lost-found',
        title: 'Lost & Found Center',
        icon: 'search',
        color: 'amber',
        details: [
            'Main Lost & Found: Sector 1, near Ram Ghat main entrance, Ujjain',
            'Report lost persons at nearest Police Post immediately',
            'Lost children: Announced on loudspeaker at all entry gates',
            'Keep a recent photo of companions on your phone',
            'Tie a distinct band on children\'s wrists with your phone number',
        ],
    },
    {
        id: 'medical',
        title: 'Medical & Heatstroke Centres',
        icon: 'cross',
        color: 'red',
        details: [
            'Medical camps across all sectors of Simhastha grounds',
            'Special heatstroke treatment centres (April-May is 40°C+)',
            'Free treatment at all government medical camps',
            'Ambulances stationed near all major ghats including Ram Ghat',
            'ORS distribution points at all sector entry gates',
        ],
    },
];

// GET /api/emergency
router.get('/', (req, res) => {
    res.json({
        contacts: emergencyContacts,
        infoCards,
        lastUpdated: '2028-03-01',
        event: 'Simhastha Kumbh 2028, Ujjain, MP',
    });
});

module.exports = router;
