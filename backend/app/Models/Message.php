<?php

namespace App\Models;

use Database\Factories\MessageFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['role', 'content'])]

class Message extends Model
{
    /** @use HasFactory<MessageFactory> */
    use HasFactory;

    // Get the Conversation associated with the message
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }
}
