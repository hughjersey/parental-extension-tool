<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('watch_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained()->onDelete('cascade');
            $table->string('video_id');
            $table->string('video_title')->nullable();
            $table->string('channel_name')->nullable();
            $table->string('channel_id')->nullable();
            $table->string('video_url');
            $table->integer('duration_seconds')->nullable();
            $table->integer('watch_duration_seconds')->nullable();
            $table->timestamp('watched_at');
            $table->text('thumbnail_url')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['device_id', 'watched_at']);
            $table->index('watched_at');
            $table->index('video_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('watch_events');
    }
};
