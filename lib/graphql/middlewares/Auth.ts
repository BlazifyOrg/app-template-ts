import { Context } from "../../types/context";
import { MiddlewareFn } from "type-graphql";
import { GraphQLError } from "../../types/errors";
import { verify } from "jsonwebtoken";
import { Payload } from "../../types/payload";

export const Auth: MiddlewareFn<Context> = async ({ context }, next) => {
  try {
    const { authorization } = context.req.headers as NodeJS.Dict<string>;
    if (!authorization)
      throw new GraphQLError("authorization", "Not authenticated");
    const [type, token] = authorization.split(" ");

    const { bot, id, v } = verify(
      token,
      process.env.JWT_ACCESS_TOKEN_SECRET!
    ) as Payload;
    let user = await context.prisma.user.findUnique({ where: { id } });
    if (!user) throw new GraphQLError("user", "No user found");
    if (user.jwt_version !== v)
      throw new GraphQLError("user", "Not authenticate");
    if (type === "bearer" && !bot) {
      context.userId = id;
      return next();
    } else {
      throw new GraphQLError(
        "authorization",
        "Only user agents are allowed. Bots aren't functional"
      );
    }
  } catch (e: any) {
    throw new GraphQLError(e.name, e.message);
  }
};
