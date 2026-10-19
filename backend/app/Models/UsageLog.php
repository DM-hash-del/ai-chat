<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['input_tokens', 'output_tokens', 'model'])]

class UsageLog extends Model
{
    const UPDATED_AT = null; // Disable the updated_at timestamp

    // Get the User associated with the usage log
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
