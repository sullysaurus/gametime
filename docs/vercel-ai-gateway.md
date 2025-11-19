# Vercel AI Gateway Setup

This project already supports routing OpenAI image-generation calls through Vercel's AI Gateway by pointing the OpenAI SDK at a gateway base URL. Follow the steps below to provision the gateway, connect it to your OpenAI account, and supply the credentials we need for local development.

## 1. Create a Gateway in Vercel

1. Open the [Vercel dashboard](https://vercel.com/) and go to **AI > Gateways**.
2. Click **New Gateway**, give it a descriptive name (e.g., `red-rocks-image-gen`), and choose the team/project that owns it.
3. After the gateway is created, go to **Providers** inside the gateway and add **OpenAI**:
   - Paste your OpenAI API key so the gateway can call DALL·E 3 on your behalf.
   - Enable the `dall-e-3` model (and any other models you want to expose).
4. Optionally enable analytics, caching, or rate limits according to your needs.

## 2. Enable the Recommended Models

The UI exposes four battle-tested presets. Configure each inside the gateway's **Providers** tab:

| Preset | Provider | Model Identifier | Notes |
| --- | --- | --- | --- |
| DALL·E 3 (Ultra HD) | OpenAI | `dall-e-3` | Works with direct OpenAI API if you skip the gateway |
| GPT-Image 1 (Balanced) | OpenAI | `gpt-image-1` | Supports transparent backgrounds & edits |
| Stable Diffusion 3 (Detail) | Stability | `stabilityai/stable-diffusion-3` | Requires Vercel AI Gateway provider config |
| FLUX.1 Pro (Creative) | Black Forest Labs | `black-forest-labs/flux-pro` | Requires gateway + provider auth |

For the non-OpenAI providers, add the relevant API keys (e.g., Stability AI, Fireworks) so the gateway can proxy the requests.

## 3. Gather the Credentials We Need

From the gateway's **Settings** page copy the following values:

- **Gateway URL** – looks like `https://gateway.ai.cloudflare.com/v1/<team-id>/<gateway-slug>`
- **Gateway Access Token** – shown under **Access Tokens** (create a new one if needed)

Share both values (privately) so we can run the project that targets the gateway.

## 4. Configure Local Environment Variables

Update `.env.local` with the gateway info:

```env
OPENAI_API_KEY=<Gateway Access Token>
AI_GATEWAY_URL=<Gateway URL>
```

Notes:

- When `AI_GATEWAY_URL` is defined, `app/api/generate-image/route.ts` automatically sends all OpenAI requests through it.
- `OPENAI_API_KEY` should be set to the **gateway access token**, not the raw OpenAI key, whenever the gateway is in use.

## 5. Verify the Integration

1. Run `npm run dev` locally.
2. Trigger an image generation from `/admin`.
3. Confirm the request shows up in the Vercel AI Gateway analytics dashboard.

If you see 401 errors, double-check that the gateway token matches the one provided in `.env.local` and that the gateway has access to the required models.
