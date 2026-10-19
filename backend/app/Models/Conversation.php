<?php

namespace App\Models;

use Database\Factories\ConversationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[UseFactory(ConversationFactory::class)]

#[Fillable(['title'])]

class Conversation extends Model
{
    // Get the Messages associated with the conversation
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    // Get the User associated with the conversation
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
