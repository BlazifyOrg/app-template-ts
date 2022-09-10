import { gql, useQuery } from "urql";
import { withUrql } from "../lib/front/withUrql";

const MeQuery = gql`
  query {
    me {
      id
      username
    }
  }
`;

function Home() {
  const [result] = useQuery({
    query: MeQuery,
  });

  const { data, fetching, error } = result;
  if (fetching) return <p>Loading...</p>;
  if (error) return <p>Oh no... {error.message}</p>;

  return <div>{JSON.stringify(data.me, null, 4)}</div>;
}

export default withUrql()(Home);
