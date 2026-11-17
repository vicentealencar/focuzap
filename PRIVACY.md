# Privacy Policy

_Last updated: November 17, 2026_

Focuzap is a browser extension that changes how WhatsApp Web looks and behaves in your own browser. It is built to collect nothing.

## What Focuzap collects

Nothing. Focuzap does not collect, transmit, sell or share any personal data, browsing history, messages, contacts, phone numbers or usage statistics.

- It makes **no network requests**. It has no servers, analytics, tracking or advertising.
- It runs only on `https://web.whatsapp.com`.
- It hides and shows parts of the page and reads the text you type in WhatsApp's search box, so it can offer the "Open chat with +number" shortcut. That text never leaves your browser and is not stored.
- When you click "Open chat with +number", Focuzap navigates the tab to `https://web.whatsapp.com/send?phone=<number>`, the same address WhatsApp itself uses for click-to-chat. That request goes to WhatsApp, not to us.

## What Focuzap stores

One value, `pausedUntil`: the time at which a pause you started ends. It is kept in `chrome.storage.local` on your device and is never synced or sent anywhere. Uninstalling the extension deletes it.

## Permissions

- **`storage`**: to remember when a pause ends.
- **Access to `web.whatsapp.com`**: to hide distracting parts of the page and silence notifications and UI sounds on that site only.

## Changes

If this policy ever changes, the new version will be published in this file, in the extension's public repository at https://github.com/vicentealencar/focuzap.

## Contact

Questions? Open an issue at https://github.com/vicentealencar/focuzap/issues.
