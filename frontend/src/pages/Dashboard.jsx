import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { dashboard } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboard.stats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Devices</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats?.stats?.total_devices || 0}</dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Devices</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats?.stats?.active_devices || 0}</dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Watch Events</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats?.stats?.total_watch_events || 0}</dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Watch Time</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats?.stats?.total_watch_time_hours || 0}h</dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Watch Events</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {stats?.recent_events?.length > 0 ? (
              stats.recent_events.map((event) => (
                <li key={event.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-indigo-600 truncate">{event.video_title || 'Untitled Video'}</p>
                      <p className="text-sm text-gray-500">{event.channel_name || 'Unknown Channel'}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(event.watched_at).toLocaleString()}</p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {event.device?.name || 'Unknown Device'}
                      </span>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-4 sm:px-6 text-center text-gray-500">No watch events yet</li>
            )}
          </ul>
        </div>
      </div>
    </Layout>
  );
}
