# IDStudio.ai Marketing Site - Hostinger Deployment

This folder contains the static marketing website for Hostinger deployment.

## Files Structure
```
marketing-site/
├── index.html          # Homepage
├── pricing.html        # Pricing page
└── README.md           # This file
```

## Deployment to Hostinger

### 1. Upload Files
1. Log into your Hostinger control panel
2. Go to File Manager
3. Navigate to `public_html/` directory
4. Upload all files from this `marketing-site/` folder
5. Set `index.html` as the default page

### 2. Domain Configuration
- **Main domain**: `idstudio.ai` → Points to Hostinger (marketing site)
- **Subdomain**: `app.idstudio.ai` → Points to Vercel (Next.js app)

### 3. DNS Settings in Hostinger
```
Type    Name    Value                   TTL
A       @       [Your Hostinger IP]     3600
CNAME   app     your-vercel-app.vercel.app    3600
```

## Features
- ✅ Static HTML/CSS/JS (fast loading)
- ✅ Responsive design with Tailwind CSS
- ✅ All marketing links point to `app.idstudio.ai` for authentication
- ✅ SEO optimized
- ✅ Font Awesome icons
- ✅ Professional design matching your brand

## Links Configuration
All authentication links redirect to Vercel app:
- Sign In → `https://app.idstudio.ai/login`
- Get Started → `https://app.idstudio.ai/signup`
- Start Free Trial → `https://app.idstudio.ai/signup`

## Next Steps
1. Upload these files to Hostinger
2. Configure DNS settings
3. Deploy Next.js app to Vercel with `app.idstudio.ai` domain
4. Test the complete flow: Marketing site → Authentication → App
