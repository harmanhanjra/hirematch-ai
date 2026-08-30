const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

export function hasNvidiaKey(): boolean {
  return Boolean(process.env.NVIDIA_API_KEY);
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Calls the NVIDIA NIM API (OpenAI-compatible chat completions).
 * Falls back to a stub response if no API key is configured.
 */
export async function chat(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return stubChat(messages);
  }

  try {
    const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.NVIDIA_MODEL || "nvidia/nemotron-3-nano-30b-a3b",
        messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 1024,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("NVIDIA API error", res.status, errText);
      return stubChat(messages);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "";
  } catch (err) {
    console.error("NVIDIA API call failed", err);
    return stubChat(messages);
  }
}

function stubChat(messages: ChatMessage[]): string {
  const last = [...messages].reverse().find((m) => m.role === "user");
  const text = last?.content ?? "";
  return [
    `# Assistant response (offline demo mode)`,
    ``,
    `You asked: "${text.slice(0, 200)}${text.length > 200 ? "..." : ""}"`,
    ``,
    `AI services are running in offline stub mode because no \`NVIDIA_API_KEY\` was provided.`,
    `Add a key to \`.env.local\` to enable live NVIDIA NIM responses.`,
  ].join("\n");
}
