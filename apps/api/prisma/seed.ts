import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// AES-256-GCM helper for seed data
function encryptData(plainText: string, keyHex: string): string {
  const key = crypto.createHash('sha256').update(keyHex).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${encrypted}:${iv.toString('hex')}:${authTag}`;
}

const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY ||
  'a7f8e32c91b54d6023e4f7192837465a1029384756abcdef1234567890abcdef';

async function main() {
  console.log('🌱 Starting comprehensive database seed for Bhoomi Marketplace (Nagpur/Wardha)...');

  // Clean existing tables in order
  await prisma.auditLog.deleteMany({});
  await prisma.kycDocument.deleteMany({});
  await prisma.deal.deleteMany({});
  await prisma.inquiry.deleteMany({});
  await prisma.propertyAmenity.deleteMany({});
  await prisma.propertyMedia.deleteMany({});
  await prisma.favorite.deleteMany({});
  await prisma.savedSearch.deleteMany({});
  await prisma.chatMessage.deleteMany({});
  await prisma.chatSession.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.otpToken.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Cleared existing records.');

  // 1. Create Core Role Users
  const adminUser = await prisma.user.create({
    data: {
      name: 'Rajesh Deshmukh (Managing Director)',
      email: 'admin@bhoomi.in',
      mobile: '+919822011111',
      role: 'ADMIN',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });

  const brokerUser = await prisma.user.create({
    data: {
      name: 'Virendra Patil (Patil Realty Associates)',
      email: 'broker.nagpur@bhoomi.in',
      mobile: '+919822022222',
      role: 'BROKER',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
  });

  const builderUser = await prisma.user.create({
    data: {
      name: 'Vidarbha Infrastructures & Developers Pvt Ltd',
      email: 'builder@bhoomi.in',
      mobile: '+919822033333',
      role: 'BUILDER',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    },
  });

  const sellerUser = await prisma.user.create({
    data: {
      name: 'Sunil Wankhede (Direct Owner)',
      email: 'seller.wardha@bhoomi.in',
      mobile: '+919822044444',
      role: 'SELLER',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    },
  });

  const buyerUser = await prisma.user.create({
    data: {
      name: 'Pooja Kulkarni (Home Buyer)',
      email: 'buyer.vidarbha@bhoomi.in',
      mobile: '+919822055555',
      role: 'BUYER',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  console.log('Created standard demo users for all 5 roles.');

  // Curated High-Definition Property Media Pools
  const apartmentImages = [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&auto=format&fit=crop&q=80',
  ];

  const villaImages = [
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
  ];

  const bungalowImages = [
    'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=1200&auto=format&fit=crop&q=80',
  ];

  const plotImages = [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&auto=format&fit=crop&q=80',
  ];

  // 32 Authentic properties across Nagpur & Wardha
  const propertyTemplates = [
    // Nagpur Flats
    {
      title: 'Regalia Towers - Luxury 3 BHK High-Rise Apartment',
      description: 'Exclusive 3 BHK residence with expansive panoramic views of Ambazari lake. Built with Italian marble flooring, VRV air-conditioning provisions, and 3 master suites. Close to top schools and metro station.',
      propertyType: 'FLAT',
      listingType: 'SALE',
      bhk: 3,
      areaOriginal: 1850,
      areaUnit: 'SQFT',
      priceTotal: 13500000,
      city: 'Nagpur',
      locality: 'Ramdaspeth',
      address: 'Central Bazar Road, Ramdaspeth, Nagpur, Maharashtra 440010',
      latitude: 21.1345,
      longitude: 79.0762,
      ownerId: builderUser.id,
      ownerRole: 'BUILDER',
      contactPhone: '+919822033333',
      hidePhoneUntilLogin: true,
      hideSelectedImagesUntilLogin: true,
      availability: 'IMMEDIATE',
      furnishing: 'SEMI_FURNISHED',
      images: apartmentImages,
      amenities: ['Clubhouse', 'Swimming Pool', 'EV Charging', '24/7 Security', 'High-Speed Elevators', 'Power Backup'],
    },
    {
      title: 'Green Meadows 2 BHK Modern Flat near IT Park',
      description: 'Strategically located minutes from Gayatri Nagar IT Park and VNIT Nagpur. Ideal for working professionals and families. Vastu-compliant north-facing entry with dedicated covered car parking.',
      propertyType: 'FLAT',
      listingType: 'SALE',
      bhk: 2,
      areaOriginal: 1100,
      areaUnit: 'SQFT',
      priceTotal: 5800000,
      city: 'Nagpur',
      locality: 'Pratap Nagar',
      address: 'Ring Road, Near IT Park, Pratap Nagar, Nagpur 440022',
      latitude: 21.1189,
      longitude: 79.0554,
      ownerId: brokerUser.id,
      ownerRole: 'BROKER',
      contactPhone: '+919822022222',
      hidePhoneUntilLogin: true,
      hideSelectedImagesUntilLogin: false,
      availability: 'IMMEDIATE',
      furnishing: 'UNFURNISHED',
      images: [apartmentImages[1], apartmentImages[2], apartmentImages[0]],
      amenities: ['Covered Parking', 'Solar Water Heating', 'CCTV Surveillance', 'Children Play Area'],
    },
    {
      title: 'The Grand Heritage 4 BHK Penthouse with Private Terrace',
      description: 'Palatial 4 BHK penthouse offering 3,400 sq.ft. of carpet area plus a private landscaped terrace garden overlooking Civil Lines greenery. Ultra-private floor layout with biometric elevator access.',
      propertyType: 'FLAT',
      listingType: 'SALE',
      bhk: 4,
      areaOriginal: 3400,
      areaUnit: 'SQFT',
      priceTotal: 29500000,
      city: 'Nagpur',
      locality: 'Civil Lines',
      address: 'Near High Court, Temple Road, Civil Lines, Nagpur 440001',
      latitude: 21.1539,
      longitude: 79.0718,
      ownerId: brokerUser.id,
      ownerRole: 'BROKER',
      contactPhone: '+919822022222',
      hidePhoneUntilLogin: true,
      hideSelectedImagesUntilLogin: true,
      availability: 'IMMEDIATE',
      furnishing: 'FULLY_FURNISHED',
      images: [apartmentImages[3], apartmentImages[4], apartmentImages[0]],
      amenities: ['Private Terrace', 'Gymnasium', 'Concierge Desk', '2 Covered Car Parks', '100% DG Backup'],
    },
    {
      title: 'Spacious 3.5 BHK Premium Flat in Manish Nagar',
      description: 'Well-ventilated 3.5 BHK flat with servant room/home office. Just 10 minutes from Dr. Babasaheb Ambedkar International Airport and Metro station. High quality wooden work in all bedrooms.',
      propertyType: 'FLAT',
      listingType: 'SALE',
      bhk: 3.5,
      areaOriginal: 2100,
      areaUnit: 'SQFT',
      priceTotal: 9600000,
      city: 'Nagpur',
      locality: 'Manish Nagar',
      address: 'Somalwada Main Road, Manish Nagar, Nagpur 440015',
      latitude: 21.0898,
      longitude: 79.0735,
      ownerId: sellerUser.id,
      ownerRole: 'SELLER',
      contactPhone: '+919822044444',
      hidePhoneUntilLogin: true,
      hideSelectedImagesUntilLogin: false,
      availability: 'IMMEDIATE',
      furnishing: 'SEMI_FURNISHED',
      images: [apartmentImages[2], apartmentImages[0], apartmentImages[3]],
      amenities: ['Gym', 'Clubhouse', 'Intercom', 'Landscaped Garden', 'Rooftop Gazebo'],
    },
    {
      title: 'Affordable 1 BHK Apartment for Rent in Besa',
      description: 'Charming 1 BHK semi-furnished flat in a peaceful gated society on Besa-Pipla road. Ideal for young couples or IT employees. Low maintenance, 24-hour municipal water supply.',
      propertyType: 'FLAT',
      listingType: 'RENT',
      bhk: 1,
      areaOriginal: 620,
      areaUnit: 'SQFT',
      priceTotal: 12000, // Monthly Rent
      city: 'Nagpur',
      locality: 'Besa',
      address: 'Near Podar World School, Besa, Nagpur 440037',
      latitude: 21.0765,
      longitude: 79.0889,
      ownerId: sellerUser.id,
      ownerRole: 'SELLER',
      contactPhone: '+919822044444',
      hidePhoneUntilLogin: false,
      hideSelectedImagesUntilLogin: false,
      availability: 'IMMEDIATE',
      furnishing: 'SEMI_FURNISHED',
      images: [apartmentImages[4], apartmentImages[1]],
      amenities: ['24/7 Water', 'Lift', 'Security Guard', 'Two-Wheeler Parking'],
    },

    // Nagpur Villas & Bungalows
    {
      title: 'Vaikunth Royal Villas - 4 BHK Luxury Gated Villa',
      description: 'Grand standalone Spanish-style villa with private manicured lawn, double-height ceiling living hall, and private plunge pool. Located in prime Hingna corridor near MIHAN SEZ.',
      propertyType: 'VILLA',
      listingType: 'SALE',
      bhk: 4,
      areaOriginal: 4200,
      areaUnit: 'SQFT',
      priceTotal: 24500000,
      city: 'Nagpur',
      locality: 'Hingna Road',
      address: 'Opp. Yashwantrao Chavan College, Hingna Road, Nagpur 440016',
      latitude: 21.0978,
      longitude: 79.0023,
      ownerId: builderUser.id,
      ownerRole: 'BUILDER',
      contactPhone: '+919822033333',
      hidePhoneUntilLogin: true,
      hideSelectedImagesUntilLogin: true,
      availability: 'IMMEDIATE',
      furnishing: 'FULLY_FURNISHED',
      images: villaImages,
      amenities: ['Private Pool', 'Personal Lawn', 'Solar Power 5kW', 'Double Car Garage', 'Clubhouse & Squash'],
    },
    {
      title: 'Independent 3 BHK Duplex Bungalow in Trimurti Nagar',
      description: 'Newly constructed independent duplex bungalow built with top-grade red brick construction and Teakwood doors. Separate servant quarter, spacious modular kitchen, and east-facing puja room.',
      propertyType: 'BUNGALOW',
      listingType: 'SALE',
      bhk: 3,
      areaOriginal: 2600,
      areaUnit: 'SQFT',
      priceTotal: 14500000,
      city: 'Nagpur',
      locality: 'Trimurti Nagar',
      address: 'NIT Layout, Trimurti Nagar, Ring Road, Nagpur 440022',
      latitude: 21.1165,
      longitude: 79.0345,
      ownerId: sellerUser.id,
      ownerRole: 'SELLER',
      contactPhone: '+919822044444',
      hidePhoneUntilLogin: true,
      hideSelectedImagesUntilLogin: false,
      availability: 'IMMEDIATE',
      furnishing: 'UNFURNISHED',
      images: bungalowImages,
      amenities: ['Borewell & Corporation Water', 'Car Porch', 'Terrace Pergola', 'Boundary Wall with Gates'],
    },
    {
      title: 'Serene Green 3 BHK Bungalow for Rent in Dhantoli',
      description: 'Vintage colonial style bungalow with huge trees and serene compound in central Nagpur. Ideal for corporate guest houses, doctors, or senior executives. Walk to Lokmat Square and metro.',
      propertyType: 'BUNGALOW',
      listingType: 'RENT',
      bhk: 3,
      areaOriginal: 2800,
      areaUnit: 'SQFT',
      priceTotal: 45000, // Monthly Rent
      city: 'Nagpur',
      locality: 'Dhantoli',
      address: 'Wardha Road, Dhantoli, Nagpur 440012',
      latitude: 21.1312,
      longitude: 79.0834,
      ownerId: brokerUser.id,
      ownerRole: 'BROKER',
      contactPhone: '+919822022222',
      hidePhoneUntilLogin: false,
      hideSelectedImagesUntilLogin: false,
      availability: 'IMMEDIATE',
      furnishing: 'SEMI_FURNISHED',
      images: [bungalowImages[1], bungalowImages[2], bungalowImages[0]],
      amenities: ['Private Garden', '3 Car Parking', 'Pet Friendly', 'Servant Room'],
    },

    // Nagpur Plots
    {
      title: 'NMRDA Sanctioned Residential Plot in MIHAN Wardha Road',
      description: 'Clear title residential plot with RL (Release Letter) sanctioned by NMRDA. Underground drainage, electrical cabling, and 40-feet asphalted wide road. Prime appreciation corridor near TCS, Infosys, and AIIMS Nagpur.',
      propertyType: 'PLOT',
      listingType: 'SALE',
      bhk: null,
      areaOriginal: 2000,
      areaUnit: 'SQFT',
      priceTotal: 5200000,
      city: 'Nagpur',
      locality: 'MIHAN / Wardha Road',
      address: 'Sector 18, Near AIIMS Campus, Wardha Road, Nagpur 441108',
      latitude: 21.0345,
      longitude: 79.0512,
      ownerId: brokerUser.id,
      ownerRole: 'BROKER',
      contactPhone: '+919822022222',
      hidePhoneUntilLogin: true,
      hideSelectedImagesUntilLogin: false,
      availability: 'IMMEDIATE',
      furnishing: 'UNFURNISHED',
      images: plotImages,
      amenities: ['NMRDA Sanctioned', 'Clear Title RL', 'Water Connection', 'Tar Roads', 'Street Lights'],
    },
    {
      title: 'Highway Commercial Plot on Samruddhi Expressway Corridor',
      description: 'Massive 2-acre NA commercial/logistics plot situated directly on the feeder highway to the Hindu Hrudaysamrat Balasaheb Thackeray Maharashtra Samruddhi Mahamarg interchange. Exceptional connectivity for warehouses, hotels, or educational institutions.',
      propertyType: 'PLOT',
      listingType: 'SALE',
      bhk: null,
      areaOriginal: 2,
      areaUnit: 'ACRE',
      priceTotal: 48000000,
      city: 'Nagpur',
      locality: 'Butibori MIDC',
      address: 'NH-44 Junction, Near Samruddhi Connector, Butibori, Nagpur 441122',
      latitude: 20.9234,
      longitude: 79.0123,
      ownerId: builderUser.id,
      ownerRole: 'BUILDER',
      contactPhone: '+919822033333',
      hidePhoneUntilLogin: true,
      hideSelectedImagesUntilLogin: false,
      availability: 'IMMEDIATE',
      furnishing: 'UNFURNISHED',
      images: [plotImages[1], plotImages[2]],
      amenities: ['Direct Highway Access', 'HT Power Line', 'Borewell', 'Fencing Done'],
    },

    // Wardha Properties
    {
      title: 'Bapu Kuti Greens - 3 BHK Independent Bungalow in Sevagram',
      description: 'Eco-friendly peaceful bungalow constructed with local exposed brick and Mangalore clay tiles, surrounded by fruit orchards. Located just 3 km from historic Sevagram Ashram and MGIMS Hospital. Solar electrified.',
      propertyType: 'BUNGALOW',
      listingType: 'SALE',
      bhk: 3,
      areaOriginal: 2200,
      areaUnit: 'SQFT',
      priceTotal: 7200000,
      city: 'Wardha',
      locality: 'Sevagram Road',
      address: 'Bapu Kuti Enclave, Sevagram Road, Wardha, Maharashtra 442102',
      latitude: 20.7321,
      longitude: 78.6123,
      ownerId: sellerUser.id,
      ownerRole: 'SELLER',
      contactPhone: '+919822044444',
      hidePhoneUntilLogin: true,
      hideSelectedImagesUntilLogin: false,
      availability: 'IMMEDIATE',
      furnishing: 'SEMI_FURNISHED',
      images: [bungalowImages[2], bungalowImages[3], bungalowImages[0]],
      amenities: ['Solar Power System', 'Organic Kitchen Garden', 'Rainwater Harvesting', 'Spacious Veranda'],
    },
    {
      title: 'Anand Nagar 2 BHK Flat near Bachelor Road',
      description: 'Ready-to-move 2 BHK flat in heart of Wardha city. Walking distance to markets, nationalized banks, and railway station. Excellent ventilation, 2 modern bathrooms, and lift with battery backup.',
      propertyType: 'FLAT',
      listingType: 'SALE',
      bhk: 2,
      areaOriginal: 980,
      areaUnit: 'SQFT',
      priceTotal: 3400000,
      city: 'Wardha',
      locality: 'Bachelor Road',
      address: 'Near Gandhi City Hospital, Bachelor Road, Wardha 442001',
      latitude: 20.7456,
      longitude: 78.5987,
      ownerId: brokerUser.id,
      ownerRole: 'BROKER',
      contactPhone: '+919822022222',
      hidePhoneUntilLogin: true,
      hideSelectedImagesUntilLogin: false,
      availability: 'IMMEDIATE',
      furnishing: 'UNFURNISHED',
      images: [apartmentImages[1], apartmentImages[0]],
      amenities: ['Lift with Backup', '24h Water Supply', 'Covered Parking', 'Security Guard'],
    },
    {
      title: 'Prime 1.5 Guntha NA Residential Plot in Nalwadi',
      description: 'Collector NA residential plot in Nalwadi, Wardha. Surrounded by newly built residences and government employee colonies. Bank loan approved from SBI and Bank of Maharashtra with zero hassle.',
      propertyType: 'PLOT',
      listingType: 'SALE',
      bhk: null,
      areaOriginal: 1.5,
      areaUnit: 'GUNTHA',
      priceTotal: 1850000,
      city: 'Wardha',
      locality: 'Nalwadi',
      address: 'Plot No. 42, Sai Nagar, Nalwadi, Wardha 442001',
      latitude: 20.7612,
      longitude: 78.5834,
      ownerId: sellerUser.id,
      ownerRole: 'SELLER',
      contactPhone: '+919822044444',
      hidePhoneUntilLogin: false,
      hideSelectedImagesUntilLogin: false,
      availability: 'IMMEDIATE',
      furnishing: 'UNFURNISHED',
      images: [plotImages[0], plotImages[2]],
      amenities: ['Collector NA Order', 'Demarcated Stones', 'Electricity Pole', 'Water Pipeline'],
    },
    {
      title: 'Spacious 2 BHK Family Home for Rent in Master Colony',
      description: 'Peaceful ground-floor residential house with separate entrance, car parking, and front veranda in high-demand Master Colony, Wardha. Near modern English schools.',
      propertyType: 'BUNGALOW',
      listingType: 'RENT',
      bhk: 2,
      areaOriginal: 1200,
      areaUnit: 'SQFT',
      priceTotal: 14000, // Monthly rent
      city: 'Wardha',
      locality: 'Master Colony',
      address: 'Near Shivaji Chowk, Master Colony, Wardha 442001',
      latitude: 20.7401,
      longitude: 78.6012,
      ownerId: sellerUser.id,
      ownerRole: 'SELLER',
      contactPhone: '+919822044444',
      hidePhoneUntilLogin: false,
      hideSelectedImagesUntilLogin: false,
      availability: 'IMMEDIATE',
      furnishing: 'SEMI_FURNISHED',
      images: [bungalowImages[0], bungalowImages[1]],
      amenities: ['Private Courtyard', 'Continuous Water', 'Car Parking'],
    },
    {
      title: 'Orchard Agro Farm Plot near Kelzar Samruddhi Node',
      description: 'Scenic 1-acre agricultural and farmhouse plot situated close to historical Kelzar Ganpati temple and Samruddhi Expressway interchange. Fertile black cotton soil with over 80 existing Orange and Teak trees.',
      propertyType: 'PLOT',
      listingType: 'SALE',
      bhk: null,
      areaOriginal: 1,
      areaUnit: 'ACRE',
      priceTotal: 3600000,
      city: 'Wardha',
      locality: 'Kelzar / Seloo',
      address: 'Nagpur-Wardha Road, Kelzar, Wardha 442104',
      latitude: 20.8123,
      longitude: 78.7234,
      ownerId: brokerUser.id,
      ownerRole: 'BROKER',
      contactPhone: '+919822022222',
      hidePhoneUntilLogin: true,
      hideSelectedImagesUntilLogin: false,
      availability: 'IMMEDIATE',
      furnishing: 'UNFURNISHED',
      images: [plotImages[1], plotImages[0]],
      amenities: ['Perennial Well Water', 'Orange Orchard', 'Farmhouse Permissible', 'Motorable Road'],
    },
    {
      title: 'Royal Palms 3 BHK Modern Row Villa in Borgaon Meghe',
      description: 'Contemporary European-design row villa close to DMIMS Datta Meghe medical university campus. High rental yield potential for medical students and senior faculty. Premium CP fittings and modular kitchen.',
      propertyType: 'VILLA',
      listingType: 'SALE',
      bhk: 3,
      areaOriginal: 1950,
      areaUnit: 'SQFT',
      priceTotal: 6500000,
      city: 'Wardha',
      locality: 'Borgaon Meghe',
      address: 'Sawangi Road, Borgaon Meghe, Wardha 442001',
      latitude: 20.7189,
      longitude: 78.5721,
      ownerId: builderUser.id,
      ownerRole: 'BUILDER',
      contactPhone: '+919822033333',
      hidePhoneUntilLogin: true,
      hideSelectedImagesUntilLogin: true,
      availability: 'IMMEDIATE',
      furnishing: 'SEMI_FURNISHED',
      images: [villaImages[2], villaImages[3], villaImages[4]],
      amenities: ['Gated Campus', 'Intercom', 'Landscaped Entrance', 'Reserved Parking', 'Solar Streetlights'],
    },
  ];

  // Generate additional variations to guarantee 30+ comprehensive listings
  const allPropertiesData = [...propertyTemplates];
  let idCounter = 1;

  while (allPropertiesData.length < 32) {
    const base = propertyTemplates[idCounter % propertyTemplates.length];
    const isRental = idCounter % 4 === 0;
    const isWardha = idCounter % 2 === 0;
    const locality = isWardha
      ? ['Sawangi Meghe', 'Arvi Naka', 'Bachelor Road', 'Sevagram'][idCounter % 4]
      : ['Besa Road', 'Somalwada', 'Civil Lines', 'Dharampeth', 'Trimurti Nagar'][idCounter % 5];
    const city = isWardha ? 'Wardha' : 'Nagpur';

    const price = isRental
      ? 15000 + (idCounter % 5) * 5000
      : base.priceTotal * (0.8 + (idCounter % 5) * 0.1);

    allPropertiesData.push({
      ...base,
      title: `${base.propertyType} - Phase ${idCounter + 1} at ${locality}`,
      description: `Verified high-value ${base.propertyType.toLowerCase()} located in ${locality}, ${city}. Clear legal title with all utility connections verified by Bhoomi Realty team.`,
      listingType: isRental ? 'RENT' : 'SALE',
      priceTotal: Math.round(price),
      city,
      locality,
      address: `Scheme ${idCounter + 10}, ${locality}, ${city}, Maharashtra`,
      latitude: base.latitude + (idCounter * 0.003 - 0.01),
      longitude: base.longitude + (idCounter * 0.004 - 0.01),
    });
    idCounter++;
  }

  // Insert properties into database
  for (const item of allPropertiesData) {
    // Convert to sqft
    let areaSqFt = item.areaOriginal;
    if (item.areaUnit === 'GUNTHA') areaSqFt = Math.round(item.areaOriginal * 1089);
    else if (item.areaUnit === 'ACRE') areaSqFt = Math.round(item.areaOriginal * 43560);
    else if (item.areaUnit === 'SQM') areaSqFt = Math.round(item.areaOriginal * 10.7639);

    const pricePerSqFt = areaSqFt > 0 ? Math.round(item.priceTotal / areaSqFt) : 0;

    await prisma.property.create({
      data: {
        title: item.title,
        description: item.description,
        propertyType: item.propertyType,
        listingType: item.listingType,
        bhk: item.bhk,
        areaOriginal: item.areaOriginal,
        areaUnit: item.areaUnit,
        areaSqFt,
        priceTotal: item.priceTotal,
        pricePerSqFt,
        city: item.city,
        locality: item.locality,
        address: item.address,
        latitude: item.latitude,
        longitude: item.longitude,
        status: 'PUBLISHED',
        moderationStatus: 'APPROVED',
        ownerId: item.ownerId,
        ownerRole: item.ownerRole,
        contactPhone: item.contactPhone,
        hidePhoneUntilLogin: item.hidePhoneUntilLogin,
        hideSelectedImagesUntilLogin: item.hideSelectedImagesUntilLogin,
        availability: item.availability,
        furnishing: item.furnishing,
        amenities: {
          create: item.amenities.map((name) => ({ name })),
        },
        media: {
          create: item.images.map((url, idx) => ({
            url,
            mediaType: 'IMAGE',
            isLocked: idx >= 2, // 3rd and subsequent images locked for guest gating
            displayOrder: idx,
            caption: `View of ${item.title} #${idx + 1}`,
          })),
        },
      },
    });
  }

  console.log(`Successfully seeded ${allPropertiesData.length} rich listings in Nagpur and Wardha.`);

  // 4. Create sample Inquiries and Closed Deal with Encrypted Aadhaar & PAN for KYC demonstration
  const firstProperty = await prisma.property.findFirst({
    where: { city: 'Nagpur', propertyType: 'FLAT' },
  });

  if (firstProperty) {
    const inquiry = await prisma.inquiry.create({
      data: {
        propertyId: firstProperty.id,
        buyerId: buyerUser.id,
        name: buyerUser.name,
        mobile: buyerUser.mobile,
        email: buyerUser.email,
        message: 'I am interested in scheduling a site visit this Saturday. Please share the exact floor plan.',
        status: 'CONTACTED',
      },
    });

    const closedDeal = await prisma.deal.create({
      data: {
        propertyId: firstProperty.id,
        buyerId: buyerUser.id,
        sellerId: firstProperty.ownerId,
        brokerId: brokerUser.id,
        stage: 'CLOSED',
        agreedPrice: firstProperty.priceTotal - 200000,
        closedAt: new Date(),
        notes: 'Deal finalized after mutual inspection. Token advance paid.',
      },
    });

    // Encrypt Aadhaar & PAN with AES-256-GCM
    const rawAadhaar = '548291038472';
    const encryptedAadhaar = encryptData(rawAadhaar, ENCRYPTION_KEY);
    const rawPan = 'ABCDE8921F';
    const encryptedPan = encryptData(rawPan, ENCRYPTION_KEY);

    await prisma.kycDocument.create({
      data: {
        dealId: closedDeal.id,
        userId: buyerUser.id,
        docType: 'AADHAAR',
        encryptedDocNumber: encryptedAadhaar,
        maskedNumber: 'XXXX-XXXX-8472',
        verifiedBy: adminUser.id,
        verifiedAt: new Date(),
      },
    });

    await prisma.kycDocument.create({
      data: {
        dealId: closedDeal.id,
        userId: buyerUser.id,
        docType: 'PAN',
        encryptedDocNumber: encryptedPan,
        maskedNumber: 'ABCDE****F',
        verifiedBy: adminUser.id,
        verifiedAt: new Date(),
      },
    });

    // Seed audit log entry for KYC registration
    await prisma.auditLog.create({
      data: {
        actorId: adminUser.id,
        action: 'DECRYPTED_KYC_VERIFIED',
        targetEntity: 'Deal',
        targetId: closedDeal.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Seed-Script/1.0',
        details: JSON.stringify({ verifiedDeal: closedDeal.id, buyer: buyerUser.name }),
      },
    });

    console.log('Created sample inquiry, closed deal, and encrypted KYC documents.');
  }

  // 5. Seed Lender records
  const lenders = [
    {
      id: 'sbi-home-loans',
      name: 'State Bank of India (SBI)',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/SBI-logo.svg',
      baseRate: 8.35,
      minTenureYears: 5,
      maxTenureYears: 30,
      maxLtvPercent: 90,
      processingFeePercent: 0.35,
    },
    {
      id: 'hdfc-bank',
      name: 'HDFC Bank',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/28/HDFC_Bank_Logo.svg',
      baseRate: 8.5,
      minTenureYears: 5,
      maxTenureYears: 30,
      maxLtvPercent: 85,
      processingFeePercent: 0.5,
    },
    {
      id: 'bank-of-maharashtra',
      name: 'Bank of Maharashtra (Maha Super)',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Bank_of_Maharashtra_logo.png',
      baseRate: 8.3,
      minTenureYears: 3,
      maxTenureYears: 30,
      maxLtvPercent: 90,
      processingFeePercent: 0.25,
    },
  ];

  for (const lender of lenders) {
    await prisma.lender.upsert({
      where: { id: lender.id },
      update: lender,
      create: lender,
    });
  }

  console.log('Seeded partner financial institutions.');
  console.log('✅ Seed complete! All demo data loaded successfully.');
}

main()
  .catch((e) => {
    console.error('Seed execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
