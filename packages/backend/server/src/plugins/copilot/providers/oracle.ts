import { Injectable, Logger } from '@nestjs/common';
import type { TextStreamPart } from 'ai';
import {
  AuthenticationDetailsProvider,
  composeRequest,
  ConfigFileReader,
  DefaultRequestSigner,
  FetchHttpClient,
  handleErrorBody,
  Realm,
  Region,
  RegionProvider,
  SimpleAuthenticationDetailsProvider,
} from 'oci-common';
import { checkNotNull } from 'oci-common/lib/utils';
import { GenerativeAiInferenceClient } from 'oci-generativeaiinference';

import { CopilotProviderNotSupported, metrics } from '../../../base';
import type { CustomAITools } from '../tools';
import { CopilotProvider } from './provider';
import type {
  CopilotChatOptions,
  CopilotProviderModel,
  ModelConditions,
  PromptMessage,
} from './types';
import { CopilotProviderType, ModelInputType, ModelOutputType } from './types';
import { chatToGPTMessage, TextStreamParser } from './utils';

export type OracleConfig = {
  endpoint?: string; // e.g. https://inference.generativeai.<region>.oci.oraclecloud.com
  compartmentId?: string; // OCID
  config?: {
    user: string;
    fingerprint: string;
    tenancy: string;
    region: string;
  };
  privateKey?: string;
};

type OracleChatMessage = {
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: Array<{ type: 'TEXT'; text: string }>;
};

type OracleChatRequest = {
  chatDetails: {
    compartmentId: string;
    servingMode: {
      servingType: 'ON_DEMAND';
      modelId: string;
    };
    chatRequest: {
      messages: OracleChatMessage[];
      apiFormat: 'GENERIC';
      maxTokens?: number;
      temperature?: number;
      topK?: number;
      topP?: number;
    };
  };
};

// Minimal stream part that TextStreamParser understands
type OracleStreamChunk = TextStreamPart<CustomAITools>;

const MODELS_MAP: Record<string, string> = {
  grok4:
    'ocid1.generativeaimodel.oc1.us-chicago-1.amaaaaaask7dceya3bsfz4ogiuv3yc7gcnlry7gi3zzx6tnikg6jltqszm2q',
};

@Injectable()
export class OracleProvider extends CopilotProvider<OracleConfig> {
  readonly type = CopilotProviderType.Oracle;

  readonly models: CopilotProviderModel[] = [
    {
      id: 'grok4',
      capabilities: [
        {
          input: [ModelInputType.Text],
          output: [ModelOutputType.Text],
          defaultForOutputType: true,
        },
      ],
    },
  ];

  #instance!: GenerativeAiInferenceClient;

  configured(): boolean {
    const { endpoint, compartmentId, config, privateKey } = this.config;
    return !!(endpoint && compartmentId && config && privateKey);
  }

  protected override setup() {
    super.setup();
    if (this.configured()) {
      const { config, endpoint, privateKey } = this.config;
      const provider = SessionAuthDetailProvider.init(config!, privateKey!);
      const client = new GenerativeAiInferenceClient({
        authenticationDetailsProvider: provider,
      });
      client.endpoint = endpoint!;
      this.#instance = client;
    }
  }

  async text(
    _cond: ModelConditions,
    _messages: PromptMessage[],
    _options: CopilotChatOptions = {}
  ): Promise<string> {
    throw new CopilotProviderNotSupported({
      provider: this.type,
      kind: 'text',
    });
  }

  async *streamText(
    cond: ModelConditions,
    messages: PromptMessage[],
    options: CopilotChatOptions = {}
  ): AsyncIterable<string> {
    const fullCond = { ...cond, outputType: ModelOutputType.Text } as const;
    await this.checkParams({ messages, cond: fullCond, options });
    const model = this.selectModel(fullCond);
    const textParser = new TextStreamParser(model.id);

    metrics.ai.counter('chat_text_stream_calls').add(1, { model: model.id });

    try {
      const { fullStream } = await this.getOracleStream(
        model.id,
        messages,
        options
      );
      for await (const chunk of fullStream) {
        // Only text deltas supported for now
        if (chunk.type === 'text-delta') {
          const out = textParser.parse(chunk);
          if (out) yield out;
        }
        if (options.signal?.aborted) {
          break;
        }
      }
      await textParser.handleFinish();
    } catch (e: any) {
      metrics.ai.counter('chat_text_stream_errors').add(1, { model: model.id });
      textParser.handleError();
      throw e;
    }
  }

  // ===== Implementation details =====

  private async getOracleStream(
    modelId: string,
    messages: PromptMessage[],
    options: CopilotChatOptions
  ): Promise<{ fullStream: AsyncIterable<OracleStreamChunk> }> {
    const [system, gptMsgs] = await chatToGPTMessage(messages, false);

    // Build Oracle request payload
    const toRole = (role: 'user' | 'assistant'): 'USER' | 'ASSISTANT' =>
      role === 'user' ? 'USER' : 'ASSISTANT';
    const oracleMsgs: OracleChatMessage[] = [];
    if (system?.trim()) {
      oracleMsgs.push({
        role: 'SYSTEM',
        content: [{ type: 'TEXT', text: system }],
      });
    }
    for (const m of gptMsgs) {
      // Only text is supported in this MVP
      const contentText = typeof m.content === 'string' ? m.content : '';
      oracleMsgs.push({
        role: toRole(m.role as 'user' | 'assistant'),
        content: [{ type: 'TEXT', text: contentText }],
      });
    }

    const safeOptions = options || {};
    const req: OracleChatRequest = {
      chatDetails: {
        compartmentId: this.config.compartmentId!,
        servingMode: {
          servingType: 'ON_DEMAND',
          modelId: MODELS_MAP[modelId] || modelId,
        },
        chatRequest: {
          messages: oracleMsgs,
          apiFormat: 'GENERIC',
          maxTokens: safeOptions.maxTokens ?? 512,
          temperature: safeOptions.temperature ?? 0,
          topK: 0,
          topP: 1,
        },
      },
    };

    // Delegate to a fetcher which can be mocked in tests
    const iterator = this.fetchChatStream(req);
    return { fullStream: iterator };
  }

  protected async *fetchChatStream(
    req: OracleChatRequest
  ): AsyncIterable<OracleStreamChunk> {
    const response = await this.#instance.chat(req);

    // Best-effort extraction of text from response
    function collectTexts(obj: any, out: string[]) {
      if (!obj || typeof obj !== 'object') return;
      for (const [k, v] of Object.entries(obj)) {
        if (k.toLowerCase().includes('text') && typeof v === 'string') {
          out.push(v);
        } else if (Array.isArray(v)) {
          for (const item of v) collectTexts(item, out);
        } else if (v && typeof v === 'object') {
          collectTexts(v, out);
        }
      }
    }
    const texts: string[] = [];
    collectTexts(response, texts);
    const fullText = texts.join('\n').trim() || JSON.stringify(response);

    // Emit as small chunks to simulate streaming
    const chunkSize = 200;
    let id = 0;
    for (let i = 0; i < fullText.length; i += chunkSize) {
      const text = fullText.slice(i, i + chunkSize);
      const chunk: TextStreamPart<CustomAITools> = {
        type: 'text-delta',
        id: `oracle-${++id}`,
        text,
      } as any;
      yield chunk as any;
    }
  }
}

export class SessionAuthDetailProvider
  extends SimpleAuthenticationDetailsProvider
  implements AuthenticationDetailsProvider, RegionProvider
{
  static init(
    config: NonNullable<OracleConfig['config']>,
    privateKeyContent: string,
    sessionToken?: string
  ): SessionAuthDetailProvider {
    const file = ConfigFileReader.parse(
      `[DEFAULT]\n${Object.entries(config)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n')}`,
      ConfigFileReader.DEFAULT_PROFILE_NAME
    );

    return new SessionAuthDetailProvider(
      checkNotNull(file.get('tenancy'), 'missing tenancy in config'),
      sessionToken
        ? ''
        : checkNotNull(file.get('user'), 'missing user in config'),
      checkNotNull(file.get('fingerprint'), 'missing fingerprint in config'),
      privateKeyContent,
      file.get('pass_phrase'),
      SessionAuthDetailProvider.retrieveRegionFromRegionId(
        checkNotNull(file.get('region'), 'missing region in config')
      ),
      undefined,
      undefined,
      file.profileCredentials,
      sessionToken
    );
  }

  static retrieveRegionFromRegionId(regionId: string): Region {
    let region: Region;
    try {
      region = Region.fromRegionId(regionId);
      if (!region) {
        // Proceed by assuming the region id in the config file belongs to OC1 realm.
        new Logger(SessionAuthDetailProvider.name).warn(
          `Falling back to using OC1 realm.`
        );
        region = Region.register(regionId, Realm.OC1);
      }
      return region;
    } catch (e) {
      throw new Error(
        `Error from retrying to retrieve region from regionId: ${e}.`
      );
    }
  }

  public override async getKeyId(): Promise<string> {
    return 'ST$' + (await this.getSecurityToken());
  }

  // @ts-expect-error
  public override setRegion(regionId: string): void {
    super.setRegion(
      SessionAuthDetailProvider.retrieveRegionFromRegionId(regionId)
    );
  }

  async getSecurityToken(): Promise<string> {
    return this.sessionToken!;
  }

  public async refreshSessionToken(): Promise<string> {
    try {
      const signer = new DefaultRequestSigner(this);
      const client = new FetchHttpClient(signer);
      const regionId = this.getRegion().regionId;
      const region = Region.fromRegionId(regionId);
      const secondLevelDomain = region.realm.secondLevelDomain;

      const request = await composeRequest({
        baseEndpoint: `https://auth.${regionId}.${secondLevelDomain}`,
        path: `/v1/authentication/refresh`,
        method: 'POST',
        defaultHeaders: { 'content-type': 'application/json' },
        bodyContent: JSON.stringify({ currentToken: this.sessionToken }),
      });

      const response = await client.send(request);
      if (response.status === 200) {
        const tokenJson: any = await response.json();
        const tokenStr = tokenJson.token as string;
        this.sessionToken = tokenStr;
        return this.sessionToken;
      } else if (response.status === 401) {
        const errBody = await handleErrorBody(response);
        throw new Error(
          `Authentication Error calling Identity to refresh token. Error: ${JSON.stringify(
            errBody
          )}`
        );
      } else {
        const errBody = await handleErrorBody(response);
        throw new Error(
          `Token cannot be refreshed. Error: ${JSON.stringify(errBody)}`
        );
      }
    } catch (e) {
      throw new Error(`Failed to refresh the session token due to ${e}`);
    }
  }
}
