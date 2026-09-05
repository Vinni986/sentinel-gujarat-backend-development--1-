import { db } from '@/db';
import { cameras } from '@/db/schema';
import { Video, MapPin, Clock } from 'lucide-react';
import { formatRelativeTime, getStatusColor } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getCameras() {
  return await db.select().from(cameras).orderBy(cameras.cameraId);
}

export default async function CamerasPage() {
  const cameraList = await getCameras();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Camera Registry</h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage and monitor CCTV camera network
          </p>
        </div>
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Add Camera
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-600">Total Cameras</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{cameraList.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-600">Online</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {cameraList.filter(c => c.status === 'online').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-600">Offline</p>
          <p className="text-2xl font-bold text-slate-400 mt-1">
            {cameraList.filter(c => c.status === 'offline').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-600">Maintenance</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {cameraList.filter(c => c.status === 'maintenance').length}
          </p>
        </div>
      </div>

      {/* Camera List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Camera ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Area
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Last Seen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {cameraList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Video className="mx-auto h-12 w-12 text-slate-400" />
                    <p className="mt-2 text-sm text-slate-600">No cameras found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Add cameras manually or import from CSV
                    </p>
                  </td>
                </tr>
              ) : (
                cameraList.map((camera) => (
                  <tr key={camera.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-slate-900">{camera.cameraId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4" />
                        {camera.location}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-900">{camera.area}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(camera.status)}`}>
                        {camera.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 uppercase">{camera.streamType}</span>
                    </td>
                    <td className="px-6 py-4">
                      {camera.lastSeen ? (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="h-4 w-4" />
                          {formatRelativeTime(camera.lastSeen)}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Never</span>
                      )}
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
