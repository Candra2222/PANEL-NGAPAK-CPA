import { error } from "@/lib/api";
import { requireSession } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function sse(event, data) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function GET(request) {
  const { session } = await requireSession("monitor");
  if (!session) return error("Belum login.", 401);

  const supabase = supabaseAdmin();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {}
      };

      const channel = supabase
        .channel("monitor-live")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "traffic_logs" }, (payload) => {
          if (!closed) {
            controller.enqueue(sse("traffic", payload.new));
          }
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversions" }, (payload) => {
          if (!closed) {
            controller.enqueue(sse("conversion", payload.new));
          }
        })
        .subscribe((status) => {
          if (!closed) {
            controller.enqueue(sse("status", { status }));
          }
        });

      const heartbeat = setInterval(() => {
        if (!closed) {
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch {
            close();
          }
        }
      }, 25000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        supabase.removeChannel(channel);
        close();
      });
    },
    cancel() {
      // Supabase cleanup handled via abort listener.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
