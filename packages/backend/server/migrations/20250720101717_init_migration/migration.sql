-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "AiPromptRole" AS ENUM ('system', 'assistant', 'user');

-- CreateEnum
CREATE TYPE "AiJobStatus" AS ENUM ('pending', 'running', 'finished', 'claimed', 'failed');

-- CreateEnum
CREATE TYPE "AiJobType" AS ENUM ('transcription');

-- CreateEnum
CREATE TYPE "RuntimeConfigType" AS ENUM ('String', 'Number', 'Boolean', 'Object', 'Array');

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "email_verified" TIMESTAMPTZ(3),
    "avatar_url" VARCHAR,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "password" VARCHAR,
    "registered" BOOLEAN NOT NULL DEFAULT true,
    "disabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_connected_accounts" (
    "id" VARCHAR NOT NULL,
    "user_id" VARCHAR NOT NULL,
    "provider" VARCHAR NOT NULL,
    "provider_account_id" VARCHAR NOT NULL,
    "scope" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_connected_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "multiple_users_sessions" (
    "id" VARCHAR NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3),

    CONSTRAINT "multiple_users_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" VARCHAR NOT NULL,
    "session_id" VARCHAR NOT NULL,
    "user_id" VARCHAR NOT NULL,
    "expires_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "token" VARCHAR NOT NULL,
    "type" SMALLINT NOT NULL,
    "credential" TEXT,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL
);

-- CreateTable
CREATE TABLE "features" (
    "id" SERIAL NOT NULL,
    "feature" VARCHAR NOT NULL,
    "configs" JSON NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_features" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR NOT NULL,
    "feature_id" INTEGER NOT NULL,
    "name" VARCHAR NOT NULL DEFAULT '',
    "type" INTEGER NOT NULL DEFAULT 0,
    "reason" VARCHAR NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expired_at" TIMESTAMPTZ(3),
    "activated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_prompts_messages" (
    "prompt_id" INTEGER NOT NULL,
    "idx" INTEGER NOT NULL,
    "role" "AiPromptRole" NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" JSON,
    "params" JSON,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ai_prompts_metadata" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(32) NOT NULL,
    "action" VARCHAR,
    "model" VARCHAR NOT NULL,
    "optional_models" VARCHAR[] DEFAULT ARRAY[]::VARCHAR[],
    "config" JSON,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ai_prompts_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_sessions_messages" (
    "id" VARCHAR NOT NULL,
    "session_id" VARCHAR NOT NULL,
    "role" "AiPromptRole" NOT NULL,
    "content" TEXT NOT NULL,
    "streamObjects" JSON,
    "attachments" JSON,
    "params" JSON,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ai_sessions_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_sessions_metadata" (
    "id" VARCHAR NOT NULL,
    "user_id" VARCHAR NOT NULL,
    "prompt_name" VARCHAR(32) NOT NULL,
    "prompt_action" VARCHAR(32) DEFAULT '',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "title" VARCHAR,
    "messageCost" INTEGER NOT NULL DEFAULT 0,
    "tokenCost" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),
    "doc_id" VARCHAR,
    "metadata" VARCHAR NOT NULL,

    CONSTRAINT "ai_sessions_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_contexts" (
    "id" VARCHAR NOT NULL,
    "session_id" VARCHAR NOT NULL,
    "config" JSON NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ai_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_context_embeddings" (
    "id" VARCHAR NOT NULL,
    "context_id" VARCHAR NOT NULL,
    "file_id" VARCHAR NOT NULL,
    "chunk" INTEGER NOT NULL,
    "content" VARCHAR NOT NULL,
    "embedding" vector(1024) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ai_context_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_user_docs" (
    "doc_id" VARCHAR NOT NULL,
    "user_id" VARCHAR NOT NULL,
    "session_id" VARCHAR NOT NULL,
    "title" VARCHAR NOT NULL,
    "content" VARCHAR NOT NULL,
    "metadata" VARCHAR NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ai_user_docs_pkey" PRIMARY KEY ("user_id","doc_id")
);

-- CreateTable
CREATE TABLE "ai_user_doc_embeddings" (
    "user_id" VARCHAR NOT NULL,
    "doc_id" VARCHAR NOT NULL,
    "chunk" INTEGER NOT NULL,
    "content" VARCHAR NOT NULL,
    "embedding" vector(1024) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_user_doc_embeddings_pkey" PRIMARY KEY ("user_id","doc_id","chunk")
);

-- CreateTable
CREATE TABLE "ai_user_files" (
    "user_id" VARCHAR NOT NULL,
    "file_id" VARCHAR NOT NULL,
    "blob_id" VARCHAR NOT NULL DEFAULT '',
    "file_name" VARCHAR NOT NULL,
    "mime_type" VARCHAR NOT NULL,
    "size" INTEGER NOT NULL,
    "metadata" VARCHAR NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_user_files_pkey" PRIMARY KEY ("user_id","file_id")
);

-- CreateTable
CREATE TABLE "ai_user_file_embeddings" (
    "user_id" VARCHAR NOT NULL,
    "file_id" VARCHAR NOT NULL,
    "chunk" INTEGER NOT NULL,
    "content" VARCHAR NOT NULL,
    "embedding" vector(1024) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_user_file_embeddings_pkey" PRIMARY KEY ("user_id","file_id","chunk")
);

-- CreateTable
CREATE TABLE "ai_jobs" (
    "id" VARCHAR NOT NULL,
    "blob_id" VARCHAR NOT NULL,
    "created_by" VARCHAR,
    "type" "AiJobType" NOT NULL,
    "status" "AiJobStatus" NOT NULL DEFAULT 'pending',
    "payload" JSON NOT NULL,
    "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ(3),

    CONSTRAINT "ai_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_data_migrations" (
    "id" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ(3),

    CONSTRAINT "_data_migrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_configs" (
    "id" VARCHAR NOT NULL,
    "value" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "last_updated_by" VARCHAR,

    CONSTRAINT "app_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "user_id" VARCHAR NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "user_connected_accounts_user_id_idx" ON "user_connected_accounts"("user_id");

-- CreateIndex
CREATE INDEX "user_connected_accounts_provider_account_id_idx" ON "user_connected_accounts"("provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_session_id_user_id_key" ON "user_sessions"("session_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_type_token_key" ON "verification_tokens"("type", "token");

-- CreateIndex
CREATE UNIQUE INDEX "features_feature_key" ON "features"("feature");

-- CreateIndex
CREATE INDEX "user_features_user_id_idx" ON "user_features"("user_id");

-- CreateIndex
CREATE INDEX "user_features_name_idx" ON "user_features"("name");

-- CreateIndex
CREATE INDEX "user_features_feature_id_idx" ON "user_features"("feature_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_prompts_messages_prompt_id_idx_key" ON "ai_prompts_messages"("prompt_id", "idx");

-- CreateIndex
CREATE UNIQUE INDEX "ai_prompts_metadata_name_key" ON "ai_prompts_metadata"("name");

-- CreateIndex
CREATE INDEX "ai_sessions_messages_session_id_idx" ON "ai_sessions_messages"("session_id");

-- CreateIndex
CREATE INDEX "ai_sessions_metadata_prompt_name_idx" ON "ai_sessions_metadata"("prompt_name");

-- CreateIndex
CREATE INDEX "ai_sessions_metadata_user_id_idx" ON "ai_sessions_metadata"("user_id");

-- CreateIndex
CREATE INDEX "ai_context_embeddings_idx" ON "ai_context_embeddings" USING hnsw (embedding vector_cosine_ops);

-- CreateIndex
CREATE UNIQUE INDEX "ai_context_embeddings_context_id_file_id_chunk_key" ON "ai_context_embeddings"("context_id", "file_id", "chunk");

-- CreateIndex
CREATE INDEX "ai_workspace_doc_embeddings_idx" ON "ai_user_doc_embeddings" USING hnsw (embedding vector_cosine_ops);

-- CreateIndex
CREATE INDEX "ai_workspace_file_embeddings_idx" ON "ai_user_file_embeddings" USING hnsw (embedding vector_cosine_ops);

-- CreateIndex
CREATE UNIQUE INDEX "ai_jobs_created_by_blob_id_key" ON "ai_jobs"("created_by", "blob_id");

-- CreateIndex
CREATE UNIQUE INDEX "_data_migrations_name_key" ON "_data_migrations"("name");

-- AddForeignKey
ALTER TABLE "user_connected_accounts" ADD CONSTRAINT "user_connected_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "multiple_users_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_features" ADD CONSTRAINT "user_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_features" ADD CONSTRAINT "user_features_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_prompts_messages" ADD CONSTRAINT "ai_prompts_messages_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "ai_prompts_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_sessions_messages" ADD CONSTRAINT "ai_sessions_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "ai_sessions_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_sessions_metadata" ADD CONSTRAINT "ai_sessions_metadata_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_sessions_metadata" ADD CONSTRAINT "ai_sessions_metadata_prompt_name_fkey" FOREIGN KEY ("prompt_name") REFERENCES "ai_prompts_metadata"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_contexts" ADD CONSTRAINT "ai_contexts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "ai_sessions_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_context_embeddings" ADD CONSTRAINT "ai_context_embeddings_context_id_fkey" FOREIGN KEY ("context_id") REFERENCES "ai_contexts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_user_docs" ADD CONSTRAINT "ai_user_docs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_user_doc_embeddings" ADD CONSTRAINT "ai_user_doc_embeddings_user_id_doc_id_fkey" FOREIGN KEY ("user_id", "doc_id") REFERENCES "ai_user_docs"("user_id", "doc_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_user_files" ADD CONSTRAINT "ai_user_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_user_file_embeddings" ADD CONSTRAINT "ai_user_file_embeddings_user_id_file_id_fkey" FOREIGN KEY ("user_id", "file_id") REFERENCES "ai_user_files"("user_id", "file_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_jobs" ADD CONSTRAINT "ai_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_configs" ADD CONSTRAINT "app_configs_last_updated_by_fkey" FOREIGN KEY ("last_updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
