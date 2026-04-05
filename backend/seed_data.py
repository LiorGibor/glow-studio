"""Seed the database with sample treatments for development."""
import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, init_db
from app.models.treatment import Treatment


SAMPLE_TREATMENTS = [
    {
        "name": "Classic Eyebrow Shaping",
        "slug": "classic-eyebrow-shaping",
        "category": "Eyebrows",
        "short_description": "Perfectly sculpted brows tailored to your face shape",
        "description": "Our signature eyebrow shaping service uses precision threading and waxing techniques to create the perfect arch for your unique face shape. Includes a soothing aloe vera finish and brow gel application.",
        "duration_minutes": 30,
        "price": 35.00,
        "image_url": "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&h=400&fit=crop",
        "gallery_urls": json.dumps([
            "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop",
        ]),
        "sort_order": 1,
    },
    {
        "name": "Microblading",
        "slug": "microblading",
        "category": "Eyebrows",
        "short_description": "Semi-permanent brow enhancement for natural-looking fullness",
        "description": "Microblading is a semi-permanent tattooing technique that creates natural-looking, hair-like strokes to fill in sparse brows. Results last 12-18 months. Includes a complimentary touch-up session within 6 weeks.",
        "duration_minutes": 120,
        "price": 250.00,
        "image_url": "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop",
        "gallery_urls": json.dumps([
            "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop",
        ]),
        "sort_order": 2,
    },
    {
        "name": "Gel Manicure",
        "slug": "gel-manicure",
        "category": "Nails",
        "short_description": "Long-lasting gel polish with a flawless, glossy finish",
        "description": "Enjoy a luxurious gel manicure that lasts up to 3 weeks without chipping. Includes nail shaping, cuticle care, hand massage, and your choice of color from our premium gel collection.",
        "duration_minutes": 60,
        "price": 45.00,
        "image_url": "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop",
        "gallery_urls": json.dumps([
            "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=800&h=600&fit=crop",
        ]),
        "sort_order": 3,
    },
    {
        "name": "Nail Art Design",
        "slug": "nail-art-design",
        "category": "Nails",
        "short_description": "Custom artistic nail designs from simple to extravagant",
        "description": "Express your personality through stunning nail art. Our talented artists create custom designs ranging from minimalist elegance to bold statement nails. Includes gel base and top coat for lasting wear.",
        "duration_minutes": 90,
        "price": 65.00,
        "image_url": "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&h=400&fit=crop",
        "gallery_urls": json.dumps([
            "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&h=600&fit=crop",
        ]),
        "sort_order": 4,
    },
    {
        "name": "Bridal Makeup",
        "slug": "bridal-makeup",
        "category": "Makeup",
        "short_description": "Breathtaking bridal looks for your perfect day",
        "description": "Look absolutely radiant on your special day with our premium bridal makeup service. Includes a consultation, full face makeup application with high-end products, lash application, and touch-up kit. We recommend a trial session beforehand.",
        "duration_minutes": 120,
        "price": 180.00,
        "image_url": "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=400&fit=crop",
        "gallery_urls": json.dumps([
            "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1457972851104-2d36f180e8dc?w=800&h=600&fit=crop",
        ]),
        "sort_order": 5,
    },
    {
        "name": "Evening Glam Makeup",
        "slug": "evening-glam-makeup",
        "category": "Makeup",
        "short_description": "Glamorous makeup for special evenings and events",
        "description": "Turn heads at your next event with our evening glam makeup service. Features dramatic eyes, flawless skin, contoured cheekbones, and bold or subtle lip looks tailored to your outfit and personal style.",
        "duration_minutes": 75,
        "price": 95.00,
        "image_url": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=400&fit=crop",
        "gallery_urls": json.dumps([
            "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=600&fit=crop",
        ]),
        "sort_order": 6,
    },
    {
        "name": "Eyelash Extensions - Classic",
        "slug": "eyelash-extensions-classic",
        "category": "Lashes",
        "short_description": "Natural-looking lash extensions for everyday elegance",
        "description": "Enhance your natural beauty with classic eyelash extensions. One extension is applied to each natural lash for a subtle, mascara-like effect. Lasts 4-6 weeks with proper care. Includes aftercare kit.",
        "duration_minutes": 90,
        "price": 120.00,
        "image_url": "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=600&h=400&fit=crop",
        "gallery_urls": json.dumps([
            "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=800&h=600&fit=crop",
        ]),
        "sort_order": 7,
    },
    {
        "name": "Lash Lift & Tint",
        "slug": "lash-lift-tint",
        "category": "Lashes",
        "short_description": "Curled, darkened natural lashes that last weeks",
        "description": "A lash lift curls your natural lashes from base to tip, while the tint adds depth and definition. The result is bright, wide-awake eyes without the need for mascara. Effects last 6-8 weeks.",
        "duration_minutes": 60,
        "price": 75.00,
        "image_url": "https://images.unsplash.com/photo-1588387608680-63aea5f1d8c4?w=600&h=400&fit=crop",
        "gallery_urls": json.dumps([
            "https://images.unsplash.com/photo-1588387608680-63aea5f1d8c4?w=800&h=600&fit=crop",
        ]),
        "sort_order": 8,
    },
    {
        "name": "Deep Cleansing Facial",
        "slug": "deep-cleansing-facial",
        "category": "Skincare",
        "short_description": "Purifying facial for clear, refreshed skin",
        "description": "This deep cleansing facial targets clogged pores, excess oil, and impurities. Includes double cleansing, steam, extractions, a purifying mask, and hydrating serum application. Perfect for oily and combination skin types.",
        "duration_minutes": 60,
        "price": 85.00,
        "image_url": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop",
        "gallery_urls": json.dumps([
            "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1552693673-1bf958298935?w=800&h=600&fit=crop",
        ]),
        "sort_order": 9,
    },
    {
        "name": "Anti-Aging Facial",
        "slug": "anti-aging-facial",
        "category": "Skincare",
        "short_description": "Rejuvenating treatment to restore youthful radiance",
        "description": "Combat the signs of aging with our premium anti-aging facial. Features collagen-boosting serums, LED light therapy, facial massage techniques, and a luxury hydrating mask. You'll leave with firmer, more luminous skin.",
        "duration_minutes": 75,
        "price": 120.00,
        "image_url": "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&h=400&fit=crop",
        "gallery_urls": json.dumps([
            "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800&h=600&fit=crop",
        ]),
        "sort_order": 10,
    },
]


def seed_treatments():
    init_db()
    db = SessionLocal()
    try:
        existing_count = db.query(Treatment).count()
        if existing_count > 0:
            print(f"Database already has {existing_count} treatments. Skipping seed.")
            return

        for data in SAMPLE_TREATMENTS:
            treatment = Treatment(**data)
            db.add(treatment)

        db.commit()
        print(f"Successfully seeded {len(SAMPLE_TREATMENTS)} treatments!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_treatments()
