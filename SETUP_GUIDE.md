# Setup Guide - Where to Get API Keys

## Quick Start

1. Copy `.env.example` to `.env.local`
2. Fill in the values below
3. Run `npm run dev`

---

## GEMINI_API_KEY

**Purpose:** Generate stories from user prompts

**How to get:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key

**Cost:** Free tier available (15 RPM, 1M tokens/day)

---

## IBM_TTS_API_KEY & IBM_TTS_URL

**Purpose:** Convert story text to audio narration

**How to get:**
1. Go to [IBM Cloud](https://cloud.ibm.com)
2. Create resource → Text to Speech
3. Select region (e.g., US South)
4. Create service
5. Go to Service Credentials → View Credentials
6. Copy `api_key` and `url`

**Environment Variables:**
```env
IBM_TTS_API_KEY=your_api_key_here
IBM_TTS_URL=https://api.us-south.text-to-speech.watson.cloud.ibm.com
```

---

## CLOUDANT_URL & CLOUDANT_API_KEY

**Purpose:** Store and retrieve saved stories

**How to get:**
1. Go to [IBM Cloud](https://cloud.ibm.com)
2. Create resource → Cloudant NoSQL Database
3. Create service
4. Go to Service Credentials → View Credentials
5. Copy `url` and `apikey`

**Environment Variables:**
```env
CLOUDANT_URL=https://your-instance-name.cloudantnosqldb.appdomain.cloud
CLOUDANT_API_KEY=your_api_key_here
```

**Note:** Ensure your Cloudant instance has:
- A database named `stories` (or it will be auto-created)
- IAM API key with read/write permissions

---

## APPID_CONFIG

**Purpose:** User authentication (login/signup)

**How to get:**
1. Go to [IBM Cloud](https://cloud.ibm.com)
2. Create resource → App ID
3. Create service
4. Go to Applications → Add Application
5. Create new secret
6. Go to Authentication → Authentication Settings
7. Enable "Resource Owner Password" flow

**Get credentials:**
- Go to Applications → Your App → View Credentials
- Copy `clientId` and `secret`

**Get tenant ID and URL:**
- Go to Service Credentials → View Credentials
- Or from App ID dashboard URL: `https://<region>.appid.cloud.ibm.com/<tenantId>`

**Environment Variable (JSON format):**
```env
APPID_CONFIG={"clientId":"your_client_id","secret":"your_secret","tenantId":"your_tenant_id","url":"https://us-south.appid.cloud.ibm.com"}
```

**Replace placeholders:**
- `your_client_id` → from credentials
- `your_secret` → from credentials
- `your_tenant_id` → from URL or credentials
- `us-south` → your chosen region (us-south, eu-gb, etc.)

---

## After Filling .env.local

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

---

## Troubleshooting

### "CLOUDANT_URL environment variable is not set"
- Make sure `.env.local` is in the project root
- Restart the dev server after creating the file

### "Invalid credentials" on login
- Check APPID_CONFIG JSON is valid
- Ensure "Resource Owner Password" is enabled in App ID settings

### TTS not working
- Verify IBM_TTS_API_KEY is correct
- Check IBM_TTS_URL matches your region

### Stories not saving
- Verify Cloudant credentials have write permissions
- Check CLOUDANT_URL is complete (includes .cloudantnosqldb.appdomain.cloud)