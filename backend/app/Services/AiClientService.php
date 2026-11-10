<?php

namespace App\Services;

use App\Exceptions\FailedAiResponse;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class AiClientService
{
    /**
     * Send the conversation history to the AI provider and return its reply.
     *
     * @param  array<int, array{role: string, content: string}>  $messages
     * @return array{content: string, input_tokens: int|null, output_tokens: int|null}
     *
     * @throws FailedAiResponse
     */
    public function sendMessage(array $messages): array
    {
        try {
            $response = Http::timeout(config('services.openai.timeout'))->withToken(config('services.openai.api_key'))->withHeaders([
                'Content-Type' => 'application/json',
            ])->post('https://api.openai.com/v1/responses', [
                'model' => config('services.openai.model'),
                'instructions' => 'You are a helpful assistant that can answer questions and help with tasks.',
                'input' => $messages,
                'max_output_tokens' => (int) config('services.openai.max_output_tokens'),
            ]);
        } catch (ConnectionException $e) {
            throw new FailedAiResponse(
                message: 'Failed to send message to AI',
                internalMessage: 'Connection error: '.$e->getMessage(),
            );
        }

        if ($response->failed()) {
            throw new FailedAiResponse(
                message: 'Failed to send message to AI',
                internalMessage: 'Provider Returned: '.$response->status().' '.$response->body(),
            );
        }

        $data = $response->json();

        $content = data_get(
            collect(data_get($data, 'output'))->firstWhere('type', 'message'),
            'content.0.text'
        );

        if (is_null($content)) {
            throw new FailedAiResponse(
                message: 'Failed to get content from AI',
                internalMessage: 'Provider Returned response with no message content: '.json_encode($data),
            );
        }

        return [
            'content' => $content,
            'input_tokens' => data_get($data, 'usage.input_tokens'),
            'output_tokens' => data_get($data, 'usage.output_tokens'),
        ];
    }
}
