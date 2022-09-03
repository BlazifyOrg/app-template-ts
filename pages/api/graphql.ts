import "reflect-metadata";
import { ApolloServer } from "apollo-server-micro";
import { buildSchema } from "type-graphql";
import type { PageConfig } from "next";
import { UserResolver } from "../../lib/graphql/resolvers/UserResolver";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { PrismaClient } from "@prisma/client";
import { Context } from "../../lib/types/context";
import { MicroRequest } from "apollo-server-micro/dist/types";
import { ServerResponse } from "http";

export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
};

const prisma = new PrismaClient();

const apolloServer = new ApolloServer({
  schema: await buildSchema({
    resolvers: [UserResolver],
  }),
  cache: "bounded",
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  introspection: true,
  context: (req: MicroRequest, res: ServerResponse): Context => ({
    req,
    res,
    prisma,
  }),
});

await apolloServer.start();

export default apolloServer.createHandler({ path: "/api/graphql" });
