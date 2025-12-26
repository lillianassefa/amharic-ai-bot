# Quickstart: Embedding the AI Widget

## 1. Get Your Snippet
In your Company Dashboard, navigate to **Settings > Widget**. You will find a copyable script tag.

## 2. Add to Your Website
Paste the following code before the closing `</body>` tag on every page where you want the chat widget to appear:

```html
<script 
  src="https://api.yourdomain.com/widget.js" 
  data-api-key="YOUR_COMPANY_API_KEY"
  async
></script>
```

## 3. Configuration (Optional)
The widget automatically fetches its settings from our server. You can update colors, the welcome message, and more directly from your dashboard without changing the code on your website.

## 4. Security
Ensure you add your website's domain (e.g., `https://example.com`) to the **Allowed Domains** list in the Widget settings. This prevents other people from using your API key on their own sites.

