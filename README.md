# AI QA Expert - Intelligent Test Engineering Assistant

From Requirement to Test Automation.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup environment variables:
   ```bash
   cp .env.example .env.local
   # Add your GEMINI_API_KEY in .env.local
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Deploy to Cloud Run:
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT/ai-qa-expert
   gcloud run deploy ai-qa-expert --image gcr.io/YOUR_PROJECT/ai-qa-expert --platform managed --region us-central1 --allow-unauthenticated --set-env-vars GEMINI_API_KEY="YOUR_KEY"
   ```
