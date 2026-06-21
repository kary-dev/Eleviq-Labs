export async function GET() {
  return Response.json({
    hasAuthSecret: !!process.env.AUTH_SECRET,
    secretLength: process.env.AUTH_SECRET?.length ?? 0,
    secretFirst4: process.env.AUTH_SECRET?.slice(0, 4) ?? "none",
  });
}
