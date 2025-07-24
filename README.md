# HTML to PNG Conversion Service

A Node.js Express API service that converts HTML strings to PNG images using Puppeteer, optimized for Railway deployment.

## Features

- 🚀 Fast HTML to PNG conversion using Puppeteer
- 🔧 Railway-compatible configuration  
- 🛡️ Comprehensive error handling
- 📏 Request size limits for security
- 🧹 Automatic resource cleanup
- 💾 Memory-efficient processing

## API Endpoints

### Health Check
- **GET** `/` - Returns service status and available endpoints

### HTML to PNG Conversion
- **POST** `/render` - Converts HTML to PNG image
  - **Content-Type**: `text/html`
  - **Request Body**: Raw HTML string
  - **Response**: PNG image with `Content-Type: image/png`

### HTML to PNG with Custom CSS Injection
- **POST** `/render-with-css` - Converts HTML to PNG with custom CSS injection
  - **Content-Type**: `application/json`
  - **Request Body**: JSON object with `html`, `css`, `selector`, and `viewport` properties
  - **Response**: PNG image with `Content-Type: image/png`

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd html-to-png-service
```

2. Install dependencies:
```bash
npm install
```

3. Start the service:
```bash
npm start
```

The service will start on port 3000 by default, or use the `PORT` environment variable if set.

## Testing with curl

### Basic HTML to PNG conversion:
```bash
curl -X POST http://localhost:3000/render \
     -H "Content-Type: text/html" \
     --data "<html><body><h1>Hello Neem Tree!</h1></body></html>" \
     --output image.png
```

### More complex HTML example:
```bash
curl -X POST http://localhost:3000/render \
     -H "Content-Type: text/html" \
     --data "<html><head><style>body{font-family:Arial;background:#f0f0f0;padding:20px}h1{color:#333;text-align:center}</style></head><body><h1>My HTML Page</h1><p>This is a test conversion to PNG!</p></body></html>" \
     --output styled_image.png
```

### CSS Injection with JSON:
```bash
curl -X POST http://localhost:3000/render-with-css \
     -H "Content-Type: application/json" \
     -d '{
       "html": "<html><body><h1>Hello World</h1><div class=\"highlight\">Special content</div></body></html>",
       "css": ".highlight { background: yellow; padding: 10px; border-radius: 5px; } h1 { color: blue; }",
       "viewport": { "width": 800, "height": 600 }
     }' \
     --output css_injected.png
```

### Element-specific screenshot:
```bash
curl -X POST http://localhost:3000/render-with-css \
     -H "Content-Type: application/json" \
     -d '{
       "html": "<html><body><h1>Title</h1><div class=\"card\">Card content</div><footer>Footer</footer></body></html>",
       "css": ".card { background: white; border: 2px solid #ddd; padding: 20px; margin: 10px; }",
       "selector": ".card"
     }' \
     --output card_only.png
```

### Health check:
```bash
curl http://localhost:3000/
```

## Testing with n8n

You can use this service in n8n workflows:

1. **Basic HTML to PNG:**
   - Method: `POST`
   - URL: `https://your-deployed-service.railway.app/render`
   - Headers: `Content-Type: text/html`
   - Body: Raw HTML string
   - Response Format: `File`

2. **Advanced CSS Injection:**
   - Method: `POST`
   - URL: `https://your-deployed-service.railway.app/render-with-css`
   - Headers: `Content-Type: application/json`
   - Body: JSON object (see examples below)
   - Response Format: `File`

3. **Example n8n JSON body for CSS injection:**
```json
{
  "html": "<html><body><h1>Dynamic Content</h1><div class='highlight'>Important text</div></body></html>",
  "css": ".highlight { background: linear-gradient(45deg, #ff6b6b, #4ecdc4); color: white; padding: 15px; border-radius: 8px; }",
  "viewport": { "width": 1000, "height": 800, "deviceScaleFactor": 2 },
  "selector": "body"
}
```

4. **Example n8n workflow:**
   - Trigger (webhook, schedule, etc.)
   - Function Node (generate HTML and CSS)
   - HTTP Request Node (call this service)
   - Output Node (save/send PNG)

## Deployment to Railway

### Method 1: Connect GitHub Repository

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/html-to-png-service.git
git push -u origin main
```

2. **Deploy on Railway:**
   - Go to [Railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will automatically detect the Node.js app and deploy

### Method 2: Railway CLI

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Login and deploy:**
```bash
railway login
railway init
railway up
```

### Environment Variables

The service automatically uses Railway's provided `PORT` environment variable. No additional configuration needed.

### Railway Configuration

The service is optimized for Railway with:
- Puppeteer launch arguments for containerized environments
- Memory-efficient browser management
- Automatic port binding (`0.0.0.0`)
- Graceful shutdown handling

## Project Structure

```
├── index.js          # Main Express server with Puppeteer integration
├── package.json      # Dependencies and scripts
└── README.md         # Documentation
```

## Dependencies

- **express**: Web framework for the API
- **puppeteer**: Headless Chrome automation for HTML rendering
- **body-parser**: Middleware for parsing request bodies

## Error Handling

The service includes comprehensive error handling for:
- Invalid content types
- Missing HTML content
- Empty requests
- Browser launch failures
- Rendering errors
- Memory management

## API Response Examples

### Success Response (PNG Image)
```
HTTP/1.1 200 OK
Content-Type: image/png
Content-Length: 7761
Cache-Control: no-cache

[PNG binary data]
```

### Error Response
```json
{
  "error": "Invalid content type. Expected text/html"
}
```

## Performance Notes

- Each request creates a new browser instance for isolation
- Browser instances are automatically cleaned up after each request
- Request size limit: 10MB
- Optimized for cloud deployment environments

## License

MIT
