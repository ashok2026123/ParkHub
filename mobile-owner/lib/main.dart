import 'package:flutter/material.dart';

void main() {
  runApp(const ParkEasyOwnerApp());
}

class ParkEasyOwnerApp extends StatelessWidget {
  const ParkEasyOwnerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ParkEasy Chennai - Host',
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
      home: const MobileOwnerHomeScreen(),
    );
  }
}

class MobileOwnerHomeScreen extends StatefulWidget {
  const MobileOwnerHomeScreen({super.key});

  @override
  State<MobileOwnerHomeScreen> createState() => _MobileOwnerHomeScreenState();
}

class _MobileOwnerHomeScreenState extends State<MobileOwnerHomeScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final List<Widget> tabs = [
      const HostOverviewTab(),
      const HostOccupancyTab(),
      const HostProfileTab(),
    ];

    return Scaffold(
      body: tabs[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (idx) => setState(() => _currentIndex = idx),
        selectedItemColor: const Color(0xFF00E676),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.analytics_outlined), label: 'Earnings'),
          BottomNavigationBarItem(icon: Icon(Icons.directions_car_outlined), label: 'Occupancy'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }
}

class HostOverviewTab extends StatelessWidget {
  const HostOverviewTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Host Earnings')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              color: const Color(0xFF1E1E1E),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  children: [
                    const Text('Total Revenue (This Month)', style: TextStyle(color: Colors.grey)),
                    const SizedBox(height: 12),
                    Text('₹12,450', style: TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary)),
                    const SizedBox(height: 6),
                    const Text('Platform Net: ₹11,205 (90%)', style: TextStyle(color: Colors.grey, fontSize: 11)),
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

class HostOccupancyTab extends StatefulWidget {
  const HostOccupancyTab({super.key});

  @override
  State<HostOccupancyTab> createState() => _HostOccupancyTabState();
}

class _HostOccupancyTabState extends State<HostOccupancyTab> {
  int _filledSlots = 12;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Live Occupancy')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Card(
              color: const Color(0xFF1E1E1E),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Filled Slots Count'),
                    Row(
                      children: [
                        IconButton(onPressed: () => setState(() => _filledSlots = (_filledSlots - 1).clamp(0, 40)), icon: const Icon(Icons.remove)),
                        Text('$_filledSlots / 40', style: const TextStyle(fontWeight: FontWeight.bold)),
                        IconButton(onPressed: () => setState(() => _filledSlots = (_filledSlots + 1).clamp(0, 40)), icon: const Icon(Icons.add)),
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

class HostProfileTab extends StatelessWidget {
  const HostProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Host Profile')),
      body: const Padding(
        padding: EdgeInsets.all(24.0),
        child: Center(
          child: Column(
            children: [
              CircleAvatar(radius: 40, child: Text('S')),
              SizedBox(height: 16),
              Text('Suresh Perumal', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              Text('Status: Verified Partner Host', style: TextStyle(color: Colors.green)),
            ],
          ),
        ),
      ),
    );
  }
}
