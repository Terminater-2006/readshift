# Manual Test Cases

| # | Test | Steps | Expected Result |
|---|------|--------|-----------------|
| 1 | Font Injection | Enable Lexend mode on a news article | All body text changes to Lexend font |
| 2 | Bionic TreeWalker | Enable Bionic on a page with buttons and links | Only paragraph text is bolded; buttons/nav untouched |
| 3 | MutationObserver | Enable on Reddit/Twitter, scroll down | New posts receive formatting automatically |
| 4 | State Persistence | Change settings, close popup, reopen | All settings exactly as left |
| 5 | Undo/Restore | Toggle OFF after enabling Bionic | Page fully restored, no `<b>` tags remain, no reload needed |
| 6 | Dark Mode Theme | Open popup with OS in dark mode | Popup uses dark theme automatically |
| 7 | Iframe Safety | Enable on Google Docs | No errors; iframe content untouched |
