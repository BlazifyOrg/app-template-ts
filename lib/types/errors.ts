export class GraphQLError extends Error {
  constructor(name: string, message: string) {
    super(JSON.stringify({ name, message }));
  }
}
