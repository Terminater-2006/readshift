# ReadShift

ReadShift is a production-ready Chrome Extension that applies the Lexend font and Bionic Reading formatting to any webpage to improve reading speed and focus.

## Features

- **Lexend Mode:** Applies the Lexend font to typography elements to improve reading fluency, with adjustable font size, line spacing, and letter spacing.
- **Bionic Mode:** Bolds the first few letters of words to guide the eyes through text via artificial fixation points. Fixation level is adjustable.
- **Combined Mode:** Use both Lexend and Bionic modes simultaneously.
- **Presets:** Includes optimized presets such as ADHD Mode, Dyslexia Mode, and Speed Read.
- **Reading Stats:** Displays the estimated word count and reading time of the current page.
- **Auto Dark/Light Theme:** The popup UI automatically adapts to your system's color scheme.
- **Dynamic Content Support:** Applies formatting automatically to new text loaded dynamically (e.g., infinite scroll on Reddit or Twitter).

## How to Load in Chrome

Since this extension is distributed as source code, you must load it "unpacked":

1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle in the top right corner.
4. Click the **Load unpacked** button.
5. Select the `readshift` folder containing this `README.md` and the `manifest.json` file.
6. The extension is now installed! You can pin it to your toolbar for easy access.

## Known Limitations

- **No PDF Support Yet:** The extension cannot format text inside PDF viewers.
- **No Firefox Port:** Currently Manifest V3 for Chrome only.
- **Requires Internet:** The Lexend font is currently loaded via Google Fonts CDN, which requires an active internet connection.

## v2 Roadmap

- PDF Support integration.
- Firefox port (adapting to Manifest V2 or Firefox's MV3 implementation).
- Save Custom Presets functionality.
- Bundle the Lexend font offline for use without an internet connection.
