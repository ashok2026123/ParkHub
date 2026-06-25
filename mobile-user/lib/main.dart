import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/parking_provider.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ParkingProvider()),
      ],
      child: const ParkEasyCustomerApp(),
    ),
  );
}

class ParkEasyCustomerApp extends StatelessWidget {
  const ParkEasyCustomerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ParkEasy Chennai - Customer',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF121212),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF00E676),
          secondary: Color(0xFF2979FF),
          surface: Color(0xFF1E1E1E),
        ),
        useMaterial3: true,
      ),
      home: const MobileCustomerHomeScreen(),
    );
  }
}

class MobileCustomerHomeScreen extends StatefulWidget {
  const MobileCustomerHomeScreen({super.key});

  @override
  State<MobileCustomerHomeScreen> createState() => _MobileCustomerHomeScreenState();
}

class _MobileCustomerHomeScreenState extends State<MobileCustomerHomeScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<ParkingProvider>(context);

    final List<Widget> tabs = [
      const MapTabScreen(),
      const ActiveTicketScreen(),
      const CustomerProfileScreen(),
    ];

    return Scaffold(
      body: tabs[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (idx) => setState(() => _currentIndex = idx),
        selectedItemColor: const Color(0xFF00E676),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.map_outlined), label: 'Find Spot'),
          BottomNavigationBarItem(icon: Icon(Icons.qr_code_scanner), label: 'Tickets'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }
}

class MapTabScreen extends StatelessWidget {
  const MapTabScreen({super.key});

  void _openBookingSheet(BuildContext context, ParkingProvider provider) {
    final vehicleController = TextEditingController();
    int selectedHours = 2;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1E1E1E),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            double total = 40.0 * selectedHours;
            return Padding(
              padding: EdgeInsets.only(
                top: 24, left: 24, right: 24,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('T. Nagar Smart Parking Plaza', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const Text('Pondy Bazaar, Chennai', style: TextStyle(color: Colors.grey, fontSize: 11)),
                  const SizedBox(height: 16),
                  TextField(
                    controller: vehicleController,
                    decoration: const InputDecoration(labelText: 'Vehicle Number (e.g. TN-01-AB-1234)', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Select Duration'),
                      Row(
                        children: [
                          IconButton(onPressed: () => setModalState(() => selectedHours = (selectedHours - 1).clamp(1, 24)), icon: const Icon(Icons.remove)),
                          Text('$selectedHours hrs'),
                          IconButton(onPressed: () => setModalState(() => selectedHours = (selectedHours + 1).clamp(1, 24)), icon: const Icon(Icons.add)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () async {
                      if (vehicleController.text.trim().isEmpty) return;
                      Navigator.pop(context);
                      await provider.simulateBooking(vehicleController.text, 'four-wheeler', selectedHours);
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Booking Confirmed!'), backgroundColor: Colors.green));
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black),
                    child: const Text('Pay with UPI'),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<ParkingProvider>(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Find Parking')),
      body: Stack(
        children: [
          Container(color: const Color(0xFF0C0F14), child: const Center(child: Icon(Icons.map, size: 160, color: Colors.white10))),
          Positioned(
            left: 100,
            top: 200,
            child: GestureDetector(
              onTap: () => _openBookingSheet(context, provider),
              child: const Icon(Icons.location_on, color: Color(0xFF00E676), size: 48),
            ),
          ),
        ],
      ),
    );
  }
}

class ActiveTicketScreen extends StatelessWidget {
  const ActiveTicketScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<ParkingProvider>(context);
    final booking = provider.activeBooking;

    return Scaffold(
      appBar: AppBar(title: const Text('Active Ticket')),
      body: booking == null
          ? const Center(child: Text('No Active Reservations'))
          : Padding(
              padding: const EdgeInsets.all(24.0),
              child: Card(
                color: const Color(0xFF1E1E1E),
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(booking['locationName'], style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      Container(
                        width: 120, height: 120, color: Colors.white,
                        padding: const EdgeInsets.all(8),
                        child: const Placeholder(color: Colors.black),
                      ),
                      const SizedBox(height: 16),
                      Text('Vehicle: ${booking['vehicleNumber']}'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () {
                          provider.simulateCheckout();
                        },
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                        child: const Text('Checkout Gate Exit'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
    );
  }
}

class CustomerProfileScreen extends StatelessWidget {
  const CustomerProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<ParkingProvider>(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const CircleAvatar(radius: 40, backgroundImage: NetworkImage('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200')),
            const SizedBox(height: 16),
            const Text('Karthik Raja', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const Text('Referral Code: KARTHIK9', style: TextStyle(color: Colors.amber)),
            const Spacer(),
            ElevatedButton(
              onPressed: () => provider.toggleLanguage(),
              child: Text(provider.translate('languageToggle')),
            ),
          ],
        ),
      ),
    );
  }
}
