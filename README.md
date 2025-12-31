# PicKut - Neural Product Image Lab

PicKut is a professional-grade AI image processing suite designed specifically for e-commerce and product photography. It leverages the Gemini 3 Pro and 2.5 Flash neural models to provide high-fidelity background removal, object cleanup, and creative synthesis through natural language instructions.

## Key Features

- **Neural Edit Stream**: Modify existing photos using natural language (e.g., "Remove background", "Add soft shadows").
- **Neural Synthesis**: Generate high-quality product mockups from scratch using Gemini 3 Pro.
- **Multi-Vector Aspect Ratios**: Support for 1:1, 16:9, 9:16, and cinematic 21:9 formats.
- **Neural Registry**: A non-destructive history stack allowing for seamless undo/redo operations.
- **Theme Engine**: Matrix (Dark), Clean (Light), and Solar (High-Contrast) interfaces.
- **Tiered Access Control**: Integrated trial management with automatic watermarking for non-premium users.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS.
- **AI Engine**: Google Gemini API (@google/genai).
- **Processing**: HTML5 Canvas for real-time watermarking and image manipulation.

## Licensing and Billing

PicKut supports multiple payment gateways including:
- **Crypto**: BTC, ETH (ERC20).
- **Fiat**: PayPal, Payoneer.

## Development

Built by Llakterian. Contact: llakterian@gmail.com

---

### Security Note
The application includes input sanitization for prompts and strict mime-type validation for all data ingestion pipelines.
