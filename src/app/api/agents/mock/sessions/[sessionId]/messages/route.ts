// src/app/api/agents/mock/sessions/[sessionId]/messages/route.ts
// Mock que implementa POST /sessions/{id}/messages del RehabStack Agent API Spec.
// Devuelve un SSE stream con una respuesta simulada token por token.

const MOCK_RESPONSE = `Hello! I'm the **Content Engine** running in demo mode.

Here's what I can help you with:

- **Instagram content packages** tailored to your practice specialty
- **VA briefs** so your virtual assistant can handle content creation
- **Testimonial requests** that feel natural to send to patients
- **Social media strategies** built around your clinical expertise

What would you like to work on today?`;

export async function POST() {
  const encoder = new TextEncoder();

  // Divide la respuesta en tokens (palabras + espacios) para el efecto streaming
  const tokens = MOCK_RESPONSE.match(/\S+\s*/g) ?? [];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const token of tokens) {
        // Delay entre tokens para simular velocidad de generación real
        await new Promise((resolve) => setTimeout(resolve, 25));
        const event = JSON.stringify({ type: "token", content: token });
        controller.enqueue(encoder.encode(`data: ${event}\n\n`));
      }
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
