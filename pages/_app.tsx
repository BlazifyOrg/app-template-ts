import { CacheProvider, EmotionCache } from "@emotion/react";
import { authExchange } from "@urql/exchange-auth";
import { withUrqlClient } from "next-urql";
import App, { AppProps } from "next/app";
import {
  AnyVariables,
  cacheExchange,
  CombinedError,
  dedupExchange,
  errorExchange,
  fetchExchange,
  gql,
  makeOperation,
  Operation,
} from "urql";
import Head from "next/head";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createEmotionCache } from "../lib/front/cache";
import { theme } from "../lib/front/theme";
import { Copyright } from "../lib/components/copyright";

const clientSideEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

function MyApp(props: MyAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  let X = Component as any;
  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <X {...pageProps} />
        <Copyright />
      </ThemeProvider>
    </CacheProvider>
  );
}

const logout = () => localStorage.clear();

const addAuthToOperation = ({ authState, operation }: any) => {
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
  return error.graphQLErrors.some((e) => e.extensions?.code === "FORBIDDEN");
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

  if (result.data?.refreshLogin) {
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

export default withUrqlClient((ssrExchange) => ({
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
    authExchange({ addAuthToOperation, getAuth, didAuthError, willAuthError }),
    fetchExchange,
  ],
}))(MyApp);
