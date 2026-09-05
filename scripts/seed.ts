import 'dotenv/config';
import { db } from '../src/db';
import { cameras, users, watchlist } from '../src/db/schema';
import { createDemoUser, hashPassword } from '../src/lib/auth';
import { generateCameraId } from '../src/lib/utils';

// Gujarat major cities and their coordinates
const gujaratLocations = [
  { city: 'Ahmedabad', baseLatitude: 23.0225, baseLongitude: 72.5714 },
  { city: 'Surat', baseLatitude: 21.1702, baseLongitude: 72.8311 },
  { city: 'Vadodara', baseLatitude: 22.3072, baseLongitude: 73.1812 },
  { city: 'Rajkot', baseLatitude: 22.3039, baseLongitude: 70.8022 },
  { city: 'Gandhinagar', baseLatitude: 23.2156, baseLongitude: 72.6369 },
  { city: 'Bhavnagar', baseLatitude: 21.7645, baseLongitude: 72.1519 },
  { city: 'Jamnagar', baseLatitude: 22.4707, baseLongitude: 70.0577 },
  { city: 'Junagadh', baseLatitude: 21.5222, baseLongitude: 70.4579 },
];

const locations = [
  'Ring Road Junction',
  'SG Highway',
  'CG Road Circle',
  'Railway Station',
  'Bus Terminal',
  'Airport Road',
  'City Mall',
  'Municipal Office',
  'Stadium Area',
  'Market Circle',
  'Police Station',
  'Court Complex',
  'Hospital Road',
  'College Road',
  'Industrial Area',
  'Residential Area',
];

function randomCoordinate(base: number, range: number = 0.05): string {
  return (base + (Math.random() - 0.5) * range).toFixed(7);
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  console.log('🌱 Seeding database...\n');

  // 1. Create demo user
  console.log('Creating demo user...');
  await createDemoUser();
  console.log('✓ Demo user created: admin@sentinel.gov.in / admin123\n');

  // 2. Generate 50 cameras
  console.log('Generating 50 synthetic cameras...');
  const cameraData = [];
  
  for (let i = 1; i <= 50; i++) {
    const location = randomElement(gujaratLocations);
    const spot = randomElement(locations);
    
    // Distribute cameras across different statuses
    let status: 'online' | 'offline' | 'maintenance' | 'error';
    const rand = Math.random();
    if (rand < 0.75) status = 'online';
    else if (rand < 0.85) status = 'offline';
    else if (rand < 0.95) status = 'maintenance';
    else status = 'error';

    const camera = {
      cameraId: generateCameraId(i),
      name: `${location.city} - ${spot}`,
      location: `${spot}, ${location.city}, Gujarat`,
      latitude: randomCoordinate(location.baseLatitude),
      longitude: randomCoordinate(location.baseLongitude),
      area: location.city,
      status,
      streamType: randomElement(['rtsp', 'onvif', 'file']),
      isActive: true,
      lastSeen: status === 'online' ? new Date() : null,
      metadata: {
        vendor: randomElement(['Hikvision', 'Dahua', 'CP Plus', 'Honeywell']),
        model: `CAM-${Math.floor(Math.random() * 9000) + 1000}`,
        resolution: randomElement(['1080p', '4K', '720p']),
        fps: randomElement([15, 25, 30]),
      },
    };

    cameraData.push(camera);
  }

  await db.insert(cameras).values(cameraData);
  console.log(`✓ ${cameraData.length} cameras created\n`);

  // 3. Create sample watchlist entries
  console.log('Creating sample watchlist...');
  const demoUser = await createDemoUser();
  
  const watchlistData = [
    {
      registrationNumber: 'GJ01AB1234',
      reason: 'Suspected involvement in theft case #2024/156',
      severity: 'high' as const,
      caseReference: 'FIR-2024-156',
      addedBy: demoUser.id,
      isActive: true,
    },
    {
      registrationNumber: 'GJ05XY9876',
      reason: 'Wanted in hit and run incident',
      severity: 'critical' as const,
      caseReference: 'FIR-2024-289',
      addedBy: demoUser.id,
      isActive: true,
    },
    {
      registrationNumber: 'GJ12PQ5678',
      reason: 'Vehicle reported stolen',
      severity: 'high' as const,
      caseReference: 'FIR-2024-312',
      addedBy: demoUser.id,
      isActive: true,
    },
    {
      registrationNumber: 'MH02CD4321',
      reason: 'Border crossing alert - suspicious activity',
      severity: 'medium' as const,
      caseReference: 'BC-2024-045',
      addedBy: demoUser.id,
      isActive: true,
    },
  ];

  await db.insert(watchlist).values(watchlistData);
  console.log(`✓ ${watchlistData.length} watchlist entries created\n`);

  console.log('✅ Database seeding complete!\n');
  console.log('Summary:');
  console.log(`  - 1 demo user`);
  console.log(`  - 50 cameras (${cameraData.filter(c => c.status === 'online').length} online)`);
  console.log(`  - 4 watchlist vehicles`);
  console.log('\nYou can now log in with:');
  console.log('  Email: admin@sentinel.gov.in');
  console.log('  Password: admin123');
}

seed()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error seeding database:');
    console.error(error);
    process.exit(1);
  });
