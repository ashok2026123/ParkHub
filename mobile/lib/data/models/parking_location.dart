class ParkingLocation {
  final String id;
  final String ownerId;
  final String name;
  final String address;
  final double latitude;
  final double longitude;
  final String description;
  final double hourlyRate;
  final double dailyRate;
  final int total2W;
  final int total4W;
  int available2W;
  int available4W;
  final String imageUrl;
  final bool isApproved;
  final bool cctvEnabled;
  final double rating;

  ParkingLocation({
    required this.id,
    required this.ownerId,
    required this.name,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.description,
    required this.hourlyRate,
    required this.dailyRate,
    required this.total2W,
    required this.total4W,
    required this.available2W,
    required this.available4W,
    required this.imageUrl,
    required this.isApproved,
    required this.cctvEnabled,
    required this.rating,
  });

  factory ParkingLocation.fromJson(Map<String, dynamic> json) {
    return ParkingLocation(
      id: json['id'],
      ownerId: json['ownerId'],
      name: json['name'],
      address: json['address'],
      latitude: json['latitude'],
      longitude: json['longitude'],
      description: json['description'],
      hourlyRate: json['hourlyRate'].toDouble(),
      dailyRate: json['dailyRate'].toDouble(),
      total2W: json['total2W'],
      total4W: json['total4W'],
      available2W: json['available2W'],
      available4W: json['available4W'],
      imageUrl: json['imageUrl'],
      isApproved: json['isApproved'],
      cctvEnabled: json['cctvEnabled'],
      rating: json['rating'].toDouble(),
    );
  }
}
