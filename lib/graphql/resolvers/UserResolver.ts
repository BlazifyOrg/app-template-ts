import { hash, verify } from "argon2";
import { verify as ve } from "jsonwebtoken";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { User } from "../../typegraphql";
import type { Context } from "../../types/context";
import { GraphQLError } from "../../types/errors";
import { Payload } from "../../types/payload";
import { Token } from "../../types/token";
import { createAccessToken, createRefreshToken } from "../../utils/jwt";
import { snowflake } from "../../utils/snowflake";
import { Auth } from "../middlewares/Auth";

@Resolver()
export class UserResolver {
  @UseMiddleware(Auth)
  @Query(() => User)
  async me(@Ctx() { userId, prisma }: Context) {
    const user = await prisma.user.findUnique({ where: { id: userId! } });

    if (!user) throw new GraphQLError("user", "No user found!");
    return user;
  }

  @UseMiddleware(Auth)
  @Mutation(() => User)
  async editProfile(
    @Ctx() { userId, prisma }: Context,
    @Arg("username", () => String, { nullable: true }) username?: string
  ) {
    return await prisma.user.update({
      where: { id: userId },
      data: { username },
    });
  }

  @UseMiddleware(Auth)
  @Mutation(() => Boolean)
  async logout(@Ctx() { userId, prisma }: Context) {
    const user = await prisma.user.findUnique({ where: { id: userId! } });

    if (!user) throw new GraphQLError("user", "No user found!");
    await prisma.user.update({
      where: { id: user.id },
      data: { jwt_version: user.jwt_version + 1 },
    });
    return true;
  }

  @Mutation(() => User)
  async register(
    @Ctx() { prisma }: Context,
    @Arg("username", () => String) username: string,
    @Arg("password", () => String) password: string,
    @Arg("email", () => String) email: string
  ) {
    const user = await prisma.user.findFirst({ where: { email } });

    if (user) throw new GraphQLError("email", "User already exists");
    if (username.includes("@"))
      throw new GraphQLError("username", "Cannot contain '@'");
    if (username.length < 3)
      throw new GraphQLError("username", "Must be greater than 3");
    if (!email.includes("@"))
      throw new GraphQLError("email", "Invalid Email address");
    if (password.length < 8)
      throw new GraphQLError("password", "Too small password");

    return await prisma.user.create({
      data: {
        id: snowflake(),
        username,
        password: await hash(password),
        email,
      },
    });
  }

  @Mutation(() => Token)
  async login(
    @Arg("email", () => String) email: string,
    @Arg("password", () => String) password: string,
    @Ctx() { prisma }: Context
  ): Promise<Token> {
    const user = await prisma.user.findFirst({ where: { email } });

    if (!user) throw new GraphQLError("email", "Invalid Email");
    const { bot, id, jwt_version: v } = user;
    if (bot) throw new GraphQLError("email", "Bots cannot login");
    const correct = await verify(user.password, password);
    if (!correct) throw new GraphQLError("password", "Incorrect password");

    return {
      token: createAccessToken({ bot, id, v }),
      refreshToken: createRefreshToken({ bot, id, v }),
    };
  }

  @Mutation(() => Token)
  async refresh(
    @Arg("token", () => String) refresh_token: string,
    @Ctx() { prisma }: Context
  ): Promise<Token> {
    const { bot, id, v } = ve(
      refresh_token,
      process.env.JWT_REFRESH_TOKEN_SECRET!
    ) as Payload;
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) throw new GraphQLError("user", "No user found");
    if (user.jwt_version !== v)
      throw new GraphQLError("user", "Not authenticate");
    if (bot) throw new GraphQLError("user", "Bots cannot login");

    return {
      token: createAccessToken({ bot, id, v }),
      refreshToken: createRefreshToken({ bot, id, v }),
    };
  }
}
