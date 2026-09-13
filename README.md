<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d1af16ab-1282-40fc-a006-55999ee53d7c

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

The app uses the Express server for the `/api/ocr-details` endpoint. Use `npm run dev` for development or `npm run build && npm start` for production. Do not use `vite preview` or deploy only the generated `dist` folder, because those serve the frontend without the OCR API.
