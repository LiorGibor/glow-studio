"""Seed the database with sample treatments for development."""
import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, init_db
from app.models.treatment import Treatment


SAMPLE_TREATMENTS = [
    {
        "name": "עיצוב גבות קלאסי",
        "slug": "classic-eyebrow-shaping",
        "category": "גבות",
        "short_description": "גבות מעוצבות בצורה מושלמת המותאמות לצורת הפנים שלך",
        "description": "שירות עיצוב הגבות החותמי שלנו משתמש בטכניקות שעווה והשחלה מדויקות ליצירת הקשת המושלמת לצורת הפנים הייחודית שלך. כולל סיום מרגיע עם אלוורה ומריחת ג׳ל גבות.",
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
        "name": "מיקרובליידינג",
        "slug": "microblading",
        "category": "גבות",
        "short_description": "עיבוי גבות קבוע-למחצה למראה טבעי ומלא",
        "description": "מיקרובליידינג הוא טכניקת קעקוע קבוע-למחצה שיוצרת שערות טבעיות למילוי גבות דלילות. התוצאות נשמרות 12-18 חודשים. כולל תיקון חינם תוך 6 שבועות.",
        "duration_minutes": 120,
        "price": 250.00,
        "image_url": "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop",
        "gallery_urls": json.dumps([
            "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop",
        ]),
        "sort_order": 2,
    },
    {
        "name": "מניקור ג׳ל",
        "slug": "gel-manicure",
        "category": "ציפורניים",
        "short_description": "לק ג׳ל עמיד עם גימור מבריק ומושלם",
        "description": "תהני ממניקור ג׳ל יוקרתי שנשמר עד 3 שבועות ללא התקלפות. כולל עיצוב ציפורניים, טיפול בקוטיקולות, עיסוי ידיים ובחירת צבע מהקולקציה המובחרת שלנו.",
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
        "name": "עיצוב ציפורניים אומנותי",
        "slug": "nail-art-design",
        "category": "ציפורניים",
        "short_description": "עיצובי ציפורניים מותאמים אישית מפשוט ועד מרהיב",
        "description": "הביעי את האישיות שלך דרך אומנות ציפורניים מדהימה. האמניות המוכשרות שלנו יוצרות עיצובים מותאמים אישית, ממינימליזם אלגנטי ועד ציפורניים בולטות ויוצאות דופן. כולל בסיס ג׳ל וציפוי עליון לעמידות.",
        "duration_minutes": 90,
        "price": 65.00,
        "image_url": "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&h=400&fit=crop",
        "gallery_urls": json.dumps([
            "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&h=600&fit=crop",
        ]),
        "sort_order": 4,
    },
    {
        "name": "איפור כלות",
        "slug": "bridal-makeup",
        "category": "איפור",
        "short_description": "מראה כלה עוצר נשימה ליום המושלם שלך",
        "description": "הרגישי מושלמת ביום המיוחד שלך עם שירות איפור הכלות היוקרתי שלנו. כולל ייעוץ, איפור פנים מלא עם מוצרים מתקדמים, הצמדת ריסים וערכת תיקונים. מומלץ לקבוע מפגש ניסיון מראש.",
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
        "name": "איפור ערב גלאם",
        "slug": "evening-glam-makeup",
        "category": "איפור",
        "short_description": "איפור מרהיב לערבים ואירועים מיוחדים",
        "description": "משכי מבטים באירוע הבא שלך עם שירות איפור הערב שלנו. כולל עיניים דרמטיות, עור מושלם, עיצוב לחיים ומראה שפתיים מותאם לתלבושת ולסגנון האישי שלך.",
        "duration_minutes": 75,
        "price": 95.00,
        "image_url": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=400&fit=crop",
        "gallery_urls": json.dumps([
            "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=600&fit=crop",
        ]),
        "sort_order": 6,
    },
    {
        "name": "הלחמת ריסים קלאסית",
        "slug": "eyelash-extensions-classic",
        "category": "ריסים",
        "short_description": "הארכת ריסים בעלת מראה טבעי לאלגנטיות יומיומית",
        "description": "שפרי את היופי הטבעי שלך עם הארכת ריסים קלאסית. ריס אחד מוצמד לכל ריס טבעי למראה עדין דמוי מסקרה. נשמר 4-6 שבועות עם טיפול נכון. כולל ערכת טיפוח.",
        "duration_minutes": 90,
        "price": 120.00,
        "image_url": "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=600&h=400&fit=crop",
        "gallery_urls": json.dumps([
            "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=800&h=600&fit=crop",
        ]),
        "sort_order": 7,
    },
    {
        "name": "הרמת ריסים וצביעה",
        "slug": "lash-lift-tint",
        "category": "ריסים",
        "short_description": "ריסים טבעיים מסולסלים וכהים שנשמרים שבועות",
        "description": "הרמת ריסים מסלסלת את הריסים הטבעיים מהבסיס לקצה, והצביעה מוסיפה עומק והגדרה. התוצאה היא עיניים בהירות ופקוחות ללא צורך במסקרה. האפקט נשמר 6-8 שבועות.",
        "duration_minutes": 60,
        "price": 75.00,
        "image_url": "https://images.unsplash.com/photo-1588387608680-63aea5f1d8c4?w=600&h=400&fit=crop",
        "gallery_urls": json.dumps([
            "https://images.unsplash.com/photo-1588387608680-63aea5f1d8c4?w=800&h=600&fit=crop",
        ]),
        "sort_order": 8,
    },
    {
        "name": "טיפול פנים ניקוי עמוק",
        "slug": "deep-cleansing-facial",
        "category": "טיפוח עור",
        "short_description": "טיפול פנים מטהר לעור נקי ורענן",
        "description": "טיפול פנים לניקוי עמוק המכוון לנקבוביות סתומות, שומן עודף ולכלוך. כולל ניקוי כפול, אדים, הפקות, מסכה מטהרת ומריחת סרום לחות. מושלם לעור שמן ומעורב.",
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
        "name": "טיפול פנים אנטי-אייג׳ינג",
        "slug": "anti-aging-facial",
        "category": "טיפוח עור",
        "short_description": "טיפול מחדש לשיקום זוהר צעיר",
        "description": "הילחמי בסימני ההזדקנות עם טיפול הפנים האנטי-אייג׳ינג היוקרתי שלנו. כולל סרומים לחיזוק קולגן, טיפול באור LED, טכניקות עיסוי פנים ומסכה מפנקת. תצאי עם עור מוצק וזוהר יותר.",
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
