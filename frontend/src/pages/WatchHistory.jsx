import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { watchEvents } from '../services/api';

export default function WatchHistory() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async (page = 1) => {
    setLoading(true);
    try {
      const response = await watchEvents.list({ page, search });
      setEvents(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        total: response.data.total,
      });
    } catch (error) {
      console.error('Failed to fetch watch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents(1);
  };

  if (loading && !events.length) {
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
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Watch History</h1>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search videos or channels..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Search
            </button>
          </div>
        </form>

        {/* Events List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {events.length > 0 ? (
              events.map((event) => (
                <li key={event.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    {event.thumbnail_url && (
                      <img
                        src={event.thumbnail_url}
                        alt={event.video_title}
                        className="h-20 w-32 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <a
                        href={event.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-900 truncate block"
                      >
                        {event.video_title || 'Untitled Video'}
                      </a>
                      <p className="text-sm text-gray-500 truncate">{event.channel_name || 'Unknown Channel'}</p>
                      <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                        <span>{new Date(event.watched_at).toLocaleString()}</span>
                        {event.watch_duration_seconds && (
                          <span>{Math.floor(event.watch_duration_seconds / 60)}m {event.watch_duration_seconds % 60}s</span>
                        )}
                        <span className="px-2 py-1 bg-gray-100 rounded">{event.device?.name || 'Unknown Device'}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-8 text-center text-gray-500">
                {search ? 'No results found' : 'No watch history yet'}
              </li>
            )}
          </ul>
        </div>

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-md">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => fetchEvents(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => fetchEvents(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{pagination.current_page}</span> of{' '}
                  <span className="font-medium">{pagination.last_page}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {[...Array(pagination.last_page)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => fetchEvents(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pagination.current_page === i + 1
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
