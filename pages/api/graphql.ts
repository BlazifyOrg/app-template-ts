import "reflect-metadata";
import { ApolloServer } from "apollo-server-micro";
import { buildSchema } from "type-graphql";
import type { NextApiRequest, NextApiResponse, PageConfig } from "next";
import { UserResolver } from "../../lib/graphql/resolvers/UserResolver";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { prisma } from "../../lib/utils/db";
import { Context } from "../../lib/types/context";

export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
};

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver],
    }),
    cache: "bounded",
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
    introspection: true,
    context: (): Context => ({
      req,
      res,
      prisma,
    }),
  });

  await apolloServer.start();
  return await apolloServer.createHandler({ path: "/api/graphql" })(req, res);
}
