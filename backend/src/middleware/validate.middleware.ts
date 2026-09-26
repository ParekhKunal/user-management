import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

type RequestPart = "body" | "query" | "params";

export function validate(schema: ZodType, part: RequestPart = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.parse(req[part]);
    if (part === "query") {
      Object.defineProperty(req, "query", {
        value: parsed,
        writable: true,
        configurable: true,
      });
    } else {
      req[part] = parsed as never;
    }
    next();
  };
}
