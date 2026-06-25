import React, { createContext, useState, useContext } from 'react';

const translations = {
  en: {
    appName: "ParkHub",
    tagline: "Find & Reserve Your Parking Space in Seconds",
    searchPlaceholder: "Search parking by area (e.g. T. Nagar, Adyar, Velachery)...",
    searchBtn: "Search",
    filterBtn: "Filters",
    bookNow: "Book Now",
    login: "Login",
    logout: "Logout",
    home: "Home",
    profile: "Profile",
    bookings: "Bookings",
    support: "Help & Support",
    ticketSubject: "Subject",
    ticketDetails: "Description / Details",
    submitTicket: "Submit Ticket",
    noTickets: "No active support tickets.",
    ticketQueue: "Support Tickets History",
    resolvedByAdmin: "Resolved by Admin",
    roleCustomer: "Customer",
    all: "All Spots",
    twoWheeler: "Two Wheeler",
    fourWheeler: "Four Wheeler",
    priceLowHigh: "Price: Low to High",
    distanceNear: "Nearest First",
    availableSlots: "Available Slots",
    available: "Available",
    occupied: "Occupied",
    cctvActive: "CCTV Active",
    cctvReady: "CCTV Ready Architecture",
    activeBooking: "Active Booking",
    completedBooking: "Completed",
    cancelledBooking: "Cancelled",
    vehicleNo: "Vehicle Number",
    bookingDuration: "Duration (Hours)",
    totalPrice: "Total Price",
    couponCode: "Coupon Code",
    apply: "Apply",
    payWithUPI: "Pay with UPI",
    scanQR: "Scan QR at Entry & Exit",
    bookingSuccessful: "Booking Confirmed!",
    ratingsAndReviews: "Ratings & Reviews",
    addReview: "Write a Review",
    commentPlaceholder: "Share your parking experience...",
    submitReview: "Submit Review",
    referralTitle: "Refer & Earn Free Parking!",
    referralCode: "Your Referral Code",
    aiPredictionTitle: "Future AI Parking Prediction",
    aiPredictionDesc: "Based on historical trends, parking slots in this area are typically full by 5:00 PM today. We recommend booking in advance."
  },
  ta: {
    appName: "பார்க்ஹப்",
    tagline: "உங்களது வாகன நிறுத்த இடத்தை சில நொடிகளில் தேடி முன்பதிவு செய்யுங்கள்",
    searchPlaceholder: "பகுதியின் பெயரைத் தேடுக (எ.கா: தி. நகர், அடையாறு, வேளச்சேரி)...",
    searchBtn: "தேடுக",
    filterBtn: "வடிகட்டிகள்",
    bookNow: "முன்பதிவு செய்",
    login: "உள்நுழை",
    logout: "வெளியேறு",
    home: "முகப்பு",
    profile: "சுயவிவரம்",
    bookings: "பதிவுகள்",
    support: "உதவி & ஆதரவு",
    ticketSubject: "தலைப்பு",
    ticketDetails: "விளக்கம் / விவரங்கள்",
    submitTicket: "சமர்ப்பிக்கவும்",
    noTickets: "விசாரணைத் தகவல்கள் ஏதுமில்லை.",
    ticketQueue: "விசாரணை வரலாறு",
    resolvedByAdmin: "நிர்வாகி தீர்வு செய்தார்",
    roleCustomer: "வாடிக்கையாளர்",
    all: "அனைத்து இடங்களும்",
    twoWheeler: "இரு சக்கர வாகனம்",
    fourWheeler: "நான்கு சக்கர வாகனம்",
    priceLowHigh: "விலை: குறைந்ததிலிருந்து அதிகம்",
    distanceNear: "அருகிலுள்ளவை முதலில்",
    availableSlots: "கிடைக்கக்கூடிய இடங்கள்",
    available: "கிடைக்கக்கூடியவை",
    occupied: "நிரம்பியுள்ளது",
    cctvActive: "சிசிடிவி இயங்குகிறது",
    cctvReady: "சிசிடிவி கட்டமைப்பு தயார்",
    activeBooking: "செயலில் உள்ள பதிவு",
    completedBooking: "நிறைவடைந்தது",
    cancelledBooking: "ரத்து செய்யப்பட்டது",
    vehicleNo: "வாகன எண்",
    bookingDuration: "கால அளவு (மணிநேரம்)",
    totalPrice: "மொத்த விலை",
    couponCode: "கூப்பன் குறியீடு",
    apply: "பயன்படுத்து",
    payWithUPI: "UPI மூலம் செலுத்துக",
    scanQR: "நுழைவு & வெளியேறும்போது QR குறியீட்டை ஸ்கேன் செய்க",
    bookingSuccessful: "முன்பதிவு உறுதி செய்யப்பட்டது!",
    ratingsAndReviews: "மதிப்பீடுகள் & விமர்சனங்கள்",
    addReview: "விமர்சனம் எழுதுக",
    commentPlaceholder: "உங்கள் அனுபவத்தைப் பகிரவும்...",
    submitReview: "விமர்சனத்தை சமர்ப்பி",
    referralTitle: "பகிர்ந்து இலவச பார்க்கிங் வெல்லுங்கள்!",
    referralCode: "உங்கள் பரிந்துரை குறியீடு",
    aiPredictionTitle: "எதிர்கால AI பார்க்கிங் கணிப்பு",
    aiPredictionDesc: "வரலாற்றுப் போக்குகளின் அடிப்படையில், இன்று மாலை 5:00 மணிக்குள் இப்பகுதியில் பார்க்கிங் இடங்கள் பொதுவாக நிரம்பிவிடும். முன்கூட்டியே முன்பதிவு செய்ய பரிந்துரைக்கிறோம்."
  }
};

const LangContext = createContext();

export const LangProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const t = (key) => translations[language][key] || key;
  const toggleLanguage = () => setLanguage(prev => prev === 'en' ? 'ta' : 'en');

  return (
    <LangContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LangContext.Provider>
  );
};

export const useTranslation = () => useContext(LangContext);
