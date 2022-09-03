import { gql, useQuery } from "urql";

const HelloQuery = gql`
  query {
    hello
  }
`;

export default function Home() {
  const [result] = useQuery({
    query: HelloQuery,
  });

  const { data, fetching, error } = result;
  if (fetching) return <p>Loading...</p>;
  if (error) return <p>Oh no... {error.message}</p>;

  return <div>{data.hello}</div>;
}
