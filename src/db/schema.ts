import { pgTable, text, timestamp, integer, boolean, decimal, jsonb, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enable PostGIS extension (run manually first time):
// CREATE EXTENSION IF NOT EXISTS postgis;

// ============================================
// USERS - Authentication and access control
// ============================================
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('viewer'), // admin, control_room, investigator, viewer
  isActive: boolean('is_active').notNull().default(true),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================
// CAMERAS - CCTV camera registry
// ============================================
export const cameras = pgTable('cameras', {
  id: uuid('id').defaultRandom().primaryKey(),
  cameraId: varchar('camera_id', { length: 100 }).notNull().unique(), // e.g., CAM-001
  name: varchar('name', { length: 255 }).notNull(),
  location: text('location').notNull(), // Address/description
  latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
  area: varchar('area', { length: 255 }).notNull(), // City/district
  status: varchar('status', { length: 50 }).notNull().default('offline'), // online, offline, maintenance, error
  streamType: varchar('stream_type', { length: 50 }).notNull().default('rtsp'), // rtsp, onvif, file, http
  isActive: boolean('is_active').notNull().default(true),
  lastSeen: timestamp('last_seen'),
  metadata: jsonb('metadata'), // Additional camera info
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================
// CAMERA SOURCES - Connection details
// ============================================
export const cameraSources = pgTable('camera_sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  cameraId: uuid('camera_id').notNull().references(() => cameras.id, { onDelete: 'cascade' }),
  sourceUrl: text('source_url').notNull(), // RTSP URL or file path
  username: varchar('username', { length: 255 }),
  password: text('password'), // Encrypted in production
  protocol: varchar('protocol', { length: 50 }).notNull().default('rtsp'),
  port: integer('port'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================
// VEHICLE DETECTIONS - Raw YOLO detections
// ============================================
export const vehicleDetections = pgTable('vehicle_detections', {
  id: uuid('id').defaultRandom().primaryKey(),
  cameraId: uuid('camera_id').notNull().references(() => cameras.id),
  detectionTime: timestamp('detection_time').notNull().defaultNow(),
  vehicleType: varchar('vehicle_type', { length: 50 }).notNull(), // car, truck, bus, motorcycle, etc.
  confidence: decimal('confidence', { precision: 5, scale: 4 }).notNull(), // 0.0000 to 1.0000
  boundingBox: jsonb('bounding_box').notNull(), // {x, y, width, height}
  frameNumber: integer('frame_number'),
  imagePath: text('image_path'), // Path to saved detection image
  thumbnailPath: text('thumbnail_path'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  metadata: jsonb('metadata'), // Additional detection data
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================
// NUMBER PLATE DETECTIONS - OCR results
// ============================================
export const numberPlateDetections = pgTable('number_plate_detections', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleDetectionId: uuid('vehicle_detection_id').notNull().references(() => vehicleDetections.id, { onDelete: 'cascade' }),
  plateNumber: varchar('plate_number', { length: 20 }).notNull(), // Raw OCR output
  plateNumberNormalized: varchar('plate_number_normalized', { length: 20 }).notNull(), // Cleaned format
  confidence: decimal('confidence', { precision: 5, scale: 4 }).notNull(),
  boundingBox: jsonb('bounding_box'), // Plate bounding box within vehicle
  ocrText: text('ocr_text'), // Full OCR output
  imagePath: text('image_path'), // Cropped plate image
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================
// VEHICLES - Unique vehicle profiles
// ============================================
export const vehicles = pgTable('vehicles', {
  id: uuid('id').defaultRandom().primaryKey(),
  registrationNumber: varchar('registration_number', { length: 20 }).notNull().unique(),
  vehicleType: varchar('vehicle_type', { length: 50 }),
  firstSeenAt: timestamp('first_seen_at').notNull(),
  lastSeenAt: timestamp('last_seen_at').notNull(),
  totalDetections: integer('total_detections').notNull().default(0),
  metadata: jsonb('metadata'), // Owner info if available from govt API
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================
// WATCHLIST - Vehicles of interest
// ============================================
export const watchlist = pgTable('watchlist', {
  id: uuid('id').defaultRandom().primaryKey(),
  registrationNumber: varchar('registration_number', { length: 20 }).notNull(),
  reason: text('reason').notNull(),
  severity: varchar('severity', { length: 50 }).notNull().default('medium'), // low, medium, high, critical
  caseReference: varchar('case_reference', { length: 100 }),
  addedBy: uuid('added_by').notNull().references(() => users.id),
  isActive: boolean('is_active').notNull().default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================
// ALERTS - Real-time notifications
// ============================================
export const alerts = pgTable('alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  watchlistId: uuid('watchlist_id').notNull().references(() => watchlist.id),
  vehicleDetectionId: uuid('vehicle_detection_id').notNull().references(() => vehicleDetections.id),
  plateDetectionId: uuid('plate_detection_id').references(() => numberPlateDetections.id),
  cameraId: uuid('camera_id').notNull().references(() => cameras.id),
  registrationNumber: varchar('registration_number', { length: 20 }).notNull(),
  severity: varchar('severity', { length: 50 }).notNull(),
  alertTime: timestamp('alert_time').notNull().defaultNow(),
  isAcknowledged: boolean('is_acknowledged').notNull().default(false),
  acknowledgedBy: uuid('acknowledged_by').references(() => users.id),
  acknowledgedAt: timestamp('acknowledged_at'),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================
// EVIDENCE - Saved images/videos
// ============================================
export const evidence = pgTable('evidence', {
  id: uuid('id').defaultRandom().primaryKey(),
  detectionId: uuid('detection_id').notNull().references(() => vehicleDetections.id, { onDelete: 'cascade' }),
  evidenceType: varchar('evidence_type', { length: 50 }).notNull(), // image, video, snapshot
  filePath: text('file_path').notNull(),
  thumbnailPath: text('thumbnail_path'),
  fileSize: integer('file_size'), // bytes
  duration: integer('duration'), // seconds (for video)
  capturedAt: timestamp('captured_at').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================
// AUDIT LOGS - System activity tracking
// ============================================
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(), // login, search_vehicle, add_watchlist, etc.
  resourceType: varchar('resource_type', { length: 50 }), // camera, vehicle, watchlist, etc.
  resourceId: varchar('resource_id', { length: 100 }),
  details: jsonb('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================
// TYPE EXPORTS
// ============================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Camera = typeof cameras.$inferSelect;
export type NewCamera = typeof cameras.$inferInsert;
export type CameraSource = typeof cameraSources.$inferSelect;
export type NewCameraSource = typeof cameraSources.$inferInsert;
export type VehicleDetection = typeof vehicleDetections.$inferSelect;
export type NewVehicleDetection = typeof vehicleDetections.$inferInsert;
export type NumberPlateDetection = typeof numberPlateDetections.$inferSelect;
export type NewNumberPlateDetection = typeof numberPlateDetections.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type Watchlist = typeof watchlist.$inferSelect;
export type NewWatchlist = typeof watchlist.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
export type Evidence = typeof evidence.$inferSelect;
export type NewEvidence = typeof evidence.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
