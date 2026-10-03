import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import ProviderProfile from '../src/models/ProviderProfile.js';
import RoadsideRequest from '../src/models/RoadsideRequest.js';

await connectDB();
await Promise.all([User.deleteMany({}), ProviderProfile.deleteMany({}), RoadsideRequest.deleteMany({})]);
const passwordHash = await bcrypt.hash('Password123!', 12);
const [customer, providerUser, admin] = await User.create([
  { name: 'Rajesh Kumar', email: 'customer@omeganexora.test', phone: '+919820012345', passwordHash, role: 'CUSTOMER' },
  { name: 'Rajesh Kumar - Mechanic', email: 'mechanic@omeganexora.test', phone: '+919876543210', passwordHash, role: 'PROVIDER' },
  { name: 'Team 3 Admin', email: 'admin@omeganexora.test', passwordHash, role: 'ADMIN' }
]);
const provider = await ProviderProfile.create({
  userId: providerUser._id, name: 'Rajesh Kumar', phone: providerUser.phone, rating: 4.9, completedJobs: 320, experienceYears: 6,
  verified: true, verification: { identityVerified: true, backgroundChecked: true, licenseVerified: true },
  skills: ['Car Repair', 'Battery Jump Start', 'Puncture Service', 'Towing Service'], vehicleTypes: ['Car', 'SUV', 'Truck'],
  services: ['Car Repair', 'Battery Jump Start', 'Puncture Service', 'Towing Service'], languages: ['English', 'Hindi', 'Telugu'],
  serviceVehicle: { type: 'Tata Ace', registration: 'TS 09 UB 4412' }, availability: 'AVAILABLE',
  currentLocation: { lat: 17.445, lng: 78.379, accuracyMeters: 20, updatedAt: new Date() }
});
const request = await RoadsideRequest.create({
  requestNumber: 'ONR-2025-78433', customerId: customer._id, vehicleId: '000000000000000000000001',
  vehicleSnapshot: { type: 'Car', brand: 'Hyundai', model: 'Creta', registration: 'TS 09 AB 7843', year: 2022, fuelType: 'Petrol', color: 'White' },
  service: 'Battery Jump Start', problemDetails: { issue: "Won't Start", description: 'Battery warning light is on.', drivable: false, urgency: 'STANDARD' },
  breakdownLocation: { lat: 17.4308, lng: 78.395, address: 'IKEA Hitec City, Hyderabad', landmark: 'Near main entrance' },
  status: 'SEARCHING', timeline: [{ status: 'SEARCHING', actorId: customer._id, note: 'Request received from Team 2' }]
});
console.log(JSON.stringify({ customerId: customer._id, providerUserId: providerUser._id, providerProfileId: provider._id, adminId: admin._id, requestId: request._id }, null, 2));
await disconnectDB();
