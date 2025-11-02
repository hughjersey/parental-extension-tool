<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WatchEvent extends Model
{
    protected $fillable = [
        'device_id',
        'video_id',
        'video_title',
        'channel_name',
        'channel_id',
        'video_url',
        'duration_seconds',
        'watch_duration_seconds',
        'watched_at',
        'thumbnail_url',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'watched_at' => 'datetime',
            'metadata' => 'array',
            'duration_seconds' => 'integer',
            'watch_duration_seconds' => 'integer',
        ];
    }

    /**
     * Get the device that logged this watch event.
     */
    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    /**
     * Get the user through the device relationship.
     */
    public function user(): BelongsTo
    {
        return $this->device->user();
    }
}
