import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class Token {
  @Field()
  access_token!: string;

  @Field()
  refresh_token!: string;
}
