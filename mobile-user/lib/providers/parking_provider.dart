import 'package:flutter/material.dart';
import '../core/utils/translations.dart';

class ParkingProvider with ChangeNotifier {
  String _language = 'en';
  Map<String, dynamic>? _activeBooking;
  
  String get language => _language;
  Map<String, dynamic>? get activeBooking => _activeBooking;

  String translate(String key) {
    return AppTranslations.values[_language]?[key] ?? key;
  }

  void toggleLanguage() {
    _language = _language == 'en' ? 'ta' : 'en';
    notifyListeners();
  }

  Future<bool> simulateBooking(String vehicleNo, String type, int hours) async {
    _activeBooking = {
      'id': 'book-${DateTime.now().millisecond}',
      'locationName': 'T. Nagar Smart Parking Plaza',
      'locationAddress': 'Pondy Bazaar, T. Nagar, Chennai',
      'vehicleNumber': vehicleNo.toUpperCase(),
      'vehicleType': type,
      'duration': hours,
      'totalAmount': 40.0 * hours,
      'qrCodePayload': 'QR_PE_loc-1_$vehicleNo',
      'startTime': DateTime.now().toIso8601String(),
    };
    notifyListeners();
    return true;
  }

  void simulateCheckout() {
    _activeBooking = null;
    notifyListeners();
  }
}
