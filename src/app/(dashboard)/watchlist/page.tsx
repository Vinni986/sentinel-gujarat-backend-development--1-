import { db } from '@/db';
import { watchlist, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Plus, AlertCircle } from 'lucide-react';
import { formatDateTime, getSeverityColor, formatRegistrationNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getWatchlist() {
  return await db
    .select({
      id: watchlist.id,
      registrationNumber: watchlist.registrationNumber,
      reason: watchlist.reason,
      severity: watchlist.severity,
      caseReference: watchlist.caseReference,
      isActive: watchlist.isActive,
      createdAt: watchlist.createdAt,
      addedByName: users.name,
    })
    .from(watchlist)
    .leftJoin(users, eq(watchlist.addedBy, users.id))
    .where(eq(watchlist.isActive, true))
    .orderBy(watchlist.createdAt);
}

export default async function WatchlistPage() {
  const watchlistItems = await getWatchlist();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Watchlist</h1>
          <p className="text-sm text-slate-600 mt-1">
            Vehicles under surveillance
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          Add Vehicle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-600">Total</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{watchlistItems.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-600">Critical</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {watchlistItems.filter(w => w.severity === 'critical').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-600">High</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {watchlistItems.filter(w => w.severity === 'high').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-600">Medium/Low</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {watchlistItems.filter(w => w.severity === 'medium' || w.severity === 'low').length}
          </p>
        </div>
      </div>

      {/* Watchlist Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Registration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Case Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Added By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Added On
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {watchlistItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-slate-400" />
                    <p className="mt-2 text-sm text-slate-600">No vehicles in watchlist</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Add vehicles to monitor for real-time alerts
                    </p>
                  </td>
                </tr>
              ) : (
                watchlistItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <span className="font-mono font-medium text-slate-900">
                        {formatRegistrationNumber(item.registrationNumber)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-900 max-w-md truncate">{item.reason}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${getSeverityColor(item.severity)}`}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {item.caseReference || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-900">{item.addedByName || 'Unknown'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
