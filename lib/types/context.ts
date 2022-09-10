import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

export interface Context {
  prisma: PrismaClient;
  userId?: string;
  req: NextApiRequest;
  res: NextApiResponse;
}
