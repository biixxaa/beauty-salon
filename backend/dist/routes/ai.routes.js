"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/ai.routes.ts
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post('/', (req, res) => {
    const { mode, gender, hairType, faceShape, message } = req.body || {};
    if (mode === 'consultation') {
        const normGender = String(gender || 'women').toLowerCase();
        const normShape = String(faceShape || 'oval').toLowerCase();
        if (normGender === 'men') {
            if (normShape === 'oval') {
                res.json({
                    recommendation: {
                        title: 'Classic Pompadour with Mid Fade',
                        description: 'For oval faces, adding volume on top highlights symmetry and balanced facial structure.',
                        imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=300',
                        matchingServices: ['Executive Gentleman Cut', 'Signature Fade & Wash'],
                    },
                });
                return;
            }
            res.json({
                recommendation: {
                    title: 'Textured Crop with High Fade',
                    description: 'A textured top adds height and structure, creating clean definition for your face shape.',
                    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=300',
                    matchingServices: ['Modern Skin Fade', 'Beard Trim & Razor Lineup'],
                },
            });
            return;
        }
        // Women
        if (String(hairType).toLowerCase() === 'coily' || String(hairType).toLowerCase() === 'kinky') {
            res.json({
                recommendation: {
                    title: 'Defined Afro Puff with Golden Highlights',
                    description: 'Embrace your natural 4C coily texture! A high afro puff keeps hair protected and voluminous.',
                    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=300',
                    matchingServices: ['Natural Hair Styling & Hydration', 'Golden Radiance Facial'],
                },
            });
            return;
        }
        res.json({
            recommendation: {
                title: 'Soft Beachy Waves with Balayage',
                description: 'Soft waves break up angles and create flattering movement around cheekbones.',
                imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=300',
                matchingServices: ['Luxury Haircut & Blow Dry', 'Premium Color & Balayage'],
            },
        });
        return;
    }
    // Chat mode
    const msg = String(message || '').toLowerCase();
    let reply = 'Hello! I am your AI Beauty Consultant. I can recommend hairstyles, hair treatments, and the best nail and spa services in Addis Ababa. How can I help you today?';
    if (msg.includes('hair') && (msg.includes('dry') || msg.includes('damage'))) {
        reply = 'For dry or damaged hair, I highly recommend Saba\'s "Deep Conditioning & Moroccan Hydration" treatment with organic Argan oils!';
    }
    else if (msg.includes('shave') || msg.includes('razor')) {
        reply = 'Pre-shave hot towels and soothing aloe balm prevent razor burn. Book Dawit\'s "Classic Hot Towel Shave" at Bole Grooming!';
    }
    else if (msg.includes('telebirr') || msg.includes('cbe') || msg.includes('pay')) {
        reply = 'You can pay instantly at checkout with Telebirr or CBE Birr, or select cash on arrival at the salon.';
    }
    res.json({ reply });
});
exports.default = router;
