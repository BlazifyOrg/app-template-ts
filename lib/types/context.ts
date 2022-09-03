import { PrismaClient } from "@prisma/client";
import { MicroRequest } from "apollo-server-micro/dist/types";
import { ServerResponse } from "http";

export interface Context {
  prisma: PrismaClient;
  userId?: string;
  req: MicroRequest;
  res: ServerResponse;
}
