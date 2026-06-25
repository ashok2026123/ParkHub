import 'package:flutter/material.dart';
import '../data/models/parking_location.dart';
import '../core/utils/translations.dart';

class ParkingProvider with ChangeNotifier {
  String _language = 'en';
  ParkingLocation? _selectedLocation;
  Map<String, dynamic>? _activeBooking;
  
  String get language => _language;
  ParkingLocation? get selectedLocation => _selectedLocation;
  Map<String, dynamic>? get activeBooking => _activeBooking;

  final List<ParkingLocation> _locations = [
    ParkingLocation(
      id: "loc-1",
      ownerId: "owner-456",
      name: "T. Nagar Smart Parking Plaza",
      address: "Pondy Bazaar, T. Nagar, Chennai",
      latitude: 13.0405,
      longitude: 80.2337,
      description: "Automated multilevel parking spot with CCTV security.",
      hourlyRate: 40.0,
      dailyRate: 300.0,
      total2W: 60,
      total4W: 40,
      available2W: 14,
      available4W: 9,
      imageUrl: "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&q=80&w=400",
      isApproved: true,
      cctvEnabled: true,
      rating: 4.8,
    ),
    ParkingLocation(
      id: "loc-2",
      ownerId: "owner-456",
      name: "Adyar Metro Parking Hub",
      address: "Kasturba Nagar, Adyar, Chennai",
      latitude: 13.0063,
      longitude: 80.2525,
      description: "Convenient parking close to metro transit portals.",
      hourlyRate: 30.0,
      dailyRate: 200.0,
      total2W: 80,
      total4W: 30,
      available2W: 42,
      available4W: 12,
      imageUrl: "https://images.unsplash.com/photo-1506521788723-85811181d4db?auto=format&fit=crop&q=80&w=400",
      isApproved: true,
      cctvEnabled: true,
      rating: 4.2,
    ),
  ];

  List<ParkingLocation> get locations => _locations;

  String translate(String key) {
    return AppTranslations.values[_language]?[key] ?? key;
  }

  void toggleLanguage() {
    _language = _language == 'en' ? 'ta' : 'en';
    notifyListeners();
  }

  void selectLocation(ParkingLocation loc) {
    _selectedLocation = loc;
    notifyListeners();
  }

  void clearSelection() {
    _selectedLocation = null;
    notifyListeners();
  }

  Future<bool> simulateBooking(String vehicleNo, String type, int hours) async {
    if (_selectedLocation == null) return false;
    
    // Decrement slots
    if (type == 'four-wheeler') {
      _selectedLocation!.available4W = (_selectedLocation!.available4W - 1).clamp(0, 100);
    } else {
      _selectedLocation!.available2W = (_selectedLocation!.available2W - 1).clamp(0, 100);
    }

    double rate = type == 'four-wheeler' ? _selectedLocation!.hourlyRate : _selectedLocation!.hourlyRate * 0.6;
    double total = rate * hours;

    _activeBooking = {
      'id': 'book-${DateTime.now().millisecond}',
      'locationId': _selectedLocation!.id,
      'locationName': _selectedLocation!.name,
      'locationAddress': _selectedLocation!.address,
      'vehicleNumber': vehicleNo.toUpperCase(),
      'vehicleType': type,
      'duration': hours,
      'totalAmount': total,
      'qrCodePayload': 'QR_PE_${_selectedLocation!.id}_$vehicleNo',
      'startTime': DateTime.now().toIso8601String(),
    };

    notifyListeners();
    return true;
  }

  void simulateCheckout() {
    if (_activeBooking == null) return;
    
    // Find location and increment slots
    final locId = _activeBooking!['locationId'];
    final type = _activeBooking!['vehicleType'];

    for (var loc in _locations) {
      if (loc.id == locId) {
        if (type == 'four-wheeler') {
          loc.available4W = (loc.available4W + 1).clamp(0, loc.total4W);
        } else {
          loc.available2W = (loc.available2W + 1).clamp(0, loc.total2W);
        }
        break;
      }
    }

    _activeBooking = null;
    notifyListeners();
  }
}
