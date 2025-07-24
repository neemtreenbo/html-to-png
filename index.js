const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse raw HTML content
app.use('/render', express.raw({ 
    type: 'text/html', 
    limit: '10mb' // Set reasonable limit for HTML content
}));

// Middleware to parse JSON for CSS injection endpoint
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'HTML to PNG conversion service is running',
        endpoints: {
            render: 'POST /render - Convert HTML to PNG',
            'render-with-css': 'POST /render-with-css - Convert HTML to PNG with custom CSS injection'
        }
    });
});

// Main render endpoint
app.post('/render', async (req, res) => {
    let browser = null;
    
    try {
        // Validate request content type
        if (!req.is('text/html')) {
            return res.status(400).json({ 
                error: 'Invalid content type. Expected text/html' 
            });
        }

        // Check if HTML content is provided
        if (!req.body || req.body.length === 0) {
            return res.status(400).json({ 
                error: 'HTML content is required in request body' 
            });
        }

        const htmlContent = req.body.toString();

        // Validate that it's not empty after converting to string
        if (!htmlContent.trim()) {
            return res.status(400).json({ 
                error: 'HTML content cannot be empty' 
            });
        }

        // Launch Puppeteer with Railway-compatible options
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        
        // Set viewport for consistent rendering
        await page.setViewport({ 
            width: 1200, 
            height: 800, 
            deviceScaleFactor: 1 
        });

        // Set content and wait for network to be idle
        await page.setContent(htmlContent, { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });

        // Take screenshot as PNG buffer
        const imageBuffer = await page.screenshot({ 
            type: 'png',
            fullPage: true,
            omitBackground: false
        });

        // Set appropriate headers and send PNG response
        res.set({
            'Content-Type': 'image/png',
            'Content-Length': imageBuffer.length,
            'Cache-Control': 'no-cache'
        });

        res.send(imageBuffer);

    } catch (error) {
        console.error('Error rendering HTML to PNG:', error);
        
        // Return appropriate error response
        if (!res.headersSent) {
            res.status(500).json({ 
                error: 'Failed to render HTML to PNG',
                message: error.message 
            });
        }
    } finally {
        // Ensure browser is always closed to prevent memory leaks
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error('Error closing browser:', closeError);
            }
        }
    }
});

// CSS injection endpoint
app.post('/render-with-css', async (req, res) => {
    let browser = null;
    
    try {
        // Validate request content type for JSON
        if (!req.is('application/json')) {
            return res.status(400).json({ 
                error: 'Invalid content type. Expected application/json' 
            });
        }

        // Check if request body is provided
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ 
                error: 'JSON body is required with html and css properties' 
            });
        }

        const { html, css, selector, viewport } = req.body;

        // Validate HTML content
        if (!html || typeof html !== 'string' || !html.trim()) {
            return res.status(400).json({ 
                error: 'HTML content is required in the html property' 
            });
        }

        // CSS can be optional, but if provided should be a string
        if (css && typeof css !== 'string') {
            return res.status(400).json({ 
                error: 'CSS must be a string if provided' 
            });
        }

        // Selector for specific element capture (optional)
        if (selector && typeof selector !== 'string') {
            return res.status(400).json({ 
                error: 'Selector must be a string if provided' 
            });
        }

        // Custom viewport settings (optional)
        const viewportSettings = {
            width: (viewport && viewport.width) ? viewport.width : 1200,
            height: (viewport && viewport.height) ? viewport.height : 800,
            deviceScaleFactor: (viewport && viewport.deviceScaleFactor) ? viewport.deviceScaleFactor : 1
        };

        // Launch Puppeteer with Railway-compatible options
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        
        // Set custom viewport
        await page.setViewport(viewportSettings);

        // Set content and wait for network to be idle
        await page.setContent(html, { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });

        // Inject custom CSS if provided
        if (css && css.trim()) {
            await page.addStyleTag({ content: css });
        }

        // Wait a moment for CSS to apply
        await page.waitForTimeout(500);

        let imageBuffer;

        // Take screenshot of specific element if selector is provided
        if (selector && selector.trim()) {
            try {
                const element = await page.$(selector);
                if (!element) {
                    throw new Error(`Element with selector "${selector}" not found`);
                }
                imageBuffer = await element.screenshot({ 
                    type: 'png',
                    omitBackground: false
                });
            } catch (selectorError) {
                return res.status(400).json({ 
                    error: `Selector error: ${selectorError.message}` 
                });
            }
        } else {
            // Take full page screenshot
            imageBuffer = await page.screenshot({ 
                type: 'png',
                fullPage: true,
                omitBackground: false
            });
        }

        // Set appropriate headers and send PNG response
        res.set({
            'Content-Type': 'image/png',
            'Content-Length': imageBuffer.length,
            'Cache-Control': 'no-cache'
        });

        res.send(imageBuffer);

    } catch (error) {
        console.error('Error rendering HTML with CSS to PNG:', error);
        
        // Return appropriate error response
        if (!res.headersSent) {
            res.status(500).json({ 
                error: 'Failed to render HTML with CSS to PNG',
                message: error.message 
            });
        }
    } finally {
        // Ensure browser is always closed to prevent memory leaks
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error('Error closing browser:', closeError);
            }
        }
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// Handle 404 for undefined routes
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        message: `${req.method} ${req.path} is not a valid endpoint` 
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`HTML to PNG conversion service running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/`);
    console.log(`Render endpoint: POST http://localhost:${PORT}/render`);
    console.log(`Public URL: https://${process.env.REPL_SLUG}--${process.env.REPL_OWNER}.replit.dev/`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully');
    process.exit(0);
});
