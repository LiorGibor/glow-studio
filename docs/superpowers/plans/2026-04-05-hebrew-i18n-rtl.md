# Hebrew i18n + RTL Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Hebrew as the default language with English as secondary, including full RTL layout support and a language toggle.

**Architecture:** Install `react-i18next` + `i18next` for translation management. Create `he.json` and `en.json` translation files with namespaced keys. Set `dir="rtl"` and `lang="he"` as defaults on the HTML root, toggled dynamically via a `LanguageContext`. Fix all directional Tailwind classes (left/right → start/end, ml/mr → ms/me) so layout flips automatically.

**Tech Stack:** react-i18next, i18next, i18next-browser-languagedetector, Tailwind CSS v4 logical properties

---

## File Structure

**New files:**
- `src/i18n.ts` — i18next configuration, language detection, init
- `src/locales/he.json` — Hebrew translations (default)
- `src/locales/en.json` — English translations
- `src/components/LanguageToggle.tsx` — HE/EN toggle button component

**Modified files (by task):**
- `index.html` — Add `dir="rtl"` and `lang="he"` defaults
- `src/main.tsx` — Import i18n config
- `src/components/layout/Navbar.tsx` — Add LanguageToggle, fix RTL classes, use `t()`
- `src/components/layout/Footer.tsx` — Use `t()`
- `src/components/layout/AdminLayout.tsx` — Add LanguageToggle, fix RTL sidebar, use `t()`
- `src/components/layout/CustomerLayout.tsx` — No changes needed
- `src/pages/customer/HomePage.tsx` — Use `t()`, fix RTL badge positioning
- `src/pages/customer/TreatmentPage.tsx` — Use `t()`, fix RTL positioning
- `src/pages/customer/BookingPage.tsx` — Use `t()`, fix RTL classes
- `src/pages/customer/BookingConfirmation.tsx` — Use `t()`
- `src/pages/admin/AdminLogin.tsx` — Use `t()`, fix RTL icon positioning
- `src/pages/admin/Dashboard.tsx` — Use `t()`
- `src/pages/admin/AdminCalendar.tsx` — Use `t()`, fix text-left
- `src/pages/admin/AdminTreatments.tsx` — Use `t()`, fix RTL badge positioning
- `src/pages/admin/AdminAppointments.tsx` — Use `t()`, fix RTL classes
- `src/pages/admin/AdminSettings.tsx` — Use `t()`
- `src/lib/utils.ts` — Locale-aware price formatting
- `src/index.css` — Add RTL-aware font families

---

### Task 1: Install dependencies and configure i18next

**Files:**
- Create: `src/i18n.ts`
- Create: `src/locales/en.json`
- Create: `src/locales/he.json`
- Modify: `src/main.tsx`
- Modify: `index.html`

- [ ] **Step 1: Install i18next packages**

```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

- [ ] **Step 2: Create English translation file**

Create `src/locales/en.json`:

```json
{
  "brand": {
    "name": "Glow Studio",
    "tagline": "Your destination for premium beauty treatments. We bring out your natural glow with expert care and the finest products."
  },
  "nav": {
    "home": "Home",
    "treatments": "Treatments",
    "bookNow": "Book Now"
  },
  "hero": {
    "badge": "Welcome to Glow Studio",
    "title1": "Your Beauty,",
    "title2": "Our Passion",
    "subtitle": "Discover expert treatments crafted to make you look and feel extraordinary. Book your appointment in seconds.",
    "cta": "Explore Treatments"
  },
  "treatments": {
    "heading": "Our Treatments",
    "subtitle": "Choose from a wide range of professional beauty services",
    "all": "All",
    "empty": "No treatments found in this category.",
    "bookNow": "Book Now",
    "notFound": "Treatment not found",
    "notFoundDesc": "The treatment you're looking for doesn't exist or has been removed.",
    "backHome": "Back to Home",
    "aboutTitle": "About This Treatment",
    "noDescription": "No description available.",
    "gallery": "Gallery",
    "bookThis": "Book This Treatment",
    "back": "Back"
  },
  "booking": {
    "title": "Book {{name}}",
    "step": "Step {{step}}: {{label}}",
    "steps": {
      "date": "Date",
      "time": "Time",
      "details": "Details",
      "confirm": "Confirm"
    },
    "selectDate": "Select a Date",
    "selectTime": "Select a Time",
    "noSlots": "No available slots",
    "noSlotsHint": "Please select a different date",
    "continue": "Continue",
    "yourDetails": "Your Details",
    "fullName": "Full Name",
    "phoneNumber": "Phone Number",
    "email": "Email",
    "optional": "(optional)",
    "notes": "Notes",
    "namePlaceholder": "Jane Doe",
    "phonePlaceholder": "050-123-4567",
    "emailPlaceholder": "jane@example.com",
    "notesPlaceholder": "Any special requests or preferences...",
    "reviewBooking": "Review Booking",
    "confirmTitle": "Confirm Your Booking",
    "treatmentLabel": "Treatment",
    "dateLabel": "Date",
    "timeLabel": "Time",
    "yourInfo": "Your Info",
    "notesLabel": "Notes",
    "confirmBooking": "Confirm Booking",
    "bookingInProgress": "Booking...",
    "treatmentNotFound": "Treatment not found",
    "loadTimesError": "Could not load available times",
    "bookingFailed": "Booking failed. Please try again."
  },
  "confirmation": {
    "title": "Booking Confirmed!",
    "subtitle": "Your appointment has been successfully booked. We can't wait to see you!",
    "treatment": "Treatment",
    "date": "Date",
    "time": "Time",
    "bookedBy": "Booked By",
    "backHome": "Back to Home"
  },
  "footer": {
    "quickLinks": "Quick Links",
    "contact": "Contact",
    "hours1": "Sun - Thu: 09:00 - 18:00",
    "hours2": "Sat: 09:00 - 14:00",
    "hours3": "Friday: Closed",
    "copyright": "© {{year}} Glow Studio. All rights reserved.",
    "home": "Home",
    "treatments": "Treatments",
    "adminPortal": "Admin Portal"
  },
  "admin": {
    "panel": "Admin Panel",
    "viewSite": "View Live Site",
    "signOut": "Sign Out",
    "dashboard": "Dashboard",
    "calendar": "Calendar",
    "treatments": "Treatments",
    "appointments": "Appointments",
    "settings": "Settings"
  },
  "login": {
    "title": "Admin Portal",
    "subtitle": "Sign in to manage Glow Studio",
    "email": "Email",
    "password": "Password",
    "emailPlaceholder": "admin@glowstudio.com",
    "passwordPlaceholder": "••••••••",
    "signIn": "Sign In",
    "signingIn": "Signing in…",
    "backToSite": "← Back to Glow Studio",
    "fillFields": "Please fill in all fields",
    "welcomeBack": "Welcome back!",
    "invalidCredentials": "Invalid email or password"
  },
  "dashboardPage": {
    "title": "Dashboard",
    "subtitle": "Overview of your salon activity",
    "todayAppointments": "Today's Appointments",
    "upcoming": "Upcoming",
    "totalTreatments": "Total Treatments",
    "monthlyRevenue": "Monthly Revenue",
    "todayRevenue": "Today: {{amount}}",
    "recentAppointments": "Recent Appointments",
    "noRecent": "No recent appointments",
    "customer": "Customer",
    "treatment": "Treatment",
    "dateTime": "Date & Time",
    "status": "Status"
  },
  "calendarPage": {
    "title": "Calendar",
    "subtitle": "View appointments by date",
    "loading": "Loading appointments…",
    "noAppointments": "No appointments on this day",
    "days": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    "appt": "{{count}} appt",
    "appts": "{{count}} appts"
  },
  "treatmentsAdmin": {
    "title": "Treatments",
    "subtitle": "Manage your salon's treatment menu",
    "addTreatment": "Add Treatment",
    "searchPlaceholder": "Search treatments...",
    "active": "Active",
    "inactive": "Inactive",
    "noTreatments": "No treatments found",
    "noTreatmentsSearch": "Try a different search term",
    "noTreatmentsEmpty": "Add your first treatment to get started",
    "editTreatment": "Edit Treatment",
    "newTreatment": "New Treatment",
    "nameLabel": "Treatment Name *",
    "namePlaceholder": "e.g., Gel Manicure",
    "categoryLabel": "Category *",
    "categoryPlaceholder": "e.g., Nails, Makeup, Skincare",
    "durationLabel": "Duration (min) *",
    "priceLabel": "Price (ILS) *",
    "shortDescLabel": "Short Description",
    "shortDescPlaceholder": "Brief summary for treatment cards",
    "fullDescLabel": "Full Description",
    "fullDescPlaceholder": "Detailed treatment description...",
    "sortOrderLabel": "Sort Order",
    "activeLabel": "Active",
    "mainImage": "Main Image",
    "chooseImage": "Choose image...",
    "galleryImages": "Gallery Images",
    "filesSelected": "{{count}} file(s) selected",
    "chooseGallery": "Choose gallery images...",
    "edit": "Edit",
    "cancel": "Cancel",
    "saving": "Saving...",
    "update": "Update",
    "create": "Create",
    "loadError": "Failed to load treatments",
    "nameRequired": "Name and category are required",
    "durationRequired": "Duration must be greater than 0",
    "updated": "Treatment updated",
    "created": "Treatment created",
    "saveError": "Failed to save treatment",
    "deactivateConfirm": "Deactivate \"{{name}}\"? It will no longer appear to customers.",
    "deactivated": "Treatment deactivated",
    "deactivateError": "Failed to deactivate treatment"
  },
  "appointmentsAdmin": {
    "title": "Appointments",
    "subtitle": "View and manage all customer appointments",
    "searchPlaceholder": "Search by name, phone, or treatment...",
    "allStatuses": "All Statuses",
    "customer": "Customer",
    "treatment": "Treatment",
    "dateTime": "Date & Time",
    "status": "Status",
    "actions": "Actions",
    "noAppointments": "No appointments found",
    "complete": "Complete",
    "cancel": "Cancel",
    "edit": "Edit",
    "delete": "Delete",
    "editTitle": "Edit Appointment",
    "treatmentInfo": "Treatment:",
    "bookedFor": "Booked for:",
    "customerName": "Customer Name",
    "phone": "Phone",
    "email": "Email",
    "statusLabel": "Status",
    "customerNotes": "Customer Notes",
    "adminNotes": "Admin Notes (internal)",
    "adminNotesPlaceholder": "Internal notes not visible to customer...",
    "cancelBtn": "Cancel",
    "savingBtn": "Saving...",
    "saveChanges": "Save Changes",
    "loadError": "Failed to load appointments",
    "statusChanged": "Status changed to {{status}}",
    "statusError": "Failed to update status",
    "deleteConfirm": "Delete appointment for {{name}}? This action cannot be undone.",
    "deleted": "Appointment deleted",
    "deleteError": "Failed to delete appointment",
    "updateError": "Failed to update appointment",
    "updated": "Appointment updated"
  },
  "settingsPage": {
    "title": "Settings",
    "subtitle": "Configure your salon's business settings",
    "loading": "Loading...",
    "saveChanges": "Save Changes",
    "saving": "Saving...",
    "saveAll": "Save All Changes",
    "businessInfo": "Business Information",
    "businessName": "Business Name",
    "phoneNumber": "Phone Number",
    "phonePlaceholder": "050-123-4567",
    "address": "Address",
    "addressPlaceholder": "123 Beauty St, Tel Aviv",
    "workingHours": "Working Hours",
    "closed": "Closed",
    "to": "to",
    "breakTimes": "Break Times",
    "addBreak": "+ Add Break",
    "noBreaks": "No breaks configured. Slots will be available continuously during working hours.",
    "remove": "Remove",
    "bookingConfig": "Booking Configuration",
    "slotDuration": "Slot Duration (minutes)",
    "slotDurationHelp": "The interval between available booking times",
    "advanceBooking": "Advance Booking (days)",
    "advanceBookingHelp": "How far in advance customers can book",
    "minutes15": "15 minutes",
    "minutes30": "30 minutes",
    "minutes45": "45 minutes",
    "minutes60": "60 minutes",
    "loadError": "Failed to load settings",
    "saved": "Settings saved successfully",
    "saveError": "Failed to save settings",
    "days": {
      "monday": "Monday",
      "tuesday": "Tuesday",
      "wednesday": "Wednesday",
      "thursday": "Thursday",
      "friday": "Friday",
      "saturday": "Saturday",
      "sunday": "Sunday"
    }
  },
  "statuses": {
    "confirmed": "Confirmed",
    "pending": "Pending",
    "cancelled": "Cancelled",
    "completed": "Completed",
    "no_show": "No show"
  }
}
```

- [ ] **Step 3: Create Hebrew translation file**

Create `src/locales/he.json`:

```json
{
  "brand": {
    "name": "גלואו סטודיו",
    "tagline": "היעד שלך לטיפולי יופי מקצועיים. אנחנו מוציאים את הזוהר הטבעי שלך עם טיפול מומחה והמוצרים הטובים ביותר."
  },
  "nav": {
    "home": "דף הבית",
    "treatments": "טיפולים",
    "bookNow": "הזמינו עכשיו"
  },
  "hero": {
    "badge": "ברוכים הבאים לגלואו סטודיו",
    "title1": "היופי שלך,",
    "title2": "התשוקה שלנו",
    "subtitle": "גלו טיפולים מקצועיים שנועדו לגרום לך להיראות ולהרגיש יוצאת דופן. קבעו תור בשניות.",
    "cta": "גלו את הטיפולים"
  },
  "treatments": {
    "heading": "הטיפולים שלנו",
    "subtitle": "בחרו ממגוון רחב של שירותי יופי מקצועיים",
    "all": "הכל",
    "empty": "לא נמצאו טיפולים בקטגוריה זו.",
    "bookNow": "הזמינו עכשיו",
    "notFound": "הטיפול לא נמצא",
    "notFoundDesc": "הטיפול שחיפשת לא קיים או הוסר.",
    "backHome": "חזרה לדף הבית",
    "aboutTitle": "אודות הטיפול",
    "noDescription": "אין תיאור זמין.",
    "gallery": "גלריה",
    "bookThis": "הזמינו טיפול זה",
    "back": "חזרה"
  },
  "booking": {
    "title": "הזמנת {{name}}",
    "step": "שלב {{step}}: {{label}}",
    "steps": {
      "date": "תאריך",
      "time": "שעה",
      "details": "פרטים",
      "confirm": "אישור"
    },
    "selectDate": "בחרו תאריך",
    "selectTime": "בחרו שעה",
    "noSlots": "אין תורים פנויים",
    "noSlotsHint": "אנא בחרו תאריך אחר",
    "continue": "המשך",
    "yourDetails": "הפרטים שלך",
    "fullName": "שם מלא",
    "phoneNumber": "מספר טלפון",
    "email": "אימייל",
    "optional": "(אופציונלי)",
    "notes": "הערות",
    "namePlaceholder": "ישראלה ישראלי",
    "phonePlaceholder": "050-123-4567",
    "emailPlaceholder": "jane@example.com",
    "notesPlaceholder": "בקשות מיוחדות או העדפות...",
    "reviewBooking": "סקירת ההזמנה",
    "confirmTitle": "אישור ההזמנה",
    "treatmentLabel": "טיפול",
    "dateLabel": "תאריך",
    "timeLabel": "שעה",
    "yourInfo": "הפרטים שלך",
    "notesLabel": "הערות",
    "confirmBooking": "אישור הזמנה",
    "bookingInProgress": "מזמין...",
    "treatmentNotFound": "הטיפול לא נמצא",
    "loadTimesError": "לא ניתן לטעון את השעות הפנויות",
    "bookingFailed": "ההזמנה נכשלה. אנא נסו שוב."
  },
  "confirmation": {
    "title": "ההזמנה אושרה!",
    "subtitle": "התור שלך נקבע בהצלחה. מחכים לראות אותך!",
    "treatment": "טיפול",
    "date": "תאריך",
    "time": "שעה",
    "bookedBy": "הוזמן על ידי",
    "backHome": "חזרה לדף הבית"
  },
  "footer": {
    "quickLinks": "קישורים מהירים",
    "contact": "צרו קשר",
    "hours1": "א׳ - ה׳: 09:00 - 18:00",
    "hours2": "שבת: 09:00 - 14:00",
    "hours3": "שישי: סגור",
    "copyright": "© {{year}} גלואו סטודיו. כל הזכויות שמורות.",
    "home": "דף הבית",
    "treatments": "טיפולים",
    "adminPortal": "פאנל ניהול"
  },
  "admin": {
    "panel": "פאנל ניהול",
    "viewSite": "צפייה באתר",
    "signOut": "התנתקות",
    "dashboard": "לוח בקרה",
    "calendar": "יומן",
    "treatments": "טיפולים",
    "appointments": "תורים",
    "settings": "הגדרות"
  },
  "login": {
    "title": "פאנל ניהול",
    "subtitle": "התחברו לניהול גלואו סטודיו",
    "email": "אימייל",
    "password": "סיסמה",
    "emailPlaceholder": "admin@glowstudio.com",
    "passwordPlaceholder": "••••••••",
    "signIn": "התחברות",
    "signingIn": "מתחבר…",
    "backToSite": "→ חזרה לגלואו סטודיו",
    "fillFields": "אנא מלאו את כל השדות",
    "welcomeBack": "!ברוכים השבים",
    "invalidCredentials": "אימייל או סיסמה שגויים"
  },
  "dashboardPage": {
    "title": "לוח בקרה",
    "subtitle": "סקירה כללית של פעילות הסלון",
    "todayAppointments": "תורים להיום",
    "upcoming": "קרובים",
    "totalTreatments": "סה״כ טיפולים",
    "monthlyRevenue": "הכנסות חודשיות",
    "todayRevenue": "היום: {{amount}}",
    "recentAppointments": "תורים אחרונים",
    "noRecent": "אין תורים אחרונים",
    "customer": "לקוח/ה",
    "treatment": "טיפול",
    "dateTime": "תאריך ושעה",
    "status": "סטטוס"
  },
  "calendarPage": {
    "title": "יומן",
    "subtitle": "צפייה בתורים לפי תאריך",
    "loading": "טוען תורים…",
    "noAppointments": "אין תורים ביום זה",
    "days": ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"],
    "appt": "תור {{count}}",
    "appts": "{{count}} תורים"
  },
  "treatmentsAdmin": {
    "title": "טיפולים",
    "subtitle": "ניהול תפריט הטיפולים של הסלון",
    "addTreatment": "הוספת טיפול",
    "searchPlaceholder": "חיפוש טיפולים...",
    "active": "פעיל",
    "inactive": "לא פעיל",
    "noTreatments": "לא נמצאו טיפולים",
    "noTreatmentsSearch": "נסו מונח חיפוש אחר",
    "noTreatmentsEmpty": "הוסיפו את הטיפול הראשון כדי להתחיל",
    "editTreatment": "עריכת טיפול",
    "newTreatment": "טיפול חדש",
    "nameLabel": "שם הטיפול *",
    "namePlaceholder": "לדוגמה: מניקור ג׳ל",
    "categoryLabel": "קטגוריה *",
    "categoryPlaceholder": "לדוגמה: ציפורניים, איפור, טיפוח",
    "durationLabel": "משך (דקות) *",
    "priceLabel": "מחיר (₪) *",
    "shortDescLabel": "תיאור קצר",
    "shortDescPlaceholder": "תקציר קצר לכרטיסי טיפולים",
    "fullDescLabel": "תיאור מלא",
    "fullDescPlaceholder": "תיאור מפורט של הטיפול...",
    "sortOrderLabel": "סדר מיון",
    "activeLabel": "פעיל",
    "mainImage": "תמונה ראשית",
    "chooseImage": "בחירת תמונה...",
    "galleryImages": "תמונות גלריה",
    "filesSelected": "{{count}} קבצים נבחרו",
    "chooseGallery": "בחירת תמונות גלריה...",
    "edit": "עריכה",
    "cancel": "ביטול",
    "saving": "שומר...",
    "update": "עדכון",
    "create": "יצירה",
    "loadError": "שגיאה בטעינת טיפולים",
    "nameRequired": "שם וקטגוריה הם שדות חובה",
    "durationRequired": "משך הטיפול חייב להיות גדול מ-0",
    "updated": "הטיפול עודכן",
    "created": "הטיפול נוצר",
    "saveError": "שגיאה בשמירת הטיפול",
    "deactivateConfirm": "להשבית את \"{{name}}\"? הטיפול לא יופיע יותר ללקוחות.",
    "deactivated": "הטיפול הושבת",
    "deactivateError": "שגיאה בהשבתת הטיפול"
  },
  "appointmentsAdmin": {
    "title": "תורים",
    "subtitle": "צפייה וניהול כל התורים של הלקוחות",
    "searchPlaceholder": "חיפוש לפי שם, טלפון או טיפול...",
    "allStatuses": "כל הסטטוסים",
    "customer": "לקוח/ה",
    "treatment": "טיפול",
    "dateTime": "תאריך ושעה",
    "status": "סטטוס",
    "actions": "פעולות",
    "noAppointments": "לא נמצאו תורים",
    "complete": "הושלם",
    "cancel": "ביטול",
    "edit": "עריכה",
    "delete": "מחיקה",
    "editTitle": "עריכת תור",
    "treatmentInfo": "טיפול:",
    "bookedFor": "נקבע ל:",
    "customerName": "שם הלקוח/ה",
    "phone": "טלפון",
    "email": "אימייל",
    "statusLabel": "סטטוס",
    "customerNotes": "הערות לקוח",
    "adminNotes": "הערות מנהל (פנימי)",
    "adminNotesPlaceholder": "הערות פנימיות שלא נראות ללקוח...",
    "cancelBtn": "ביטול",
    "savingBtn": "שומר...",
    "saveChanges": "שמירת שינויים",
    "loadError": "שגיאה בטעינת תורים",
    "statusChanged": "הסטטוס שונה ל{{status}}",
    "statusError": "שגיאה בעדכון הסטטוס",
    "deleteConfirm": "למחוק את התור של {{name}}? פעולה זו לא ניתנת לביטול.",
    "deleted": "התור נמחק",
    "deleteError": "שגיאה במחיקת התור",
    "updateError": "שגיאה בעדכון התור",
    "updated": "התור עודכן"
  },
  "settingsPage": {
    "title": "הגדרות",
    "subtitle": "הגדרת פרטי העסק של הסלון",
    "loading": "טוען...",
    "saveChanges": "שמירת שינויים",
    "saving": "שומר...",
    "saveAll": "שמירת כל השינויים",
    "businessInfo": "פרטי העסק",
    "businessName": "שם העסק",
    "phoneNumber": "מספר טלפון",
    "phonePlaceholder": "050-123-4567",
    "address": "כתובת",
    "addressPlaceholder": "רחוב היופי 123, תל אביב",
    "workingHours": "שעות פעילות",
    "closed": "סגור",
    "to": "עד",
    "breakTimes": "הפסקות",
    "addBreak": "+ הוספת הפסקה",
    "noBreaks": "לא הוגדרו הפסקות. תורים יהיו זמינים ברצף לאורך שעות הפעילות.",
    "remove": "הסרה",
    "bookingConfig": "הגדרות הזמנה",
    "slotDuration": "משך תור (דקות)",
    "slotDurationHelp": "הזמן בין התורים הזמינים",
    "advanceBooking": "הזמנה מראש (ימים)",
    "advanceBookingHelp": "כמה ימים מראש לקוחות יכולים להזמין",
    "minutes15": "15 דקות",
    "minutes30": "30 דקות",
    "minutes45": "45 דקות",
    "minutes60": "60 דקות",
    "loadError": "שגיאה בטעינת ההגדרות",
    "saved": "ההגדרות נשמרו בהצלחה",
    "saveError": "שגיאה בשמירת ההגדרות",
    "days": {
      "monday": "יום שני",
      "tuesday": "יום שלישי",
      "wednesday": "יום רביעי",
      "thursday": "יום חמישי",
      "friday": "יום שישי",
      "saturday": "שבת",
      "sunday": "יום ראשון"
    }
  },
  "statuses": {
    "confirmed": "מאושר",
    "pending": "ממתין",
    "cancelled": "בוטל",
    "completed": "הושלם",
    "no_show": "לא הגיע"
  }
}
```

- [ ] **Step 4: Create i18n configuration**

Create `src/i18n.ts`:

```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import he from "./locales/he.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      he: { translation: he },
    },
    fallbackLng: "he",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "glow_lang",
      caches: ["localStorage"],
    },
  });

// Apply dir and lang to <html> on language change
const applyDirection = (lng: string) => {
  const dir = lng === "he" ? "rtl" : "ltr";
  document.documentElement.setAttribute("dir", dir);
  document.documentElement.setAttribute("lang", lng);
};

applyDirection(i18n.language);
i18n.on("languageChanged", applyDirection);

export default i18n;
```

- [ ] **Step 5: Update index.html**

Change `<html lang="en">` to `<html lang="he" dir="rtl">` in `index.html`.

- [ ] **Step 6: Import i18n in main.tsx**

Add `import "./i18n";` as the first import in `src/main.tsx` (before React imports).

- [ ] **Step 7: Verify the app still loads**

Run `npm run dev` and check the browser — the app should load with RTL direction on the HTML element. Strings are still English (not wired yet), but layout direction should flip.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add i18next setup with Hebrew and English translation files"
```

---

### Task 2: Create language toggle component

**Files:**
- Create: `src/components/LanguageToggle.tsx`

- [ ] **Step 1: Create the LanguageToggle component**

Create `src/components/LanguageToggle.tsx`:

```tsx
import { useTranslation } from "react-i18next";

export default function LanguageToggle({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { i18n } = useTranslation();
  const isHebrew = i18n.language === "he";

  const toggle = () => {
    i18n.changeLanguage(isHebrew ? "en" : "he");
  };

  const base =
    "px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer select-none";
  const colors =
    variant === "dark"
      ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200";

  return (
    <button onClick={toggle} className={`${base} ${colors}`}>
      {isHebrew ? "EN" : "עב"}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/LanguageToggle.tsx
git commit -m "feat: add language toggle component"
```

---

### Task 3: Wire up layout components (Navbar, Footer, AdminLayout)

**Files:**
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/components/layout/Footer.tsx`
- Modify: `src/components/layout/AdminLayout.tsx`

- [ ] **Step 1: Update Navbar.tsx**

Replace the full content of `src/components/layout/Navbar.tsx` with:

```tsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import { useTranslation } from "react-i18next";
import LanguageToggle from "@/components/LanguageToggle";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const navLinks = [
    { label: t("nav.home"), to: "/" },
    { label: t("nav.treatments"), to: "/#treatments" },
    { label: t("nav.bookNow"), to: "/#treatments", highlight: true },
  ];

  const handleNavClick = (to: string) => {
    setOpen(false);
    if (to.includes("#")) {
      const hash = to.substring(to.indexOf("#"));
      if (location.pathname === "/") {
        const el = document.querySelector(hash);
        el?.scrollIntoView({ behavior: "smooth" });
      } else {
        setTimeout(() => {
          const el = document.querySelector(hash);
          el?.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="font-display text-xl font-semibold text-gray-900 tracking-tight">
              {t("brand.name")}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) =>
              link.highlight ? (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => handleNavClick(link.to)}
                  className="ms-3 px-5 py-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium no-underline hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-300"
                >
                  {link.label}
                </Link>
              ) : (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => handleNavClick(link.to)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 transition-all no-underline"
                >
                  {link.label}
                </Link>
              )
            )}
            <LanguageToggle />
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {open ? <HiOutlineX size={24} /> : <HiOutlineMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-lg"
          >
            <nav className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => handleNavClick(link.to)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium no-underline transition-all ${
                    link.highlight
                      ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white text-center"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex justify-center pt-2">
                <LanguageToggle />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
```

Key changes: `t()` for all strings, `ml-3` → `ms-3`, `ml-auto` → `ms-auto`, LanguageToggle added in desktop + mobile nav.

- [ ] **Step 2: Update Footer.tsx**

Replace `src/components/layout/Footer.tsx` with:

```tsx
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">G</span>
              </div>
              <span className="font-display text-lg font-semibold text-white">
                {t("brand.name")}
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              {t("brand.tagline")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              {t("footer.quickLinks")}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm hover:text-white transition-colors no-underline text-gray-400">
                  {t("footer.home")}
                </Link>
              </li>
              <li>
                <Link to="/#treatments" className="text-sm hover:text-white transition-colors no-underline text-gray-400">
                  {t("footer.treatments")}
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-sm hover:text-white transition-colors no-underline text-gray-400">
                  {t("footer.adminPortal")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              {t("footer.contact")}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>{t("footer.hours1")}</li>
              <li>{t("footer.hours2")}</li>
              <li>{t("footer.hours3")}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-xs text-gray-500">
          {t("footer.copyright", { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Update AdminLayout.tsx**

In `src/components/layout/AdminLayout.tsx`, apply these changes:

1. Add imports at top: `import { useTranslation } from "react-i18next";` and `import LanguageToggle from "@/components/LanguageToggle";`
2. Add `const { t } = useTranslation();` inside the component
3. Replace `sidebarLinks` labels with `t()` calls (move inside component):
```tsx
const sidebarLinks = [
  { label: t("admin.dashboard"), to: "/admin", icon: HiOutlineViewGrid },
  { label: t("admin.calendar"), to: "/admin/calendar", icon: HiOutlineCalendar },
  { label: t("admin.treatments"), to: "/admin/treatments", icon: HiOutlineScissors },
  { label: t("admin.appointments"), to: "/admin/appointments", icon: HiOutlineClipboardList },
  { label: t("admin.settings"), to: "/admin/settings", icon: HiOutlineCog },
];
```
4. Replace all hardcoded strings: `"Admin Panel"` → `t("admin.panel")`, `"Sign Out"` → `t("admin.signOut")`, `"View Live Site →"` → `t("admin.viewSite") + " →"`
5. Fix RTL classes: `left-0` → `start-0`, `-translate-x-full` → `ltr:-translate-x-full rtl:translate-x-full`, `ml-auto` → `ms-auto`, `ml-2` → `ms-2`, `-ml-2` → `-ms-2`
6. Add LanguageToggle next to "View Live Site" link in the top bar

- [ ] **Step 4: Verify all three layouts render correctly**

Open browser, check customer pages and admin pages. Toggle language — strings should switch and layout should flip.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Navbar.tsx src/components/layout/Footer.tsx src/components/layout/AdminLayout.tsx src/components/LanguageToggle.tsx
git commit -m "feat: wire i18n into layout components with RTL support"
```

---

### Task 4: Wire up customer pages (HomePage, TreatmentPage, BookingPage, BookingConfirmation)

**Files:**
- Modify: `src/pages/customer/HomePage.tsx`
- Modify: `src/pages/customer/TreatmentPage.tsx`
- Modify: `src/pages/customer/BookingPage.tsx`
- Modify: `src/pages/customer/BookingConfirmation.tsx`

For each file:
1. Add `import { useTranslation } from "react-i18next";`
2. Add `const { t } = useTranslation();` inside the component
3. Replace every hardcoded string with its `t("key")` equivalent using keys from the translation files
4. Fix RTL-incompatible classes:
   - `left-3` → `start-3`, `left-4` → `start-4`, `left-6` → `start-6`
   - `right-3` → `end-3`
   - `ml-*` → `ms-*`, `mr-*` → `me-*`
   - `pl-10` → `ps-10` (icon-prefixed inputs in BookingPage)

- [ ] **Step 1: Update HomePage.tsx**

Key replacements:
- `"Welcome to Glow Studio"` → `t("hero.badge")`
- `"Your Beauty,"` → `t("hero.title1")`
- `"Our Passion"` → `t("hero.title2")`
- `"Explore Treatments"` → `t("hero.cta")`
- `"Our Treatments"` → `t("treatments.heading")`
- `"All"` → `t("treatments.all")`
- `"No treatments found in this category."` → `t("treatments.empty")`
- `"Book Now"` → `t("treatments.bookNow")`
- Fix `top-3 left-3` → `top-3 start-3` in TreatmentCard badge

- [ ] **Step 2: Update TreatmentPage.tsx**

Key replacements:
- `"Treatment not found"` → `t("treatments.notFound")`
- `"Back to Home"` → `t("treatments.backHome")`
- `"About This Treatment"` → `t("treatments.aboutTitle")`
- `"Gallery"` → `t("treatments.gallery")`
- `"Book This Treatment"` → `t("treatments.bookThis")`
- `"Back"` → `t("treatments.back")`
- Fix positioning: `left-4` → `start-4`, `left-6` → `start-6`, `bottom-4 left-4` → `bottom-4 start-4`

- [ ] **Step 3: Update BookingPage.tsx**

Key replacements:
- `stepLabels` array → `[t("booking.steps.date"), t("booking.steps.time"), t("booking.steps.details"), t("booking.steps.confirm")]`
- All form labels, placeholders, button text, toast messages
- Fix `pl-10` → `ps-10` on icon-prefixed inputs
- Fix `left-3` → `start-3` on input icons

- [ ] **Step 4: Update BookingConfirmation.tsx**

Key replacements:
- `"Booking Confirmed!"` → `t("confirmation.title")`
- All labels and button text

- [ ] **Step 5: Verify customer pages in both languages**

Navigate through Home → Treatment Detail → Booking → Confirmation in both Hebrew and English.

- [ ] **Step 6: Commit**

```bash
git add src/pages/customer/
git commit -m "feat: add i18n to all customer pages with RTL fixes"
```

---

### Task 5: Wire up admin pages

**Files:**
- Modify: `src/pages/admin/AdminLogin.tsx`
- Modify: `src/pages/admin/Dashboard.tsx`
- Modify: `src/pages/admin/AdminCalendar.tsx`
- Modify: `src/pages/admin/AdminTreatments.tsx`
- Modify: `src/pages/admin/AdminAppointments.tsx`
- Modify: `src/pages/admin/AdminSettings.tsx`

For each file, same pattern as Task 4: add `useTranslation`, replace strings with `t()` keys, fix RTL classes.

- [ ] **Step 1: Update AdminLogin.tsx**

Replace strings with `t("login.*")` keys. Fix `left-3` → `start-3` on form input icons, `pl-10` → `ps-10`.

- [ ] **Step 2: Update Dashboard.tsx**

Replace strings with `t("dashboardPage.*")` keys. Status badges use `t("statuses." + status)`.

- [ ] **Step 3: Update AdminCalendar.tsx**

Replace strings with `t("calendarPage.*")` keys. Day names array: `t("calendarPage.days", { returnObjects: true })`. Fix `text-left` → remove (defaults to start in RTL).

- [ ] **Step 4: Update AdminTreatments.tsx**

Replace all ~48 strings with `t("treatmentsAdmin.*")` keys. Fix badge positioning: `left-3` → `start-3`, `right-3` → `end-3`. Fix search icon `left-3` → `start-3`, `pl-10` → `ps-10`.

- [ ] **Step 5: Update AdminAppointments.tsx**

Replace all ~52 strings with `t("appointmentsAdmin.*")` keys. Fix: `left-3` → `start-3` (search/filter icons), `text-right` → `text-end`, `ml-auto` → `ms-auto`, `ps-10`/`ps-9` for icon-prefixed inputs.

- [ ] **Step 6: Update AdminSettings.tsx**

Replace all ~42 strings with `t("settingsPage.*")` keys. Day labels: `t("settingsPage.days." + key)`.

- [ ] **Step 7: Verify all admin pages in both languages**

Login, navigate through all admin pages, toggle language.

- [ ] **Step 8: Commit**

```bash
git add src/pages/admin/
git commit -m "feat: add i18n to all admin pages with RTL fixes"
```

---

### Task 6: Update utility formatting and index.css for RTL fonts

**Files:**
- Modify: `src/lib/utils.ts`
- Modify: `src/index.css`

- [ ] **Step 1: Update formatPrice for locale awareness**

In `src/lib/utils.ts`, update `formatPrice`:

```typescript
import i18n from "@/i18n";

export function formatPrice(price: number): string {
  const locale = i18n.language === "he" ? "he-IL" : "en-US";
  return `${price.toLocaleString(locale)} ₪`;
}
```

- [ ] **Step 2: Add Hebrew font support to index.css**

In `src/index.css`, add a Hebrew-friendly sans-serif to the theme. Inside the `@theme` block, ensure the font family includes Hebrew-compatible fonts:

```css
--font-sans: "Heebo", "Inter", system-ui, sans-serif;
```

Add Google Fonts import at the top of `index.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap');
```

- [ ] **Step 3: Verify formatting and fonts**

Toggle to Hebrew — prices should format correctly and text should render in Heebo font.

- [ ] **Step 4: Commit**

```bash
git add src/lib/utils.ts src/index.css
git commit -m "feat: add Hebrew font (Heebo) and locale-aware price formatting"
```

---

### Task 7: Run full test suite and fix any issues

**Files:**
- Modify: `e2e/verify-fixes.spec.ts` (update for i18n)
- Modify: `e2e/full-qa.spec.ts` (update for Hebrew default)

- [ ] **Step 1: Run TypeScript check**

```bash
cd frontend && npx tsc -b --noEmit
```

Fix any type errors.

- [ ] **Step 2: Run ESLint**

```bash
npm run lint
```

Fix any lint errors.

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Verify it builds cleanly.

- [ ] **Step 4: Update e2e tests for Hebrew default**

Tests that check for English text (e.g., `body!.includes("Eyebrow")`) still work because treatment names come from the API in English. But tests checking for UI text like "Dashboard" need to check for Hebrew or be language-aware.

Update assertions in test files:
- `body!.includes("Dashboard")` → `body!.includes("לוח בקרה") || body!.includes("Dashboard")`
- `body!.includes("Our Treatments")` → `body!.includes("הטיפולים שלנו") || body!.includes("Our Treatments")`
- Similar for other UI string assertions

- [ ] **Step 5: Run Playwright tests**

```bash
npx playwright test --reporter=list
```

Fix any failures.

- [ ] **Step 6: Take visual screenshots in Hebrew**

Run the visual check tests to capture screenshots of all pages in Hebrew RTL mode. Verify layout is correct — text should be right-aligned, sidebar on the right, etc.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "test: update e2e tests for Hebrew default language"
```
