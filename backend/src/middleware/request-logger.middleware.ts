import type { NextFunction, Request, Response } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const started = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - started;
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? "error" : "info",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl.split("?")[0],
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
    });
    if (res.statusCode >= 500) {
      console.error(line);
    } else {
      console.log(line);
    }
  });
  next();
}
