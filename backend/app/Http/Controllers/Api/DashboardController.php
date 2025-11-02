<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\WatchEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics
     */
    public function stats(Request $request)
    {
        $userId = $request->user()->id;

        // Get date range (default: last 7 days)
        $from = $request->get('from', now()->subDays(7));
        $to = $request->get('to', now());

        // Total devices
        $totalDevices = Device::where('user_id', $userId)->count();
        $activeDevices = Device::where('user_id', $userId)
            ->where('is_active', true)
            ->count();

        // Total watch events
        $totalWatchEvents = WatchEvent::whereHas('device', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        })->count();

        // Watch events in date range
        $watchEventsInRange = WatchEvent::whereHas('device', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        })
            ->whereBetween('watched_at', [$from, $to])
            ->count();

        // Total watch time (in seconds)
        $totalWatchTime = WatchEvent::whereHas('device', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        })
            ->whereBetween('watched_at', [$from, $to])
            ->sum('watch_duration_seconds');

        // Most watched channels
        $topChannels = WatchEvent::whereHas('device', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        })
            ->whereBetween('watched_at', [$from, $to])
            ->whereNotNull('channel_name')
            ->select('channel_name', 'channel_id', DB::raw('COUNT(*) as watch_count'))
            ->groupBy('channel_name', 'channel_id')
            ->orderBy('watch_count', 'desc')
            ->limit(10)
            ->get();

        // Watch events by day (last 7 days)
        $watchEventsByDay = WatchEvent::whereHas('device', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        })
            ->whereBetween('watched_at', [$from, $to])
            ->select(DB::raw('DATE(watched_at) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        // Recent watch events
        $recentEvents = WatchEvent::whereHas('device', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        })
            ->with('device')
            ->orderBy('watched_at', 'desc')
            ->limit(10)
            ->get();

        // Device activity
        $deviceActivity = Device::where('user_id', $userId)
            ->where('is_active', true)
            ->withCount(['watchEvents' => function ($q) use ($from, $to) {
                $q->whereBetween('watched_at', [$from, $to]);
            }])
            ->orderBy('last_seen_at', 'desc')
            ->get();

        return response()->json([
            'stats' => [
                'total_devices' => $totalDevices,
                'active_devices' => $activeDevices,
                'total_watch_events' => $totalWatchEvents,
                'watch_events_in_range' => $watchEventsInRange,
                'total_watch_time_seconds' => $totalWatchTime,
                'total_watch_time_hours' => round($totalWatchTime / 3600, 2),
            ],
            'top_channels' => $topChannels,
            'watch_events_by_day' => $watchEventsByDay,
            'recent_events' => $recentEvents,
            'device_activity' => $deviceActivity,
            'date_range' => [
                'from' => $from,
                'to' => $to,
            ],
        ]);
    }

    /**
     * Get overview data for the dashboard
     */
    public function overview(Request $request)
    {
        $userId = $request->user()->id;

        $devices = Device::where('user_id', $userId)
            ->withCount('watchEvents')
            ->orderBy('last_seen_at', 'desc')
            ->get();

        $recentWatchEvents = WatchEvent::whereHas('device', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        })
            ->with('device')
            ->orderBy('watched_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'devices' => $devices,
            'recent_watch_events' => $recentWatchEvents,
        ]);
    }
}
