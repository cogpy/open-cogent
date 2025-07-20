/* do not manipulate this file manually. */
export interface GraphQLQuery {
  id: string;
  op: string;
  query: string;
  file?: boolean;
  deprecations?: string[];
}
export const copilotChatMessageFragment = `fragment CopilotChatMessage on ChatMessage {
  id
  role
  content
  attachments
  streamObjects {
    type
    textDelta
    toolCallId
    toolName
    args
    result
  }
  createdAt
}`;
export const copilotChatHistoryFragment = `fragment CopilotChatHistory on CopilotHistories {
  sessionId
  promptName
  model
  optionalModels
  action
  pinned
  title
  tokens
  messages {
    ...CopilotChatMessage
  }
  createdAt
  updatedAt
}`;
export const paginatedCopilotChatsFragment = `fragment PaginatedCopilotChats on PaginatedCopilotHistoriesType {
  pageInfo {
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
  }
  edges {
    cursor
    node {
      ...CopilotChatHistory
    }
  }
}`;
export const credentialsRequirementsFragment = `fragment CredentialsRequirements on CredentialsRequirementType {
  password {
    ...PasswordLimits
  }
}`;
export const passwordLimitsFragment = `fragment PasswordLimits on PasswordLimitsType {
  minLength
  maxLength
}`;
export const adminServerConfigQuery = {
  id: 'adminServerConfigQuery' as const,
  op: 'adminServerConfig',
  query: `query adminServerConfig {
  serverConfig {
    version
    baseUrl
    name
    features
    type
    initialized
    credentialsRequirement {
      ...CredentialsRequirements
    }
    availableUserFeatures
  }
}
${passwordLimitsFragment}
${credentialsRequirementsFragment}`,
};

export const createChangePasswordUrlMutation = {
  id: 'createChangePasswordUrlMutation' as const,
  op: 'createChangePasswordUrl',
  query: `mutation createChangePasswordUrl($callbackUrl: String!, $userId: String!) {
  createChangePasswordUrl(callbackUrl: $callbackUrl, userId: $userId)
}`,
};

export const appConfigQuery = {
  id: 'appConfigQuery' as const,
  op: 'appConfig',
  query: `query appConfig {
  appConfig
}`,
};

export const getPromptsQuery = {
  id: 'getPromptsQuery' as const,
  op: 'getPrompts',
  query: `query getPrompts {
  listCopilotPrompts {
    name
    model
    action
    config {
      frequencyPenalty
      presencePenalty
      temperature
      topP
    }
    messages {
      role
      content
      params
    }
  }
}`,
};

export const updatePromptMutation = {
  id: 'updatePromptMutation' as const,
  op: 'updatePrompt',
  query: `mutation updatePrompt($name: String!, $messages: [CopilotPromptMessageInput!]!) {
  updateCopilotPrompt(name: $name, messages: $messages) {
    name
    model
    action
    config {
      frequencyPenalty
      presencePenalty
      temperature
      topP
    }
    messages {
      role
      content
      params
    }
  }
}`,
};

export const createUserMutation = {
  id: 'createUserMutation' as const,
  op: 'createUser',
  query: `mutation createUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
  }
}`,
};

export const deleteUserMutation = {
  id: 'deleteUserMutation' as const,
  op: 'deleteUser',
  query: `mutation deleteUser($id: String!) {
  deleteUser(id: $id) {
    success
  }
}`,
};

export const disableUserMutation = {
  id: 'disableUserMutation' as const,
  op: 'disableUser',
  query: `mutation disableUser($id: String!) {
  banUser(id: $id) {
    email
    disabled
  }
}`,
};

export const enableUserMutation = {
  id: 'enableUserMutation' as const,
  op: 'enableUser',
  query: `mutation enableUser($id: String!) {
  enableUser(id: $id) {
    email
    disabled
  }
}`,
};

export const getUserByEmailQuery = {
  id: 'getUserByEmailQuery' as const,
  op: 'getUserByEmail',
  query: `query getUserByEmail($email: String!) {
  userByEmail(email: $email) {
    id
    name
    email
    features
    hasPassword
    emailVerified
    avatarUrl
    disabled
  }
}`,
};

export const importUsersMutation = {
  id: 'importUsersMutation' as const,
  op: 'ImportUsers',
  query: `mutation ImportUsers($input: ImportUsersInput!) {
  importUsers(input: $input) {
    __typename
    ... on UserType {
      id
      name
      email
    }
    ... on UserImportFailedType {
      email
      error
    }
  }
}`,
};

export const listUsersQuery = {
  id: 'listUsersQuery' as const,
  op: 'listUsers',
  query: `query listUsers($filter: ListUserInput!) {
  users(filter: $filter) {
    id
    name
    email
    disabled
    features
    hasPassword
    emailVerified
    avatarUrl
  }
  usersCount
}`,
};

export const sendTestEmailMutation = {
  id: 'sendTestEmailMutation' as const,
  op: 'sendTestEmail',
  query: `mutation sendTestEmail($host: String!, $port: Int!, $sender: String!, $username: String!, $password: String!, $ignoreTLS: Boolean!) {
  sendTestEmail(
    config: {host: $host, port: $port, sender: $sender, username: $username, password: $password, ignoreTLS: $ignoreTLS}
  )
}`,
};

export const updateAccountFeaturesMutation = {
  id: 'updateAccountFeaturesMutation' as const,
  op: 'updateAccountFeatures',
  query: `mutation updateAccountFeatures($userId: String!, $features: [FeatureType!]!) {
  updateUserFeatures(id: $userId, features: $features)
}`,
};

export const updateAccountMutation = {
  id: 'updateAccountMutation' as const,
  op: 'updateAccount',
  query: `mutation updateAccount($id: String!, $input: ManageUserInput!) {
  updateUser(id: $id, input: $input) {
    id
    name
    email
  }
}`,
};

export const updateAppConfigMutation = {
  id: 'updateAppConfigMutation' as const,
  op: 'updateAppConfig',
  query: `mutation updateAppConfig($updates: [UpdateAppConfigInput!]!) {
  updateAppConfig(updates: $updates)
}`,
};

export const validateConfigMutation = {
  id: 'validateConfigMutation' as const,
  op: 'validateConfig',
  query: `mutation validateConfig($updates: [UpdateAppConfigInput!]!) {
  validateAppConfig(updates: $updates) {
    module
    key
    value
    valid
    error
  }
}`,
};

export const changeEmailMutation = {
  id: 'changeEmailMutation' as const,
  op: 'changeEmail',
  query: `mutation changeEmail($token: String!, $email: String!) {
  changeEmail(token: $token, email: $email) {
    id
    email
  }
}`,
};

export const changePasswordMutation = {
  id: 'changePasswordMutation' as const,
  op: 'changePassword',
  query: `mutation changePassword($token: String!, $userId: String!, $newPassword: String!) {
  changePassword(token: $token, userId: $userId, newPassword: $newPassword)
}`,
};

export const createCopilotContextMutation = {
  id: 'createCopilotContextMutation' as const,
  op: 'createCopilotContext',
  query: `mutation createCopilotContext($sessionId: String!) {
  createCopilotContext(sessionId: $sessionId)
}`,
};

export const addContextFileMutation = {
  id: 'addContextFileMutation' as const,
  op: 'addContextFile',
  query: `mutation addContextFile($content: Upload!, $options: AddContextFileInput!) {
  addContextFile(content: $content, options: $options) {
    id
    createdAt
    name
    mimeType
    chunkSize
    error
    status
    blobId
  }
}`,
  file: true,
};

export const removeContextFileMutation = {
  id: 'removeContextFileMutation' as const,
  op: 'removeContextFile',
  query: `mutation removeContextFile($options: RemoveContextFileInput!) {
  removeContextFile(options: $options)
}`,
};

export const listContextObjectQuery = {
  id: 'listContextObjectQuery' as const,
  op: 'listContextObject',
  query: `query listContextObject($workspaceId: String!, $sessionId: String!, $contextId: String!) {
  currentUser {
    copilot {
      contexts(sessionId: $sessionId, contextId: $contextId) {
        files {
          id
          name
          mimeType
          blobId
          chunkSize
          error
          status
          createdAt
        }
      }
    }
  }
}`,
};

export const listContextQuery = {
  id: 'listContextQuery' as const,
  op: 'listContext',
  query: `query listContext($sessionId: String!) {
  currentUser {
    copilot {
      contexts(sessionId: $sessionId) {
        id
      }
    }
  }
}`,
};

export const matchContextQuery = {
  id: 'matchContextQuery' as const,
  op: 'matchContext',
  query: `query matchContext($contextId: String, $workspaceId: String, $content: String!, $limit: SafeInt, $scopedThreshold: Float, $threshold: Float) {
  currentUser {
    copilot {
      contexts(contextId: $contextId) {
        matchFiles(
          content: $content
          limit: $limit
          scopedThreshold: $scopedThreshold
          threshold: $threshold
        ) {
          fileId
          blobId
          name
          mimeType
          chunk
          content
          distance
        }
      }
    }
  }
}`,
};

export const getEmbeddingStatusQuery = {
  id: 'getEmbeddingStatusQuery' as const,
  op: 'getEmbeddingStatus',
  query: `query getEmbeddingStatus {
  currentUser {
    copilot {
      embeddingStatus {
        total
        embedded
      }
    }
  }
}`,
};

export const getCopilotHistoryIdsQuery = {
  id: 'getCopilotHistoryIdsQuery' as const,
  op: 'getCopilotHistoryIds',
  query: `query getCopilotHistoryIds($workspaceId: String!, $pagination: PaginationInput!, $options: QueryChatHistoriesInput) {
  currentUser {
    copilot {
      chats(pagination: $pagination, options: $options) {
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        edges {
          cursor
          node {
            sessionId
            pinned
            messages {
              id
              role
              createdAt
            }
          }
        }
      }
    }
  }
}`,
};

export const getCopilotPinnedSessionsQuery = {
  id: 'getCopilotPinnedSessionsQuery' as const,
  op: 'getCopilotPinnedSessions',
  query: `query getCopilotPinnedSessions($messageOrder: ChatHistoryOrder, $withPrompt: Boolean) {
  currentUser {
    copilot {
      chats(
        pagination: {first: 1}
        options: {pinned: true, messageOrder: $messageOrder, withPrompt: $withPrompt}
      ) {
        ...PaginatedCopilotChats
      }
    }
  }
}
${copilotChatMessageFragment}
${copilotChatHistoryFragment}
${paginatedCopilotChatsFragment}`,
};

export const getCopilotUserSessionsQuery = {
  id: 'getCopilotUserSessionsQuery' as const,
  op: 'getCopilotUserSessions',
  query: `query getCopilotUserSessions($pagination: PaginationInput!, $options: QueryChatHistoriesInput) {
  currentUser {
    copilot {
      chats(pagination: $pagination, options: $options) {
        ...PaginatedCopilotChats
      }
    }
  }
}
${copilotChatMessageFragment}
${copilotChatHistoryFragment}
${paginatedCopilotChatsFragment}`,
};

export const getCopilotHistoriesQuery = {
  id: 'getCopilotHistoriesQuery' as const,
  op: 'getCopilotHistories',
  query: `query getCopilotHistories($pagination: PaginationInput!, $options: QueryChatHistoriesInput) {
  currentUser {
    copilot {
      chats(pagination: $pagination, options: $options) {
        ...PaginatedCopilotChats
      }
    }
  }
}
${copilotChatMessageFragment}
${copilotChatHistoryFragment}
${paginatedCopilotChatsFragment}`,
};

export const submitAudioTranscriptionMutation = {
  id: 'submitAudioTranscriptionMutation' as const,
  op: 'submitAudioTranscription',
  query: `mutation submitAudioTranscription($blobId: String!, $blob: Upload, $blobs: [Upload!]) {
  submitAudioTranscription(blob: $blob, blobs: $blobs, blobId: $blobId) {
    id
    status
  }
}`,
  file: true,
};

export const claimAudioTranscriptionMutation = {
  id: 'claimAudioTranscriptionMutation' as const,
  op: 'claimAudioTranscription',
  query: `mutation claimAudioTranscription($jobId: String!) {
  claimAudioTranscription(jobId: $jobId) {
    id
    status
    title
    summary
    actions
    transcription {
      speaker
      start
      end
      transcription
    }
  }
}`,
};

export const getAudioTranscriptionQuery = {
  id: 'getAudioTranscriptionQuery' as const,
  op: 'getAudioTranscription',
  query: `query getAudioTranscription($workspaceId: String!, $jobId: String, $blobId: String) {
  currentUser {
    copilot {
      audioTranscription(jobId: $jobId, blobId: $blobId) {
        id
        status
        title
        summary
        transcription {
          speaker
          start
          end
          transcription
        }
      }
    }
  }
}`,
};

export const retryAudioTranscriptionMutation = {
  id: 'retryAudioTranscriptionMutation' as const,
  op: 'retryAudioTranscription',
  query: `mutation retryAudioTranscription($jobId: String!) {
  retryAudioTranscription(jobId: $jobId) {
    id
    status
  }
}`,
};

export const createCopilotMessageMutation = {
  id: 'createCopilotMessageMutation' as const,
  op: 'createCopilotMessage',
  query: `mutation createCopilotMessage($options: CreateChatMessageInput!) {
  createCopilotMessage(options: $options)
}`,
  file: true,
};

export const copilotQuotaQuery = {
  id: 'copilotQuotaQuery' as const,
  op: 'copilotQuota',
  query: `query copilotQuota {
  currentUser {
    copilot {
      quota {
        limit
        used
      }
    }
  }
}`,
};

export const cleanupCopilotSessionMutation = {
  id: 'cleanupCopilotSessionMutation' as const,
  op: 'cleanupCopilotSession',
  query: `mutation cleanupCopilotSession($input: DeleteSessionInput!) {
  cleanupCopilotSession(options: $input)
}`,
};

export const createCopilotSessionMutation = {
  id: 'createCopilotSessionMutation' as const,
  op: 'createCopilotSession',
  query: `mutation createCopilotSession($options: CreateChatSessionInput!) {
  createCopilotSession(options: $options)
}`,
};

export const getCopilotLatestDocSessionQuery = {
  id: 'getCopilotLatestDocSessionQuery' as const,
  op: 'getCopilotLatestDocSession',
  query: `query getCopilotLatestDocSession {
  currentUser {
    copilot {
      chats(
        pagination: {first: 1}
        options: {sessionOrder: desc, action: false, withMessages: true}
      ) {
        ...PaginatedCopilotChats
      }
    }
  }
}
${copilotChatMessageFragment}
${copilotChatHistoryFragment}
${paginatedCopilotChatsFragment}`,
};

export const getCopilotSessionQuery = {
  id: 'getCopilotSessionQuery' as const,
  op: 'getCopilotSession',
  query: `query getCopilotSession($sessionId: String!) {
  currentUser {
    copilot {
      chats(pagination: {first: 1}, options: {sessionId: $sessionId}) {
        ...PaginatedCopilotChats
      }
    }
  }
}
${copilotChatMessageFragment}
${copilotChatHistoryFragment}
${paginatedCopilotChatsFragment}`,
};

export const getCopilotRecentSessionsQuery = {
  id: 'getCopilotRecentSessionsQuery' as const,
  op: 'getCopilotRecentSessions',
  query: `query getCopilotRecentSessions($workspaceId: String!, $limit: Int = 10, $offset: Int = 0) {
  currentUser {
    copilot {
      chats(
        pagination: {first: $limit, offset: $offset}
        options: {action: false, sessionOrder: desc, withMessages: false}
      ) {
        ...PaginatedCopilotChats
      }
    }
  }
}
${copilotChatMessageFragment}
${copilotChatHistoryFragment}
${paginatedCopilotChatsFragment}`,
};

export const updateCopilotSessionMutation = {
  id: 'updateCopilotSessionMutation' as const,
  op: 'updateCopilotSession',
  query: `mutation updateCopilotSession($options: UpdateChatSessionInput!) {
  updateCopilotSession(options: $options)
}`,
};

export const getCopilotSessionsQuery = {
  id: 'getCopilotSessionsQuery' as const,
  op: 'getCopilotSessions',
  query: `query getCopilotSessions($pagination: PaginationInput!, $options: QueryChatHistoriesInput) {
  currentUser {
    copilot {
      chats(pagination: $pagination, options: $options) {
        ...PaginatedCopilotChats
      }
    }
  }
}
${copilotChatMessageFragment}
${copilotChatHistoryFragment}
${paginatedCopilotChatsFragment}`,
};

export const addUserEmbeddingFilesMutation = {
  id: 'addUserEmbeddingFilesMutation' as const,
  op: 'addUserEmbeddingFiles',
  query: `mutation addUserEmbeddingFiles($blob: Upload!) {
  addUserEmbeddingFiles(blob: $blob) {
    fileId
    fileName
    blobId
    mimeType
    size
    createdAt
  }
}`,
  file: true,
};

export const getUserEmbeddingFilesQuery = {
  id: 'getUserEmbeddingFilesQuery' as const,
  op: 'getUserEmbeddingFiles',
  query: `query getUserEmbeddingFiles($pagination: PaginationInput!) {
  currentUser {
    embedding {
      files(pagination: $pagination) {
        totalCount
        pageInfo {
          endCursor
          hasNextPage
        }
        edges {
          node {
            fileId
            fileName
            blobId
            mimeType
            size
            createdAt
          }
        }
      }
    }
  }
}`,
};

export const removeUserEmbeddingFilesMutation = {
  id: 'removeUserEmbeddingFilesMutation' as const,
  op: 'removeUserEmbeddingFiles',
  query: `mutation removeUserEmbeddingFiles($fileId: String!) {
  removeUserEmbeddingFiles(fileId: $fileId)
}`,
};

export const deleteAccountMutation = {
  id: 'deleteAccountMutation' as const,
  op: 'deleteAccount',
  query: `mutation deleteAccount {
  deleteAccount {
    success
  }
}`,
};

export const getCurrentUserFeaturesQuery = {
  id: 'getCurrentUserFeaturesQuery' as const,
  op: 'getCurrentUserFeatures',
  query: `query getCurrentUserFeatures {
  currentUser {
    id
    name
    email
    emailVerified
    avatarUrl
    features
  }
}`,
};

export const getCurrentUserQuery = {
  id: 'getCurrentUserQuery' as const,
  op: 'getCurrentUser',
  query: `query getCurrentUser {
  currentUser {
    id
    name
    email
    emailVerified
    avatarUrl
  }
}`,
};

export const oauthProvidersQuery = {
  id: 'oauthProvidersQuery' as const,
  op: 'oauthProviders',
  query: `query oauthProviders {
  serverConfig {
    oauthProviders
  }
}`,
};

export const getPublicUserByIdQuery = {
  id: 'getPublicUserByIdQuery' as const,
  op: 'getPublicUserById',
  query: `query getPublicUserById($id: String!) {
  publicUserById(id: $id) {
    id
    avatarUrl
    name
  }
}`,
};

export const getUserFeaturesQuery = {
  id: 'getUserFeaturesQuery' as const,
  op: 'getUserFeatures',
  query: `query getUserFeatures {
  currentUser {
    id
    features
  }
}`,
};

export const getUserSettingsQuery = {
  id: 'getUserSettingsQuery' as const,
  op: 'getUserSettings',
  query: `query getUserSettings {
  currentUser {
    settings {
      receiveInvitationEmail
      receiveMentionEmail
      receiveCommentEmail
    }
  }
}`,
};

export const getUserQuery = {
  id: 'getUserQuery' as const,
  op: 'getUser',
  query: `query getUser($email: String!) {
  user(email: $email) {
    __typename
    ... on UserType {
      id
      name
      avatarUrl
      email
      hasPassword
    }
    ... on LimitedUserType {
      email
      hasPassword
    }
  }
}`,
};

export const quotaQuery = {
  id: 'quotaQuery' as const,
  op: 'quota',
  query: `query quota {
  currentUser {
    id
    quota {
      name
      blobLimit
      storageQuota
      usedStorageQuota
      copilotLimit
      humanReadable {
        name
        blobLimit
        storageQuota
        usedStorageQuota
        copilotLimit
      }
    }
  }
}`,
};

export const removeAvatarMutation = {
  id: 'removeAvatarMutation' as const,
  op: 'removeAvatar',
  query: `mutation removeAvatar {
  removeAvatar {
    success
  }
}`,
};

export const sendChangeEmailMutation = {
  id: 'sendChangeEmailMutation' as const,
  op: 'sendChangeEmail',
  query: `mutation sendChangeEmail($callbackUrl: String!) {
  sendChangeEmail(callbackUrl: $callbackUrl)
}`,
};

export const sendChangePasswordEmailMutation = {
  id: 'sendChangePasswordEmailMutation' as const,
  op: 'sendChangePasswordEmail',
  query: `mutation sendChangePasswordEmail($callbackUrl: String!) {
  sendChangePasswordEmail(callbackUrl: $callbackUrl)
}`,
};

export const sendSetPasswordEmailMutation = {
  id: 'sendSetPasswordEmailMutation' as const,
  op: 'sendSetPasswordEmail',
  query: `mutation sendSetPasswordEmail($callbackUrl: String!) {
  sendSetPasswordEmail(callbackUrl: $callbackUrl)
}`,
};

export const sendVerifyChangeEmailMutation = {
  id: 'sendVerifyChangeEmailMutation' as const,
  op: 'sendVerifyChangeEmail',
  query: `mutation sendVerifyChangeEmail($token: String!, $email: String!, $callbackUrl: String!) {
  sendVerifyChangeEmail(token: $token, email: $email, callbackUrl: $callbackUrl)
}`,
};

export const sendVerifyEmailMutation = {
  id: 'sendVerifyEmailMutation' as const,
  op: 'sendVerifyEmail',
  query: `mutation sendVerifyEmail($callbackUrl: String!) {
  sendVerifyEmail(callbackUrl: $callbackUrl)
}`,
};

export const serverConfigQuery = {
  id: 'serverConfigQuery' as const,
  op: 'serverConfig',
  query: `query serverConfig {
  serverConfig {
    version
    baseUrl
    name
    features
    type
    initialized
    credentialsRequirement {
      ...CredentialsRequirements
    }
  }
}
${passwordLimitsFragment}
${credentialsRequirementsFragment}`,
};

export const updateUserProfileMutation = {
  id: 'updateUserProfileMutation' as const,
  op: 'updateUserProfile',
  query: `mutation updateUserProfile($input: UpdateUserInput!) {
  updateProfile(input: $input) {
    id
    name
  }
}`,
};

export const updateUserSettingsMutation = {
  id: 'updateUserSettingsMutation' as const,
  op: 'updateUserSettings',
  query: `mutation updateUserSettings($input: UpdateUserSettingsInput!) {
  updateSettings(input: $input)
}`,
};

export const uploadAvatarMutation = {
  id: 'uploadAvatarMutation' as const,
  op: 'uploadAvatar',
  query: `mutation uploadAvatar($avatar: Upload!) {
  uploadAvatar(avatar: $avatar) {
    id
    name
    avatarUrl
    email
  }
}`,
  file: true,
};

export const verifyEmailMutation = {
  id: 'verifyEmailMutation' as const,
  op: 'verifyEmail',
  query: `mutation verifyEmail($token: String!) {
  verifyEmail(token: $token)
}`,
};
