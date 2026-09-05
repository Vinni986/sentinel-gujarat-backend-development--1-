import { db } from '@/db';
import { cameras, vehicleDetections, alerts, watchlist } from '@/db/schema';
import { sql, eq, and, gte } from 'drizzle-orm';
import { Video, Car, AlertTriangle, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getDashboardStats() {
  // Get camera stats
  const [cameraStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      online: sql<number>`count(*) filter (where status = 'online')::int`,
      offline: sql<number>`count(*) filter (where status = 'offline')::int`,
    })
    .from(cameras);

  // Get 24h detection count
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [detectionStats] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(vehicleDetections)
    .where(gte(vehicleDetections.detectionTime, twentyFourHoursAgo));

  // Get active alerts count
  const [alertStats] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(alerts)
    .where(eq(alerts.isAcknowledged, false));

  // Get watchlist count
  const [watchlistStats] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(watchlist)
    .where(eq(watchlist.isActive, true));

  return {
    cameras: cameraStats || { total: 0, online: 0, offline: 0 },
    detections: detectionStats?.count || 0,
    alerts: alertStats?.count || 0,
    watchlist: watchlistStats?.count || 0,
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Command Center</h1>
        <p className="text-sm text-slate-600 mt-1">
          Real-time surveillance and vehicle intelligence overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Camera Status */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Camera Network</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.cameras.total}</p>
              <p className="text-sm text-slate-500 mt-1">
                <span className="text-green-600 font-medium">{stats.cameras.online} online</span>
                {' · '}
                <span className="text-slate-400">{stats.cameras.offline} offline</span>
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <Video className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Detections (24h) */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Detections (24h)</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {stats.detections.toLocaleString()}
              </p>
              <p className="text-sm text-green-600 font-medium mt-1">+12% from yesterday</p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <Car className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Alerts</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.alerts}</p>
              <p className="text-sm text-slate-500 mt-1">Requires attention</p>
            </div>
            <div className="rounded-full bg-red-100 p-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Watchlist */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Watchlist Vehicles</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.watchlist}</p>
              <p className="text-sm text-slate-500 mt-1">Under surveillance</p>
            </div>
            <div className="rounded-full bg-yellow-100 p-3">
              <Eye className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-sm">
              <div className="rounded-full bg-green-100 p-2 mt-0.5">
                <Car className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-slate-900 font-medium">Vehicle detected at CAM-012</p>
                <p className="text-slate-500">GJ 01 AB 1234 · 2 minutes ago</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 text-sm">
              <div className="rounded-full bg-red-100 p-2 mt-0.5">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-slate-900 font-medium">Watchlist match alert</p>
                <p className="text-slate-500">GJ 05 XY 9876 · 15 minutes ago</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <div className="rounded-full bg-blue-100 p-2 mt-0.5">
                <Video className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-slate-900 font-medium">Camera CAM-045 back online</p>
                <p className="text-slate-500">Ahmedabad East · 1 hour ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">System Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">AI Processing</span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Database</span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Healthy
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Stream Processing</span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Alert System</span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Running
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Demo Mode:</strong> This dashboard is displaying synthetic data for development. 
          Connect government camera feeds to enable live surveillance.
        </p>
      </div>
    </div>
  );
}
