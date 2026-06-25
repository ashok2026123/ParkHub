import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/parking_provider.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ParkingProvider()),
      ],
      child: const ParkEasyApp(),
    ),
  );
}

class ParkEasyApp extends StatelessWidget {
  const ParkEasyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ParkEasy Chennai',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0x00E67600), // Electric Green
        scaffoldBackgroundColor: const Color(0xFF121212),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF00E676),
          secondary: Color(0xFF2979FF),
          surface: Color(0xFF1E1E1E),
          background: Color(0xFF121212),
        ),
        fontFamily: 'Outfit',
        useMaterial3: true,
      ),
      home: const LoginScreen(),
    );
  }
}

// ================= 1. LOGIN & OTP SCREEN =================
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _otpController = TextEditingController();
  bool _otpSent = false;
  bool _isLoading = false;

  void _handleSendOtp() {
    if (_phoneController.text.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 10-digit number')),
      );
      return;
    }
    setState(() => _isLoading = true);
    Future.delayed(const Duration(seconds: 1), () {
      setState(() {
        _isLoading = false;
        _otpSent = true;
      });
    });
  }

  void _handleLogin() {
    if (_otpController.text.length < 4) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter 4-digit code')),
      );
      return;
    }
    setState(() => _isLoading = true);
    Future.delayed(const Duration(seconds: 1), () {
      setState(() => _isLoading = false);
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const MainTabsHolder()),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(28.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.local_parking, size: 72, color: Color(0xFF00E676)),
              const SizedBox(height: 16),
              const Text(
                'ParkEasy Chennai',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.extrabold),
              ),
              const Text(
                'Chennai\'s Premium Automated Parking Network',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
              const SizedBox(height: 48),
              if (!_otpSent) ...[
                TextField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.phone),
                    labelText: 'Phone Number',
                    hintText: 'Enter 10-digit mobile',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _isLoading ? null : _handleSendOtp,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00E676),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isLoading 
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2))
                    : const Text('Send Verification OTP', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ] else ...[
                Text(
                  'OTP sent to +91 ${_phoneController.text}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  obscureText: true,
                  maxLength: 4,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 20, letterSpacing: 8),
                  decoration: InputDecoration(
                    labelText: 'Enter OTP Code',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _isLoading ? null : _handleLogin,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00E676),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isLoading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2))
                    : const Text('Verify & Let\'s Go', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ================= 2. MAIN SYSTEM SHELL (TABS) =================
class MainTabsHolder extends StatefulWidget {
  const MainTabsHolder({super.key});

  @override
  State<MainTabsHolder> createState() => _MainTabsHolderState();
}

class _MainTabsHolderState extends State<MainTabsHolder> {
  int _currentIndex = 0;

  final List<Widget> _tabs = [
    const MobileHomeScreen(),
    const MobileBookingHistoryScreen(),
    const MobileOwnerDashboardScreen(),
    const MobileProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _tabs[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: const Color(0xFF00E676),
        unselectedItemColor: Colors.grey,
        backgroundColor: const Color(0xFF1E1E1E),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.map_outlined), label: 'Find Spot'),
          BottomNavigationBarItem(icon: Icon(Icons.confirmation_num_outlined), label: 'Tickets'),
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), label: 'Host Dashboard'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }
}

// ================= 3. CUSTOMER PORTAL & MAP VIEW =================
class MobileHomeScreen extends StatefulWidget {
  const MobileHomeScreen({super.key});

  @override
  State<MobileHomeScreen> createState() => _MobileHomeScreenState();
}

class _MobileHomeScreenState extends State<MobileHomeScreen> {
  final TextEditingController _searchController = TextEditingController();

  void _openBookingSheet(BuildContext context, ParkingProvider provider, ParkingLocation loc) {
    provider.selectLocation(loc);
    final vehicleController = TextEditingController();
    int selectedHours = 2;
    String vehicleType = 'four-wheeler';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1E1E1E),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            double rate = vehicleType == 'four-wheeler' ? loc.hourlyRate : loc.hourlyRate * 0.6;
            double total = rate * selectedHours;

            return Padding(
              padding: EdgeInsets.only(
                top: 24,
                left: 24,
                right: 24,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    loc.name,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    loc.address,
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: ChoiceChip(
                          label: const Text('🏍️ 2-Wheeler'),
                          selected: vehicleType == 'two-wheeler',
                          onSelected: (val) => setModalState(() => vehicleType = 'two-wheeler'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ChoiceChip(
                          label: const Text('🚗 4-Wheeler'),
                          selected: vehicleType == 'four-wheeler',
                          onSelected: (val) => setModalState(() => vehicleType = 'four-wheeler'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: vehicleController,
                    textCapitalization: TextCapitalization.characters,
                    decoration: InputDecoration(
                      labelText: provider.translate('vehicleNo'),
                      hintText: 'e.g. TN-01-AB-9999',
                      border: const OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(provider.translate('selectHours')),
                      Row(
                        children: [
                          IconButton(
                            onPressed: () => setModalState(() => selectedHours = (selectedHours - 1).clamp(1, 24)),
                            icon: const Icon(Icons.remove_circle_outline),
                          ),
                          Text('$selectedHours hrs', style: const TextStyle(fontWeight: FontWeight.bold)),
                          IconButton(
                            onPressed: () => setModalState(() => selectedHours = (selectedHours + 1).clamp(1, 24)),
                            icon: const Icon(Icons.add_circle_outline),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.black38, borderRadius: BorderRadius.circular(8)),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total Amount Due'),
                        Text(
                          '₹${total.toStringAsFixed(0)}',
                          style: const TextStyle(fontSize: 22, color: Color(0xFF00E676), fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: () async {
                      if (vehicleController.text.trim().isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vehicle number required!')));
                        return;
                      }
                      Navigator.pop(context); // Close bottom sheet
                      _simulateUpiFlow(context, provider, vehicleController.text, vehicleType, selectedHours);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF00E676),
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Text(provider.translate('payWithUPI')),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _simulateUpiFlow(BuildContext context, ParkingProvider provider, String vNo, String type, int hrs) {
    final pinController = TextEditingController();
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.security, color: Colors.blue),
              SizedBox(width: 8),
              Text('Enter UPI PIN'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Secure transaction via GPay / BHIM UPI'),
              const SizedBox(height: 16),
              TextField(
                controller: pinController,
                obscureText: true,
                keyboardType: TextInputType.number,
                maxLength: 4,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 22, letterSpacing: 12),
                decoration: const InputDecoration(border: OutlineInputBorder()),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              onPressed: () async {
                if (pinController.text.length < 4) return;
                Navigator.pop(context); // Close PIN dialog
                
                // Show loading
                showDialog(
                  context: context,
                  barrierDismissible: false,
                  builder: (context) => const Center(child: CircularProgressIndicator(color: Color(0xFF00E676))),
                );

                await Future.delayed(const Duration(seconds: 2));
                Navigator.pop(context); // Close loading

                await provider.simulateBooking(vNo, type, hrs);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Booking Successful!'), backgroundColor: Color(0xFF00E676)),
                );
              },
              child: const Text('Verify PIN'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<ParkingProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(provider.translate('appName'), style: const TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            onPressed: () => provider.toggleLanguage(),
            icon: const Icon(Icons.language),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search),
                hintText: provider.translate('searchHint'),
                filled: true,
                fillColor: const Color(0xFF1E1E1E),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
          ),

          // Map Emulator Area
          Expanded(
            child: Stack(
              children: [
                // Simulated map grid container
                Container(
                  color: const Color(0xFF0C0F14),
                  child: Center(
                    child: Opacity(
                      opacity: 0.1,
                      child: Icon(Icons.map, size: 240, color: Colors.white),
                    ),
                  ),
                ),

                // Location Pin Emulators
                Positioned(
                  left: 80,
                  top: 150,
                  child: _buildLocationPin(context, provider, provider.locations[0]),
                ),
                Positioned(
                  right: 90,
                  bottom: 220,
                  child: _buildLocationPin(context, provider, provider.locations[1]),
                ),

                // User Location Dot
                Positioned(
                  left: 170,
                  top: 280,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(color: Colors.blueAccent, shape: BoxShape.circle),
                    child: Container(width: 12, height: 12, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle)),
                  ),
                ),
                
                Positioned(
                  bottom: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: Colors.black85, borderRadius: BorderRadius.circular(4)),
                    child: const Text('Map View Active', style: TextStyle(fontSize: 10, color: Colors.grey)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLocationPin(BuildContext context, ParkingProvider provider, ParkingLocation loc) {
    return GestureDetector(
      onTap: () => _openBookingSheet(context, provider, loc),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
            decoration: BoxDecoration(color: const Color(0xFF1E1E1E), borderRadius: BorderRadius.circular(6), border: Border.all(color: const Color(0xFF00E676))),
            child: Text('₹${loc.hourlyRate.toStringAsFixed(0)}/h', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
          ),
          const Icon(Icons.location_on, color: Color(0xFF00E676), size: 36),
        ],
      ),
    );
  }
}

// ================= 4. QR TICKETS SCREEN =================
class MobileBookingHistoryScreen extends StatelessWidget {
  const MobileBookingHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<ParkingProvider>(context);
    final booking = provider.activeBooking;

    return Scaffold(
      appBar: AppBar(title: Text(provider.translate('activeTicket'))),
      body: booking == null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.receipt_long, size: 64, color: Colors.grey),
                  const SizedBox(height: 12),
                  const Text('No Active Bookings', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 6),
                  Text('Book a spot from Map Screen to generate entry ticket.', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                ],
              ),
            )
          : Padding(
              padding: const EdgeInsets.all(24.0),
              child: Card(
                color: const Color(0xFF1E1E1E),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(booking['locationName'], style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                              Text(booking['locationAddress'], style: const TextStyle(color: Colors.grey, fontSize: 11)),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(color: Colors.green.withOpacity(0.2), borderRadius: BorderRadius.circular(4)),
                            child: const Text('CONFIRMED', style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const Divider(height: 1, color: Colors.grey),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Vehicle: ${booking['vehicleNumber']}'),
                          Text('Price: ₹${booking['totalAmount'].toStringAsFixed(0)}'),
                        ],
                      ),
                      const SizedBox(height: 24),
                      
                      // Mock QR code painter
                      Center(
                        child: Container(
                          width: 140,
                          height: 140,
                          color: Colors.white,
                          padding: const EdgeInsets.all(12),
                          child: CustomPaint(
                            painter: QRGridPainter(),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Scan QR at gate for contactless barrier entry/exit.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey, fontSize: 11),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () {
                          provider.simulateCheckout();
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Gate Checked-out successfully!')),
                          );
                        },
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFF1744), foregroundColor: Colors.white),
                        child: Text(provider.translate('exitExitTime')),
                      ),
                    ],
                  ),
                ),
              ),
            ),
    );
  }
}

class QRGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = Colors.black;
    double cell = size.width / 4;
    canvas.drawRect(Rect.fromLTWH(0, 0, cell, cell), paint);
    canvas.drawRect(Rect.fromLTWH(cell * 2, 0, cell, cell), paint);
    canvas.drawRect(Rect.fromLTWH(cell, cell, cell, cell), paint);
    canvas.drawRect(Rect.fromLTWH(0, cell * 2, cell, cell), paint);
    canvas.drawRect(Rect.fromLTWH(cell * 3, cell * 2, cell, cell), paint);
    canvas.drawRect(Rect.fromLTWH(cell * 2, cell * 3, cell, cell), paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ================= 5. HOST / OWNER DASHBOARD =================
class MobileOwnerDashboardScreen extends StatefulWidget {
  const MobileOwnerDashboardScreen({super.key});

  @override
  State<MobileOwnerDashboardScreen> createState() => _MobileOwnerDashboardScreenState();
}

class _MobileOwnerDashboardScreenState extends State<MobileOwnerDashboardScreen> {
  int _2wOccupied = 12;
  int _4wOccupied = 8;

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<ParkingProvider>(context);

    return Scaffold(
      appBar: AppBar(title: Text(provider.translate('earnings'))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              color: const Color(0xFF1E1E1E),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    const Text('Platform Host Earnings (This Month)', style: TextStyle(color: Colors.grey)),
                    const SizedBox(height: 8),
                    Text('₹12,450', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Theme.of(context).primaryColor)),
                    const SizedBox(height: 4),
                    const Text('Payout threshold: ₹2000 (Pending auto-clear)', style: TextStyle(fontSize: 10, color: Colors.grey)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Manage Listed Space: T. Nagar Plaza', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Card(
              color: const Color(0xFF1E1E1E),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('🏍️ 2W Slots Filled'),
                        Row(
                          children: [
                            IconButton(onPressed: () => setState(() => _2wOccupied = (_2wOccupied - 1).clamp(0, 60)), icon: const Icon(Icons.remove)),
                            Text('$_2wOccupied / 60'),
                            IconButton(onPressed: () => setState(() => _2wOccupied = (_2wOccupied + 1).clamp(0, 60)), icon: const Icon(Icons.add)),
                          ],
                        ),
                      ],
                    ),
                    const Divider(),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('🚗 4W Slots Filled'),
                        Row(
                          children: [
                            IconButton(onPressed: () => setState(() => _4wOccupied = (_4wOccupied - 1).clamp(0, 40)), icon: const Icon(Icons.remove)),
                            Text('$_4wOccupied / 40'),
                            IconButton(onPressed: () => setState(() => _4wOccupied = (_4wOccupied + 1).clamp(0, 40)), icon: const Icon(Icons.add)),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ================= 6. USER PROFILE & REFERRALS =================
class MobileProfileScreen extends StatelessWidget {
  const MobileProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<ParkingProvider>(context);

    return Scaffold(
      appBar: AppBar(title: const Text('My Profile')),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Center(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundImage: NetworkImage('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'),
                  ),
                  SizedBox(height: 12),
                  Text('Karthik Raja', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  Text('+91 88833 99999', style: TextStyle(color: Colors.grey, fontSize: 12)),
                ],
              ),
            ),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: const Color(0xFF1E1E1E), borderRadius: BorderRadius.circular(12)),
              child: Column(
                children: [
                  Text(provider.translate('referralCode')),
                  const SizedBox(height: 4),
                  const Text('KARTHIK9', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.amber)),
                  const SizedBox(height: 8),
                  const Text('Share with friends & get ₹50 free parking tokens when they book!', textAlign: TextAlign.center, style: TextStyle(fontSize: 11, color: Colors.grey)),
                ],
              ),
            ),
            const Spacer(),
            ElevatedButton(
              onPressed: () {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              },
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red[900], foregroundColor: Colors.white),
              child: const Text('Sign Out Account'),
            ),
          ],
        ),
      ),
    );
  }
}
