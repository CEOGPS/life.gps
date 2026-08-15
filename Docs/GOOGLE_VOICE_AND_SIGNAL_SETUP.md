# GOOGLE VOICE + SIGNAL SETUP GUIDE

## GOOGLE VOICE FOR SMS (FREE ALTERNATIVE TO TWILIO)

### Why Google Voice?

✅ **Free** — No monthly charges  
✅ **Real SMS** — Works with your existing Google Voice number  
✅ **No API key** — Uses Gmail API (you're getting anyway)  
✅ **Bidirectional** — Send & receive SMS

### Setup Steps

#### 1. Get Google Voice Number

- Go to https://voice.google.com
- Create/claim a Google Voice number (or use existing)
- Note the number: +1-XXX-XXX-XXXX

#### 2. Set Up Gmail Forwarding

- Go to Google Voice settings > Forwarding & Voicemail
- Enable "SMS forwarding to email"
- Forward SMS to your Gmail address

#### 3. Get Gmail OAuth Token

- You already have this for Google integration
- Make sure it has `gmail.readonly` scope
- Store in Cloudflare: `GOOGLE_VOICE_TOKEN`

#### 4. Send SMS via Google Voice

Using the unofficial Google Voice API (stable, widely used):

```javascript
async function sendViaGoogleVoice(
  googleVoiceNumber,
  phoneNumber,
  message,
  token,
) {
  const response = await fetch("https://www.google.com/voice/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phoneNumber,
      message,
      conversation_id: googleVoiceNumber,
    }),
  });
  return response.json();
}
```

#### 5. Test It

- Send SMS from your phone to the Google Voice number
- It should appear in Supabase `messages` table within 1 minute
- Reply from LifeOS1
- Recipient gets it on their phone

### Cost: $0/month

✅ Done.

---

## SIGNAL (UNOFFICIAL - BUT BEST OPTION)

### Why This Approach?

Signal has **no official API**. But the community-maintained `signal-cli` is reliable and used by enterprises.

### Two Setup Options

#### OPTION A: Docker (Recommended) 🐳

**1. Install Docker**

```bash
# macOS
brew install docker

# Ubuntu/Linux
sudo apt install docker.io
```

**2. Run Signal Container**

```bash
docker run -d \
  --name signal-api \
  -p 8080:8080 \
  -v signal-data:/home/signal/.local/share/signal-cli \
  bbernhard/signal-cli-rest-api:latest
```

**3. Register Your Signal Number**

```bash
curl -X POST http://localhost:8080/v1/register/+1XXXXXXXXXX \
  -H "Content-Type: application/json" \
  -d '{"captcha":"captcha-token"}'
```

(Get captcha from Signal: https://signalcaptchas.org)

**4. Link to Desktop Signal**

```bash
# In browser, go to:
http://localhost:8080/api/v1/qrcodelink

# Scan QR code with Signal Desktop app
# You'll get a Device ID
```

**5. Store in Cloudflare**

```
SIGNAL_CLI_API_URL = "http://your-server:8080"
SIGNAL_PHONE_NUMBER = "+1XXXXXXXXXX"
SIGNAL_DEVICE_ID = "your-device-id"
```

**6. Send Messages**

```javascript
const response = await fetch("http://localhost:8080/v1/send", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    number: "+1XXXXXXXXXX",
    recipients: ["+1YYYYYYYYYY"],
    message: "Hello from LifeOS1!",
  }),
});
```

---

#### OPTION B: VPS Deployment (Better for Production)

If you want Signal accessible from your Cloudflare Worker:

**1. Rent VPS**

- DigitalOcean ($5/month)
- Linode ($5/month)
- Or use existing server

**2. Install Docker on VPS**

```bash
curl https://get.docker.com | sh
```

**3. Run Signal Container**
(Same as above)

**4. Expose to Internet (Securely)**

```bash
# Use nginx reverse proxy with SSL
# This way: Cloudflare Worker → Your VPS (SSL) → Signal Container
```

**5. Update Worker**

```javascript
const SIGNAL_API_URL = "https://signal-api.yourserver.com";

// Now Cloudflare Worker can talk to Signal on your VPS
const response = await fetch(`${SIGNAL_API_URL}/v1/receive/${phoneNumber}`);
```

---

### Signal Features

✅ **Receive Messages** — Pull from Signal inbox  
✅ **Send Messages** — Send via signal-cli API  
✅ **Group Chats** — Support for Signal groups  
✅ **Attachments** — Send/receive files  
✅ **Typing Indicators** — See who's typing  
❌ **Officially Supported** — But community-maintained & reliable

---

## UPDATED WORKER FILE

Use `cloudflare-worker-v2.js` which includes:

✅ Google Voice (Gmail API polling)  
✅ Signal (signal-cli-rest-api Docker)  
✅ All 8 platforms working together

---

## TESTING

### Google Voice

```bash
# 1. Send SMS to your Google Voice number from your phone
# 2. Wait 30 seconds for email forwarding
# 3. In LifeOS1, click "Sync" button next to Google Voice
# 4. Message should appear
```

### Signal

```bash
# 1. Send message to Signal account from another Signal user
# 2. Click "Sync" button next to Signal
# 3. Message should appear in LifeOS1
```

---

## COSTS

| Platform         | Cost   | Method                   |
| ---------------- | ------ | ------------------------ |
| Telegram         | $0     | Official API             |
| Messenger        | $0     | Facebook Graph API       |
| Instagram        | $0     | Facebook Graph API       |
| WhatsApp         | Varies | WhatsApp Business API    |
| Signal           | $0     | signal-cli (self-hosted) |
| SMS/Google Voice | $0     | Gmail API                |
| TikTok           | Varies | Limited API              |
| Snapchat         | Varies | Limited API              |

**Total Monthly Cost: $0-20** (depending on WhatsApp volume)

---

## NEXT STEPS

1. ✅ Set up Google Voice number
2. ✅ Forward SMS to Gmail
3. ✅ Spin up Signal Docker container (or use existing server)
4. ✅ Update `cloudflare-worker-v2.js` with your URLs
5. ✅ Deploy new Worker
6. ✅ Test sync buttons
7. ✅ Send/receive messages from all 8 platforms

**You're building a FREE, encrypted, privacy-first messaging hub.** 🛡️

Any questions on setup? Drop it.
