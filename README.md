# Pixora

Pixora is a base product for an automated web development and deployment pipeline. It collects small-business details through an Angular form, sends them to a Node API, retrieves relevant business/web guidance from a small vector store, asks OpenAI for structured website content when configured, renders the content into professional static templates, stores the generation in SQLite, and returns deployment-ready website files.

## Architecture

- `client`: Angular intake UI and generated website preview.
- `server`: Express API, OpenAI integration, RAG retrieval, SQLite storage, template rendering, and deployment planning.
- `server/src/templates`: Static professional website templates for restaurants, shops, services, beauty studios, and portfolios. OpenAI only generates structured content, not template code.
- `server/src/rag`: Local vector retrieval. This is intentionally simple so it can later be replaced with Pinecone, Supabase pgvector, Chroma, or LangGraph-backed orchestration.
- `server/src/db`: Local SQL persistence using SQLite.

## Run Locally

```bash
npm install
cp server/.env.example server/.env
npm run dev
```

Open `http://localhost:4200`. The API runs on `http://localhost:3000`.

Without `OPENAI_API_KEY`, the backend uses a deterministic fallback generator so the workflow still works.

## Templates

The generator randomly selects from compatible templates for each business type, so different clients do not receive the same visual layout every time.

Current templates:

- `bistro-editorial`
- `catalog-luxe`
- `service-pro`
- `studio-split`
- `neighborhood-classic`
- `showcase-grid`

The intake form asks for hero and gallery image URLs. If the user does not provide images, Pixora uses business-category fallback images for preview purposes.

## OpenAI Setup

Add this to `server/.env`:

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
DATABASE_URL=sqlite:data/pixora.sqlite
```

The backend uses the official `openai` SDK.

## Next Production Steps

1. Replace local SQLite with Postgres or Supabase for deployed multi-user storage.
2. Replace the local vector store with a managed vector database.
3. Add GitHub repository creation and commits with installation-specific credentials.
4. Add Vercel, Netlify, or Cloudflare Pages deployment adapters.
5. Add authentication, billing, revision history, image uploads, and custom domains.
