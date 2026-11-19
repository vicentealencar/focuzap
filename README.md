<p align="center">
  <img src="icons/icon.svg" width="96" height="96" alt="Focuzap logo">
</p>

<h1 align="center">Focuzap</h1>

<p align="center">
  <b>WhatsApp Web without the distractions.</b><br>
  No chat list, no unread badges, no notifications. Search for who you need, talk, leave.
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/focuzap/ejgjjcoifiomelijfinmfdckbpchofdh"><b>Add to Chrome</b></a> ·
  <a href="#install">Install</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="PRIVACY.md">Privacy</a> ·
  <a href="LICENSE">MIT License</a>
</p>

---

## Why

You open WhatsApp Web to send one message. Then you see 14 unread chats, three groups with red badges and a Status ring, and twenty minutes go by.

Focuzap is a small Chrome extension that removes the parts of WhatsApp Web that pull you in. What's left is a search box: you type a name, open that chat, talk, and close it. The rest of your inbox stays hidden until you look for it.

## Features

While focus mode is on:

- **No chat list.** The list of conversations is hidden. It only appears while you type in the search box, and then it shows only the matches.
- **Open a chat by phone number.** Type a number with its country code (for example `5511999998888`) and click *Open chat with +…*. This also works for numbers that aren't in your contacts.
- **No badges or rails.** The side header and menu, the filter chips (All / Unread / Groups…) and the left rail (Status, Channels, Communities and their badges) are hidden.
- **No unread counters in the tab.** `(3) WhatsApp` becomes `WhatsApp`, and the favicon is locked to the Focuzap icon, so a background tab can't call you back.
- **No notifications or UI sounds.** Desktop notifications and WhatsApp's interface sounds (new message, sent, and so on) are blocked. Voice notes and videos still play.
- **Search clears itself.** Once you open a chat, the search box empties and the results disappear.
- **Pausing is temporary.** If you need the full WhatsApp, the toolbar button pauses focus mode for 5 or 15 minutes. Focus mode turns itself back on when the time is up, so you can't forget it off.

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| `Ctrl+K` (`Cmd+K` on Mac) | Focus the search box and select the current query, so you can type a new name right away. Added by Focuzap. |
| `↓` then `Enter` | Move into the search results and open one. WhatsApp's own behaviour. |
| `Esc` | Close the current chat. WhatsApp's own behaviour. |
| `Ctrl+Alt+/` | Focus search. WhatsApp's own behaviour. |
| `Ctrl+Alt+N` | Normally opens "New chat", which shows your whole contact list. Focuzap sends it to search instead. |

## Install

### From the Chrome Web Store

**[Add Focuzap to Chrome](https://chromewebstore.google.com/detail/focuzap/ejgjjcoifiomelijfinmfdckbpchofdh)**. Also works in Edge, Brave and other Chromium browsers.

### From source

1. Download this repository ([zip](https://github.com/vicentealencar/focuzap/archive/refs/heads/main.zip)) or clone it:
   ```sh
   git clone https://github.com/vicentealencar/focuzap.git
   ```
2. Open `chrome://extensions` (or `edge://extensions` in Edge, `brave://extensions` in Brave).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the `focuzap` folder.
5. Open or reload [web.whatsapp.com](https://web.whatsapp.com).

On WSL, load the folder through its Windows path (for example `\\wsl$\Ubuntu\home\<you>\focuzap`) or copy it to a Windows drive first.

## How it works

Focuzap is plain JavaScript and CSS with no build step and no dependencies. It runs only on `https://web.whatsapp.com`.

```
manifest.json      Manifest V3
src/content.js     Hides UI, gates the chat list behind search, phone shortcut, title/favicon cleanup, shortcuts
src/focus.css      The hiding rules, all scoped under html.focuzap-on
src/page.js        Main-world script that silences the Notification API and UI sounds
popup/             Toolbar popup: pause / resume
icons/             icon.svg (master) and generated PNGs
tools/             Icon generator and packaging script
store/             Chrome Web Store listing text and promo images
```

A few details:

- **Stable hooks only.** WhatsApp Web's markup is obfuscated and changes often. Focuzap relies only on hooks that have been stable for years (`#side`, `#pane-side`, `#main`, `data-icon` attributes and the search box). It tags elements with `data-focuzap-*` attributes and lets `focus.css` hide them.
- **Instant pause.** Every rule is scoped under `html.focuzap-on`, so pausing removes one class and the stock UI comes back immediately, with no reload.
- **Notifications.** `src/page.js` runs in the page's own JavaScript world and replaces `Notification` and `ServiceWorkerRegistration.prototype.showNotification` with silent versions while focus mode is on.
- **Sounds.** WhatsApp's UI sounds are static audio files. Your media (voice notes, videos, GIFs) is decrypted in the browser and played from `blob:` URLs. Focuzap blocks `<audio>` playback of non-blob URLs only. Each blocked sound is logged as `[focuzap] muted UI sound:` in DevTools at the Verbose level.
- **Pause state** is a single timestamp (`pausedUntil`) in `chrome.storage.local`. Nothing else is stored.

## Privacy

Focuzap does not collect, store or send any data. It makes no network requests, has no analytics, and doesn't read your messages. It only changes how WhatsApp Web looks and behaves in your own browser. Its one permission, `storage`, is used to remember when a pause ends. See [PRIVACY.md](PRIVACY.md).

## Troubleshooting

WhatsApp ships redesigns now and then. If something that should be hidden shows up, or search stops working:

1. Make sure you're on the latest version of Focuzap.
2. Reload the WhatsApp tab.
3. [Open an issue](https://github.com/vicentealencar/focuzap/issues) describing what you see (a screenshot with your chats blurred helps a lot).

If you want to fix it yourself, start with `src/content.js` and `src/focus.css`.

## Contributing

Issues and pull requests are welcome. Keep it small and dependency-free:

- No build step, no frameworks, no remote code.
- Prefer stable hooks (`id`s, `data-icon`, ARIA roles) over WhatsApp's generated class names.
- Test with focus mode both on and paused, in light and dark theme.

Useful commands:

```sh
python3 tools/make_icons.py   # regenerate icons/*.png
./tools/package.sh            # build dist/focuzap-<version>.zip for the Chrome Web Store
```

## Disclaimer

Focuzap is an independent open-source project. It is not affiliated with, endorsed by, or sponsored by WhatsApp or Meta Platforms, Inc. "WhatsApp" is a trademark of its owner and is used here only to describe what the extension works with.

## License

[MIT](LICENSE) © 2026 Vicente Alencar Jr
