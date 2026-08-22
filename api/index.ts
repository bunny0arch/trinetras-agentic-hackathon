import { createApp } from "../server/_core/index";

const app = createApp();

export default function handler(req: any, res: any) {
  const sourcePath = typeof req.query?.path === "string" ? req.query.path : "";
  const query = new URL(req.url ?? "/", "http://vercel.local").searchParams;
  query.delete("path");
  const normalizedPath = sourcePath ? `/${sourcePath.replace(/^\/+/, "")}` : "/";
  const search = query.toString();
  req.url = search ? `${normalizedPath}?${search}` : normalizedPath;
  return app(req, res);
}
