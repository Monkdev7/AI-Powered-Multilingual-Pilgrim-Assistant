import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Clock, Info } from 'lucide-react';

const services = [
    {
        id: 'food',
        category: 'Food & Langars',
        icon: '🍚',
        color: 'bg-green-50 border-green-200',
        headerColor: 'from-green-500 to-teal-500',
        items: [
            {
                name: 'Government Food Camps',
                detail: 'Free meals available at all sectors. Simple, nutritious food — dal, rice, roti.',
                location: 'Near each sector entry gate',
                timing: '7 AM – 10 PM',
                cost: 'Free',
            },
            {
                name: 'Akhara Langars',
                detail: 'Religious organizations serve free food to all pilgrims without discrimination.',
                location: 'Near major akharas in tent city',
                timing: '6 AM – 9 PM',
                cost: 'Free (donation optional)',
            },
            {
                name: 'Mela Food Courts',
                detail: 'Certified stalls selling snacks, thalis, and tea. Look for the green "Certified" sign.',
                location: 'Distributed across all sectors',
                timing: '5 AM – 11 PM',
                cost: '₹20 – ₹150 per item',
            },
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
        color: 'bg-blue-50 border-blue-200',
        headerColor: 'from-blue-500 to-cyan-500',
        items: [
            {
                name: 'Drinking Water Kiosks',
                detail: 'RO-purified drinking water available at kiosks across all sectors. Carry your own bottle.',
                location: 'Every 200-300 meters across mela grounds',
                timing: '24 hours',
                cost: 'Free',
            },
            {
                name: 'Packaged Water',
                detail: 'ISI-marked bottled water (1L, 500ml) available from certified vendors.',
                location: 'All major markets and entry points',
                timing: 'All day',
                cost: '₹15 – ₹25 per bottle',
            },
        ],
        warning: '⚠️ Do NOT drink directly from the river. Always use designated drinking water points. April-May Ujjain heat makes hydration critical — drink 3-4 litres daily.',
    },
    {
        id: 'sanitation',
        category: 'Toilets & Sanitation',
        icon: '🚻',
        color: 'bg-purple-50 border-purple-200',
        headerColor: 'from-purple-500 to-indigo-500',
        items: [
            {
                name: 'Community Toilet Blocks',
                detail: 'Permanent and mobile toilet blocks are set up throughout the mela grounds.',
                location: 'Near all major ghats and entry points',
                timing: '24 hours',
                cost: '₹2 – ₹5 (nominal fee)',
            },
            {
                name: 'Mobile Toilet Vans',
                detail: 'Mobile toilet units deployed during peak days and near congested areas.',
                location: 'Amrit Snan routes and crowded ghats',
                timing: '24 hours during Amrit Snan days',
                cost: 'Free',
            },
            {
                name: 'Pink Toilets (Women)',
                detail: 'Dedicated sanitation facilities for women at all major sectors.',
                location: 'All sectors — look for pink signs',
                timing: '24 hours',
                cost: '₹2',
            },
        ],
        tip: '💡 Tip: Locate the nearest toilet block when you arrive at any sector. Queues are long during peak hours.',
    },
    {
        id: 'banking',
        category: 'ATMs & Banking',
        icon: '🏧',
        color: 'bg-amber-50 border-amber-200',
        headerColor: 'from-amber-500 to-orange-500',
        items: [
            {
                name: 'ATMs',
                detail: 'Multiple ATMs from SBI, HDFC, ICICI, PNB deployed across the mela grounds. May run out of cash on Amrit Snan days.',
                location: 'Near main entry points and food markets',
                timing: '24 hours',
                cost: 'Standard bank charges',
            },
            {
                name: 'UPI / Digital Payments',
                detail: 'Most vendors accept Google Pay, PhonePe, and Paytm. QR codes available at certified stalls.',
                location: 'Across all markets and vendors',
                timing: 'All day',
                cost: 'No extra charge',
            },
            {
                name: 'Currency Exchange',
                detail: 'RBI-authorized foreign exchange counters for international pilgrims.',
                location: 'Near Sector 1 main entrance, Ujjain mela grounds',
                timing: '9 AM – 6 PM',
                cost: 'Standard exchange rates',
            },
        ],
        tip: '💡 Carry ₹2,000-3,000 in cash before entering on Amrit Snan days. ATMs may be out of cash.',
    },
    {
        id: 'charging',
        category: 'Phone Charging',
        icon: '🔋',
        color: 'bg-yellow-50 border-yellow-200',
        headerColor: 'from-yellow-500 to-amber-500',
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
        warning: '⚠️ A dead phone = serious risk. Always keep at least 30% battery. Carry a power bank!',
    },
    {
        id: 'accommodation-nearby',
        category: 'Local Accommodation',
        icon: '🏕️',
        color: 'bg-orange-50 border-orange-200',
        headerColor: 'from-orange-500 to-red-500',
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
        tip: '💡 Book accommodation 2-3 months before Amrit Snan dates. Prices triple close to the event.',
    },
];

function ServiceItem({ item }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-3.5 hover:border-orange-200 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-gray-800 text-sm">{item.name}</h4>
                <span className="text-xs font-bold text-green-700 bg-green-100 rounded-full px-2 py-0.5 flex-shrink-0">
                    {item.cost}
                </span>
            </div>
            <p className="text-xs text-gray-600 mb-2 leading-relaxed">{item.detail}</p>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                    <MapPin size={10} className="text-orange-400" />
                    {item.location}
                </span>
                <span className="flex items-center gap-1">
                    <Clock size={10} className="text-orange-400" />
                    {item.timing}
                </span>
            </div>
        </div>
    );
}

function ServiceCategory({ service }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={`rounded-2xl border ${service.color} overflow-hidden transition-all duration-200`}>
            <button
                className="w-full text-left p-4 flex items-center gap-3"
                onClick={() => setExpanded(!expanded)}
            >
                <span className="text-2xl flex-shrink-0">{service.icon}</span>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-sm">{service.category}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{service.items.length} service{service.items.length !== 1 ? 's' : ''} available</p>
                </div>
                <div className="flex-shrink-0">
                    {expanded ? (
                        <ChevronUp size={16} className="text-orange-500" />
                    ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                    )}
                </div>
            </button>

            {expanded && (
                <div className="px-4 pb-4 space-y-3 animate-fade-in border-t border-gray-100 pt-3">
                    {service.warning && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                            <Info size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-red-700">{service.warning}</p>
                        </div>
                    )}
                    {service.tip && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                            <Info size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800">{service.tip}</p>
                        </div>
                    )}
                    {service.items.map((item, i) => (
                        <ServiceItem key={i} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function LocalServices() {
    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-green-500 rounded-2xl p-4 text-white shadow-md">
                <div className="flex items-center gap-3">
                    <div className="text-3xl">🏘️</div>
                    <div>
                        <h2 className="text-lg font-bold">Local Services</h2>
                        <p className="text-teal-100 text-sm">Food, water, sanitation, banking & more</p>
                    </div>
                </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2">
                {[
                    { icon: '🍚', label: 'Food Camps', count: '500+' },
                    { icon: '🚻', label: 'Toilet Units', count: '1,00,000+' },
                    { icon: '🏥', label: 'Medical Camps', count: '40+' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white border border-orange-100 rounded-xl p-3 text-center">
                        <div className="text-xl mb-1">{stat.icon}</div>
                        <div className="font-bold text-orange-600 text-sm">{stat.count}</div>
                        <div className="text-xs text-gray-500">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Service categories */}
            <div className="space-y-3">
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Info size={12} className="text-orange-400" />
                    Tap any category to expand service details
                </p>
                {services.map((service) => (
                    <ServiceCategory key={service.id} service={service} />
                ))}
            </div>

            {/* Bottom tip */}
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3.5 flex items-start gap-2.5">
                <span className="text-lg flex-shrink-0">💬</span>
                <p className="text-sm text-gray-700">
                    Need specific help? Ask our AI assistant in the{' '}
                    <span className="text-orange-600 font-semibold">Chat tab</span> for personalized guidance in your language!
                </p>
            </div>
        </div>
    );
}
