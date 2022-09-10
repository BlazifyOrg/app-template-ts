import { authExchange } from "@urql/exchange-auth";
import { withUrqlClient, WithUrqlClientOptions } from "next-urql";
import {
  dedupExchange,
  cacheExchange,
  errorExchange,
  fetchExchange,
  AnyVariables,
  CombinedError,
  gql,
  makeOperation,
  Operation,
} from "urql";

const logout = () => localStorage.clear();
const isBrowser = typeof window !== "undefined";

const addAuthToOperation = ({ authState, operation }: any) => {
  if (!isBrowser) return operation;
  if (!authState || !authState.token) {
    return operation;
  }

  const fetchOptions =
    typeof operation.context.fetchOptions === "function"
      ? operation.context.fetchOptions()
      : operation.context.fetchOptions || {};

  return makeOperation(operation.kind, operation, {
    ...operation.context,
    fetchOptions: {
      ...fetchOptions,
      headers: {
        ...fetchOptions.headers,
        Authorization: `Bearer ${authState.token}`,
      },
    },
  });
};

const didAuthError = ({ error }: { error: CombinedError; authState: any }) => {
  return error.graphQLErrors.some(
    (e) => e.extensions?.code === "INTERNAL_SERVER_ERROR"
  );
};

const getAuth = async ({ authState, mutate }: any) => {
  const refreshMutation = gql`
    mutation Refresh($token: String!) {
      refresh(token: $token) {
        token
        refreshToken
      }
    }
  `;
  if (!isBrowser) return null;
  if (!authState) {
    const token = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refreshToken");
    if (token && refreshToken) {
      return { token, refreshToken };
    }
    return null;
  }

  const result = await mutate(refreshMutation, {
    token: authState!.refreshToken,
  });

  if (result.data?.refresh) {
    localStorage.setItem("token", result.data.refresh.token);
    localStorage.setItem("refreshToken", result.data.refresh.refreshToken);

    return {
      token: result.data.refresh.token,
      refreshToken: result.data.refresh.refreshToken,
    };
  }

  localStorage.clear();
  logout();

  return null;
};

const willAuthError = ({
  operation,
  authState,
}: {
  authState: any;
  operation: Operation<any, AnyVariables>;
}) => {
  if (!isBrowser) return false;
  if (!authState) {
    return !(
      operation.kind === "mutation" &&
      operation.query.definitions.some((definition) => {
        return (
          definition.kind === "OperationDefinition" &&
          definition.selectionSet.selections.some((node) => {
            return node.kind === "Field" && node.name.value === "login";
          })
        );
      })
    );
  }

  return false;
};

export const withUrql = (options?: WithUrqlClientOptions) =>
  withUrqlClient(
    (ssrExchange) => ({
      url: "http://localhost:3000/api/graphql",
      exchanges: [
        dedupExchange,
        cacheExchange,
        ssrExchange,
        errorExchange({
          onError: (error) => {
            const isAuthError = error.graphQLErrors.some(
              (e) => e.extensions?.code === "FORBIDDEN"
            );

            if (isAuthError) {
              logout();
            }
          },
        }),
        authExchange({
          addAuthToOperation,
          getAuth,
          didAuthError,
          willAuthError,
        }),
        fetchExchange,
      ],
    }),
    options
  );
