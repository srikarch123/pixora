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

## Auth Setup

Pixora supports email/password signup with verification emails and Google Sign-In/Sign-Up.

For Google auth, create an OAuth web client in Google Cloud and add:

```bash
GOOGLE_CLIENT_ID=your_google_web_client_id
```

To grant admin permissions to one or more accounts, list their emails:

```bash
ADMIN_EMAILS=owner@example.com,admin@example.com
```

Admin emails are automatically marked verified and get access to the admin dashboard after signing in.

## Credits

Regular users start with 5 credits. A website generation costs 5 credits. Admin accounts do not spend credits, and admins can edit user balances from the admin dashboard.

Credit purchases use Stripe Checkout. The current packages are:

- Starter pack: $5 for 10 credits
- Growth pack: $15 for 35 credits
- Pro pack: $29 for 80 credits

Add your Stripe keys to `server/.env`:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=http://localhost:4200?checkout=success&session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=http://localhost:4200?checkout=cancel
```

For local webhook testing, forward Stripe events to the API:

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

Credits are only added when Stripe sends `checkout.session.completed`, so the webhook must be configured in local development and production.

For regular signup verification emails, configure SMTP:

```bash
SERVER_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM="Pixora" <noreply@pixora.app>
```

If SMTP is not configured, signup still succeeds but the verification email is skipped in local development.

## Next Production Steps

1. Replace local SQLite with Postgres or Supabase for deployed multi-user storage.
2. Replace the local vector store with a managed vector database.
3. Add GitHub repository creation and commits with installation-specific credentials.
4. Add Vercel, Netlify, or Cloudflare Pages deployment adapters.
5. Add authentication, billing, revision history, image uploads, and custom domains.
