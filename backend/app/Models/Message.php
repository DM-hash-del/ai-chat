<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['role', 'content'])]

class Message extends Model
{
    // Get the Conversation associated with the message
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }
}
