<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Device extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'device_uuid',
        'browser_type',
        'browser_version',
        'os',
        'activated_at',
        'last_seen_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'activated_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the user that owns the device.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the watch events for the device.
     */
    public function watchEvents(): HasMany
    {
        return $this->hasMany(WatchEvent::class);
    }

    /**
     * Get the activation code used for this device.
     */
    public function activationCode(): HasOne
    {
        return $this->hasOne(ActivationCode::class);
    }
}
