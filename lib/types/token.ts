import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class Token {
  @Field()
  token!: string;

  @Field()
  refreshToken!: string;
}
