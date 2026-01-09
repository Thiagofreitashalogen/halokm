# HaloKM - Knowledge Management System

A comprehensive knowledge management system for Halogen, designed to organize and manage projects, offers, clients, methods, and expertise.

## Features

### 🔐 Authentication & Security
- Google OAuth authentication (@halogen.no domain only)
- Row-level security (RLS) with domain-based access control
- Secure session management with Supabase Auth

### 📁 Knowledge Management
- **Projects**: Track completed and ongoing projects with deliverables, methods, and learnings
- **Offers**: Manage proposals with status tracking (won/lost/pending)
- **Clients**: Maintain client relationships and contact information
- **Methods & Tools**: Document methodologies and tools used across projects
- **People**: Keep track of team members and their expertise
- **Markets**: Track market segments and opportunities

### 🤖 AI-Powered Features
- **Smart Document Analysis**: Upload or link documents for automatic metadata extraction
- **Google Drive Integration**: Import and analyze files directly from Google Drive, Docs, Slides, and Sheets
- **AI Content Generation**: Generate summaries, analyze loss reasons, and create offer drafts
- **Smart Search**: Semantic search powered by Claude AI

### 📤 Document Handling
- Support for multiple file formats (PDF, DOCX, PPTX, XLSX, TXT, MD, CSV, JSON)
- Automatic parsing with Unstructured.io API
- File size limits: 20MB for binary files, 100MB for text files
- Automatic file storage in Supabase Storage

## Technology Stack

### Frontend
- **React** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Router** for navigation
- **TipTap** for rich text editing

### Backend
- **Supabase** for database, authentication, and storage
- **Supabase Edge Functions** (Deno runtime) for serverless functions
- **PostgreSQL** with Row Level Security

### AI & APIs
- **Anthropic Claude API** (claude-sonnet-4-5-20250929)
- **Google Drive API** for file access
- **Unstructured.io API** for document parsing

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase CLI
- Google Cloud Platform account (for OAuth)
- Anthropic API key
- Unstructured.io API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Thiagofreitashalogen/halokm.git
   cd halokm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   ```

4. **Link to Supabase project**
   ```bash
   supabase login
   supabase link --project-ref your_project_ref
   ```

5. **Run database migrations**
   ```bash
   supabase db push
   ```

6. **Configure Edge Function secrets**
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=your_anthropic_key
   supabase secrets set UNSTRUCTURED_API_KEY=your_unstructured_key
   ```

7. **Deploy Edge Functions**
   ```bash
   supabase functions deploy
   ```

8. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:8080`

### Google OAuth Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google Drive API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs in your Supabase project
5. Configure OAuth credentials in Supabase Dashboard → Authentication → Providers → Google
6. Set OAuth scopes: `https://www.googleapis.com/auth/drive.readonly`

## Project Structure

```
halokm/
├── src/
│   ├── components/          # React components
│   │   ├── auth/           # Authentication components
│   │   ├── knowledge/      # Knowledge entry components
│   │   ├── layout/         # Layout components
│   │   └── ui/             # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # External service integrations
│   ├── pages/              # Page components
│   ├── types/              # TypeScript type definitions
│   └── lib/                # Utility functions
├── supabase/
│   ├── functions/          # Edge Functions
│   │   ├── analyze-entry/
│   │   ├── fetch-google-drive/
│   │   ├── parse-document/
│   │   └── ...
│   └── migrations/         # Database migrations
└── public/                 # Static assets
```

## Edge Functions

- `analyze-entry`: Extract metadata from documents using Claude AI
- `analyze-loss-reasons`: Analyze why offers were lost
- `analyze-tender`: Analyze tender documents
- `fetch-google-drive`: Fetch files from Google Drive with OAuth
- `generate-offer-draft`: Generate offer documents
- `parse-document`: Parse complex documents with Unstructured.io
- `smart-search`: Semantic search across knowledge base
- `summarize-project`: Generate project summaries

## Database Schema

Key tables:
- `knowledge_entries`: Main table for all knowledge items (projects, offers, clients, etc.)
- `project_client_links`: Links projects to clients
- `project_method_links`: Links projects to methods
- `offer_client_links`: Links offers to clients
- `offer_method_links`: Links offers to methods

All tables are protected with RLS policies that restrict access to users with @halogen.no email addresses.

## Development

### Running locally
```bash
npm run dev
```

### Building for production
```bash
npm run build
```

### Type checking
```bash
npm run type-check
```

### Deploying Edge Functions
```bash
supabase functions deploy function-name
```

## Contributing

This is an internal Halogen project. Only team members with @halogen.no email addresses have access.

## License

Proprietary - Internal use only
