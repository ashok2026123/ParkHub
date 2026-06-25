import React, { createContext, useState, useContext } from 'react';

const translations = {
  en: {
    // Nav & General
    appName: "ParkEasy Chennai",
    tagline: "Find & Reserve Your Parking Space in Seconds",
    searchPlaceholder: "Search parking by area (e.g. T. Nagar, Adyar, Velachery)...",
    searchBtn: "Search",
    filterBtn: "Filters",
    bookNow: "Book Now",
    login: "Login",
    logout: "Logout",
    dashboard: "Dashboard",
    home: "Home",
    profile: "Profile",
    bookings: "Bookings",
    roleCustomer: "Customer",
    roleOwner: "Parking Owner",
    roleAdmin: "Administrator",
    
    // Filters
    all: "All Spots",
    twoWheeler: "Two Wheeler",
    fourWheeler: "Four Wheeler",
    priceLowHigh: "Price: Low to High",
    distanceNear: "Nearest First",
    
    // Status
    available: "Available",
    occupied: "Occupied",
    cctvActive: "CCTV Active",
    cctvReady: "CCTV Ready Architecture",
    approved: "Approved",
    pendingApproval: "Pending Approval",
    activeBooking: "Active Booking",
    completedBooking: "Completed",
    cancelledBooking: "Cancelled",

    // Booking Details
    vehicleNo: "Vehicle Number",
    bookingDuration: "Duration (Hours)",
    totalPrice: "Total Price",
    couponCode: "Coupon Code",
    apply: "Apply",
    payWithUPI: "Pay with UPI",
    scanQR: "Scan QR at Entry & Exit",
    bookingSuccessful: "Booking Confirmed!",
    bookingStatus: "Booking Status",
    
    // Dashboards
    totalEarnings: "Total Earnings",
    totalBookings: "Total Bookings",
    occupancyRate: "Live Occupancy Rate",
    myLocations: "My Parking Locations",
    addNewLocation: "Add New Location",
    locationName: "Location Name",
    address: "Address",
    hourlyRate: "Hourly Rate (₹)",
    dailyRate: "Daily Rate (₹)",
    slotsCount: "Total Slots",
    submitListing: "Submit Listing",
    earningsTrend: "Earnings Trend",
    approve: "Approve",
    reject: "Reject",
    manageUsers: "Manage Users",
    manageOwners: "Manage Parking Owners",
    revenueReport: "Revenue & Earnings Reports",
    complaints: "Complaints & Support Cases",
    
    // Reviews
    ratingsAndReviews: "Ratings & Reviews",
    addReview: "Write a Review",
    ratingRequired: "Please select rating stars",
    commentPlaceholder: "Share your parking experience...",
    submitReview: "Submit Review",

    // Referral
    referralTitle: "Refer & Earn Free Parking!",
    referralCode: "Your Referral Code",
    referralShare: "Share this code with your friends and get ₹50 credit upon their first booking.",

    // AI Prediction
    aiPredictionTitle: "Future AI Parking Prediction",
    aiPredictionDesc: "Based on historical trends, parking slots in this area are typically full by 5:00 PM today. We recommend booking in advance."
  },
  ta: {
    // Nav & General
    appName: "பார்க்ஈஸி சென்னை",
    tagline: "உங்களது வாகன நிறுத்த இடத்தை சில நொடிகளில் தேடி முன்பதிவு செய்யுங்கள்",
    searchPlaceholder: "பகுதியின் பெயரைத் தேடுக (எ.கா: தி. நகர், அடையாறு, வேளச்சேரி)...",
    searchBtn: "தேடுக",
    filterBtn: "வடிகட்டிகள்",
    bookNow: "முன்பதிவு செய்",
    login: "உள்நுழை",
    logout: "வெளியேறு",
    dashboard: "டாஷ்போர்டு",
    home: "முகப்பு",
    profile: "சுயவிவரம்",
    bookings: "பதிவுகள்",
    roleCustomer: "வாடிக்கையாளர்",
    roleOwner: "வாகன நிறுத்த உரிமையாளர்",
    roleAdmin: "நிர்வாகி",
    
    // Filters
    all: "அனைத்து இடங்களும்",
    twoWheeler: "இரு சக்கர வாகனம்",
    fourWheeler: "நான்கு சக்கர வாகனம்",
    priceLowHigh: "விலை: குறைந்ததிலிருந்து அதிகம்",
    distanceNear: "அருகிலுள்ளவை முதலில்",
    
    // Status
    available: "கிடைக்கக்கூடியவை",
    occupied: "நிரம்பியுள்ளது",
    cctvActive: "சிசிடிவி இயங்குகிறது",
    cctvReady: "சிசிடிவி கட்டமைப்பு தயார்",
    approved: "அங்கீகரிக்கப்பட்டது",
    pendingApproval: "அங்கீகாரத்திற்காக காத்திருக்கிறது",
    activeBooking: "செயலில் உள்ள பதிவு",
    completedBooking: "நிறைவடைந்தது",
    cancelledBooking: "ரத்து செய்யப்பட்டது",

    // Booking Details
    vehicleNo: "வாகன எண்",
    bookingDuration: "கால அளவு (மணிநேரம்)",
    totalPrice: "மொத்த விலை",
    couponCode: "கூப்பன் குறியீடு",
    apply: "பயன்படுத்து",
    payWithUPI: "UPI மூலம் செலுத்துக",
    scanQR: "நுழைவு & வெளியேறும்போது QR குறியீட்டை ஸ்கேன் செய்க",
    bookingSuccessful: "முன்பதிவு உறுதி செய்யப்பட்டது!",
    bookingStatus: "பதிவு நிலை",

    // Dashboards
    totalEarnings: "மொத்த வருவாய்",
    totalBookings: "மொத்த முன்பதிவுகள்",
    occupancyRate: "நேரடி ஆக்கிரமிப்பு விகிதம்",
    myLocations: "எனது வாகன நிறுத்தங்கள்",
    addNewLocation: "புதிய இடத்தை சேர்",
    locationName: "இடத்தின் பெயர்",
    address: "முகவரி",
    hourlyRate: "மணிநேர கட்டணம் (₹)",
    dailyRate: "தினசரி கட்டணம் (₹)",
    slotsCount: "மொத்த இடங்கள்",
    submitListing: "விபரத்தை சமர்ப்பி",
    earningsTrend: "வருவாய் போக்கு",
    approve: "அங்கீகரி",
    reject: "நிராகரி",
    manageUsers: "பயனர்களை நிர்வகி",
    manageOwners: "உரிமையாளர்களை நிர்வகி",
    revenueReport: "வருவாய் அறிக்கைகள்",
    complaints: "புகார் மேலாண்மை",
    
    // Reviews
    ratingsAndReviews: "மதிப்பீடுகள் & விமர்சனங்கள்",
    addReview: "விமர்சனம் எழுதுக",
    ratingRequired: "மதிப்பீடு நட்சத்திரங்களைத் தேர்ந்தெடுக்கவும்",
    commentPlaceholder: "உங்கள் அனுபவத்தைப் பகிரவும்...",
    submitReview: "விமர்சனத்தை சமர்ப்பி",

    // Referral
    referralTitle: "பகிர்ந்து இலவச பார்க்கிங் வெல்லுங்கள்!",
    referralCode: "உங்கள் பரிந்துரை குறியீடு",
    referralShare: "இந்த குறியீட்டை நண்பர்களுடன் பகிர்ந்து, அவர்களின் முதல் பதிவின் போது ₹50 கடன் பெறுங்கள்.",

    // AI Prediction
    aiPredictionTitle: "எதிர்கால AI பார்க்கிங் கணிப்பு",
    aiPredictionDesc: "வரலாற்றுப் போக்குகளின் அடிப்படையில், இன்று மாலை 5:00 மணிக்குள் இப்பகுதியில் பார்க்கிங் இடங்கள் பொதுவாக நிரம்பிவிடும். முன்கூட்டியே முன்பதிவு செய்ய பரிந்துரைக்கிறோம்."
  }
};

const LangContext = createContext();

export const LangProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  const t = (key) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ta' : 'en');
  };

  return (
    <LangContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LangContext.Provider>
  );
};

export const useTranslation = () => useContext(LangContext);
