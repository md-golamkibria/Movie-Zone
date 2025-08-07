#!/bin/bash
echo "🎬 Building MovieTime for Netlify..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📦 Build files are ready in the 'build' folder"
    echo ""
    echo "🚀 Deployment options:"
    echo "1. Drag & drop the 'build' folder to Netlify"
    echo "2. Use: netlify deploy --prod --dir=build"
    echo "3. Push to GitHub and connect to Netlify"
else
    echo "❌ Build failed. Check the errors above."
    exit 1
fi
