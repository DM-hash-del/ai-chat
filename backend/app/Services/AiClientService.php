<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Exceptions\FailedAiResponse;

class AiClientService
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function sendMessage(array $messages)
    {
        // send message to ai
        try {
            $response = Http::timeout(15)->withToken(config('services.openai.api_key'))->withHeaders([
                'Content-Type' => 'application/json',
            ])->post('https://api.openai.com/v1/responses', [
                'model' => config('services.openai.model'),
                'instructions' => 'You are a helpful assistant that can answer questions and help with tasks.',
                'input' => $messages,
                'max_output_tokens' => config('services.openai.max_output_tokens'),
            ]);
            
            if ($response->failed()) {
                throw new FailedAiResponse(
                    message: 'Failed to send message to AI',
                    internalMessage: 'Provider Returned: ' . $response->status() . ' ' . $response->body(),
                );
            };
        } catch (\Exception $e) {
            // For a timeout exception, we want to throw a more user friendly error
            throw new FailedAiResponse(
                message: 'Failed to send message to AI',
                internalMessage: 'Provider Returned: ' . $e->getMessage(),
            );
        }

        $data = $response->json();

        // Check if the response has a message content
        $content = data_get(
            collect(data_get($data, 'output'))->firstWhere('type', 'message'),
            'content.0.text'
        );
        if (is_null($content)) {
            throw new FailedAiResponse(
                message: 'Failed to get content from AI',
                internalMessage: 'Provider Returned response with no message content: ' . $data,
            );
        };

        return [
            'content' => data_get(
                collect(data_get($data, 'output'))->firstWhere('type', 'message'),
                'content.0.text'
            ),
            'input_tokens' => data_get($data, 'usage.input_tokens'),
            'output_tokens' => data_get($data, 'usage.output_tokens'),
        ];
    }
}
