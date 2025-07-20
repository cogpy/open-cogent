import type { UserFriendlyError } from '@afk/error';
import {
  addContextCategoryMutation,
  addContextDocMutation,
  addContextFileMutation,
  cleanupCopilotSessionMutation,
  createCopilotContextMutation,
  createCopilotMessageMutation,
  createCopilotSessionMutation,
  getCopilotHistoriesQuery,
  getCopilotHistoryIdsQuery,
  getCopilotRecentSessionsQuery,
  getCopilotSessionQuery,
  getCopilotSessionsQuery,
  type GraphQLQuery,
  listContextObjectQuery,
  listContextQuery,
  matchContextQuery,
  type PaginationInput,
  type QueryOptions,
  type QueryResponse,
  removeContextCategoryMutation,
  removeContextDocMutation,
  removeContextFileMutation,
  type RequestOptions,
  updateCopilotSessionMutation,
} from '@afk/graphql';

import {
  GeneralNetworkError,
  PaymentRequiredError,
  UnauthorizedError,
} from './error';

export enum Endpoint {
  Stream = 'stream',
  StreamObject = 'stream-object',
  Workflow = 'workflow',
  Images = 'images',
}

type OptionsField<T extends GraphQLQuery> =
  RequestOptions<T>['variables'] extends { options: infer U } ? U : never;

function codeToError(error: UserFriendlyError) {
  switch (error.status) {
    case 401:
      return new UnauthorizedError();
    case 402:
      return new PaymentRequiredError();
    default:
      return new GeneralNetworkError(
        error.code
          ? `${error.code}: ${error.message}\nIdentify: ${error.name}`
          : error.message
      );
  }
}

export function resolveError(err: any) {
  return codeToError(err);
}

export class CopilotClient {
  constructor(
    readonly gql: <Query extends GraphQLQuery>(
      options: QueryOptions<Query>
    ) => Promise<QueryResponse<Query>>,
    readonly fetcher: (input: string, init?: RequestInit) => Promise<Response>,
    readonly eventSource: (
      url: string,
      eventSourceInitDict?: EventSourceInit
    ) => EventSource
  ) {}

  async createSession(
    options: OptionsField<typeof createCopilotSessionMutation>
  ) {
    try {
      const res = await this.gql({
        query: createCopilotSessionMutation,
        variables: {
          options,
        },
      });
      return res.createCopilotSession;
    } catch (err) {
      throw resolveError(err);
    }
  }

  async updateSession(
    options: OptionsField<typeof updateCopilotSessionMutation>
  ) {
    try {
      const res = await this.gql({
        query: updateCopilotSessionMutation,
        variables: {
          options,
        },
      });
      return res.updateCopilotSession;
    } catch (err) {
      throw resolveError(err);
    }
  }

  async createMessage(
    options: OptionsField<typeof createCopilotMessageMutation>
  ) {
    try {
      const res = await this.gql({
        query: createCopilotMessageMutation,
        variables: {
          options,
        },
      });
      return res.createCopilotMessage;
    } catch (err) {
      throw resolveError(err);
    }
  }

  async getSession(workspaceId: string, sessionId: string) {
    try {
      const res = await this.gql({
        query: getCopilotSessionQuery,
        variables: { workspaceId, sessionId },
      });
      return res.currentUser?.copilot?.chats?.edges?.[0]?.node;
    } catch (err) {
      throw resolveError(err);
    }
  }

  async getSessions(
    workspaceId: string,
    pagination: PaginationInput,
    docId?: string,
    options?: RequestOptions<
      typeof getCopilotSessionsQuery
    >['variables']['options'],
    signal?: AbortSignal
  ) {
    try {
      const res = await this.gql({
        query: getCopilotSessionsQuery,
        variables: {
          workspaceId,
          pagination,
          docId,
          options,
        },
        signal,
      });
      return res.currentUser?.copilot?.chats.edges.map(e => e.node);
    } catch (err) {
      throw resolveError(err);
    }
  }

  async getRecentSessions(
    workspaceId: string,
    limit?: number,
    offset?: number
  ) {
    try {
      const res = await this.gql({
        query: getCopilotRecentSessionsQuery,
        variables: {
          workspaceId,
          limit,
          offset,
        },
      });
      return res.currentUser?.copilot?.chats.edges.map(e => e.node);
    } catch (err) {
      throw resolveError(err);
    }
  }

  async getHistories(
    workspaceId: string,
    pagination: PaginationInput,
    docId?: string,
    options?: RequestOptions<
      typeof getCopilotHistoriesQuery
    >['variables']['options']
  ) {
    try {
      const res = await this.gql({
        query: getCopilotHistoriesQuery,
        variables: {
          workspaceId,
          pagination,
          docId,
          options,
        },
      });

      return res.currentUser?.copilot?.chats.edges.map(e => e.node);
    } catch (err) {
      throw resolveError(err);
    }
  }

  async getHistoryIds(
    workspaceId: string,
    pagination: PaginationInput,
    docId?: string,
    options?: RequestOptions<
      typeof getCopilotHistoryIdsQuery
    >['variables']['options']
  ) {
    try {
      const res = await this.gql({
        query: getCopilotHistoryIdsQuery,
        variables: {
          workspaceId,
          pagination,
          docId,
          options,
        },
      });

      return res.currentUser?.copilot?.chats.edges.map(e => e.node);
    } catch (err) {
      throw resolveError(err);
    }
  }

  async cleanupSessions(input: {
    workspaceId: string;
    docId: string;
    sessionIds: string[];
  }) {
    try {
      const res = await this.gql({
        query: cleanupCopilotSessionMutation,
        variables: {
          input,
        },
      });
      return res.cleanupCopilotSession;
    } catch (err) {
      throw resolveError(err);
    }
  }

  async createContext(workspaceId: string, sessionId: string) {
    const res = await this.gql({
      query: createCopilotContextMutation,
      variables: {
        workspaceId,
        sessionId,
      },
    });
    return res.createCopilotContext;
  }

  async getContextId(workspaceId: string, sessionId: string) {
    const res = await this.gql({
      query: listContextQuery,
      variables: {
        workspaceId,
        sessionId,
      },
    });
    return res.currentUser?.copilot?.contexts?.[0]?.id || undefined;
  }

  async addContextDoc(options: OptionsField<typeof addContextDocMutation>) {
    const res = await this.gql({
      query: addContextDocMutation,
      variables: {
        options,
      },
    });
    return res.addContextDoc;
  }

  async removeContextDoc(
    options: OptionsField<typeof removeContextDocMutation>
  ) {
    const res = await this.gql({
      query: removeContextDocMutation,
      variables: {
        options,
      },
    });
    return res.removeContextDoc;
  }

  async addContextFile(
    content: File,
    options: OptionsField<typeof addContextFileMutation>
  ) {
    const res = await this.gql({
      query: addContextFileMutation,
      variables: {
        content,
        options,
      },
      timeout: 60000,
    });
    return res.addContextFile;
  }

  async removeContextFile(
    options: OptionsField<typeof removeContextFileMutation>
  ) {
    const res = await this.gql({
      query: removeContextFileMutation,
      variables: {
        options,
      },
    });
    return res.removeContextFile;
  }

  async addContextCategory(
    options: OptionsField<typeof addContextCategoryMutation>
  ) {
    const res = await this.gql({
      query: addContextCategoryMutation,
      variables: {
        options,
      },
    });
    return res.addContextCategory;
  }

  async removeContextCategory(
    options: OptionsField<typeof removeContextCategoryMutation>
  ) {
    const res = await this.gql({
      query: removeContextCategoryMutation,
      variables: {
        options,
      },
    });
    return res.removeContextCategory;
  }

  async getContextDocsAndFiles(
    workspaceId: string,
    sessionId: string,
    contextId: string
  ) {
    const res = await this.gql({
      query: listContextObjectQuery,
      variables: {
        workspaceId,
        sessionId,
        contextId,
      },
    });
    return res.currentUser?.copilot?.contexts?.[0];
  }

  async matchContext(
    content: string,
    contextId?: string,
    workspaceId?: string,
    limit?: number,
    scopedThreshold?: number,
    threshold?: number
  ) {
    const res = await this.gql({
      query: matchContextQuery,
      variables: {
        content,
        contextId,
        workspaceId,
        limit,
        scopedThreshold,
        threshold,
      },
    });
    const { matchFiles: files, matchWorkspaceDocs: docs } =
      res.currentUser?.copilot?.contexts?.[0] || {};
    return { files, docs };
  }

  async chatText({
    sessionId,
    messageId,
    reasoning,
    webSearch,
    modelId,
    signal,
  }: {
    sessionId: string;
    messageId?: string;
    reasoning?: boolean;
    webSearch?: boolean;
    modelId?: string;
    signal?: AbortSignal;
  }) {
    let url = `/api/copilot/chat/${sessionId}`;
    const queryString = this.paramsToQueryString({
      messageId,
      reasoning,
      webSearch,
      modelId,
    });
    if (queryString) {
      url += `?${queryString}`;
    }
    const response = await this.fetcher(url.toString(), { signal });
    return response.text();
  }

  // Text or image to text
  chatTextStream(
    {
      sessionId,
      messageId,
      reasoning,
      webSearch,
      modelId,
    }: {
      sessionId: string;
      messageId?: string;
      reasoning?: boolean;
      webSearch?: boolean;
      modelId?: string;
    },
    endpoint = Endpoint.Stream
  ) {
    let url = `/api/copilot/chat/${sessionId}/${endpoint}`;
    const queryString = this.paramsToQueryString({
      messageId,
      reasoning,
      webSearch,
      modelId,
    });
    if (queryString) {
      url += `?${queryString}`;
    }
    return this.eventSource(url);
  }

  // Text or image to images
  imagesStream(
    sessionId: string,
    messageId?: string,
    seed?: string,
    endpoint = Endpoint.Images
  ) {
    let url = `/api/copilot/chat/${sessionId}/${endpoint}`;
    const queryString = this.paramsToQueryString({
      messageId,
      seed,
    });
    if (queryString) {
      url += `?${queryString}`;
    }
    return this.eventSource(url);
  }

  paramsToQueryString(params: Record<string, string | boolean | undefined>) {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        if (value) {
          queryString.append(key, 'true');
        }
      } else if (typeof value === 'string') {
        queryString.append(key, value);
      }
    });
    return queryString.toString();
  }
}
