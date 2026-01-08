# ProtonDB Badges 🎮

[![Latest Release](https://img.shields.io/github/v/release/bschelst/protondb-decky?label=version)](https://github.com/bschelst/protondb-decky/releases)
[![License](https://img.shields.io/github/license/bschelst/protondb-decky)](LICENSE)
[![Decky Loader](https://img.shields.io/badge/Decky-Loader-blue)](https://github.com/SteamDeckHomebrew/decky-loader)

Display **tappable ProtonDB badges** directly on your Steam library game pages / Store pages.


 Library view:

![ProtonDB Badges](./assets/screenshot.jpg)

 Store view:

![ProtonDB Badges](./assets/screenshot_store.jpg)

---

## ⚙️ What it does

ProtonDB Badges retrieves ProtonDB ratings via the ProtonDB API and overlays them as a tappable badge on each game's library page. Tapping the badge opens the corresponding ProtonDB page.

This plugin is an actively maintained extension of the original *protondb-decky* plugin and adds a **Submit** button, allowing users to submit ProtonDB reports **directly from Game Mode**, from their library, without opening a browser.  
The submit button can be enabled or disabled in the plugin settings.

---

## ✨ Why this plugin exists

The original protondb-decky plugin is no longer maintained and has been archived. Additionally, submitting ProtonDB reports required several manual steps outside Game Mode.

This plugin was created to:
- Keep ProtonDB badges available on Steam Deck/Steam Client Picture Big mode.
- Simplify report submission.
- Allow submission to be done directly from the game page in Game Mode.
- Show badge on Steam Store page. (only on Steam Deck)

---

## 🛠️ Features & Options

- **Badge size**: Regular, Small, or Minimalist (icon-only)
- **Badge position**: Multiple positions around the game header. (Hero)
- **Submit button toggle**: Disable report submission if desired.
- **Library badge button toggle**: Disable the badges in library.
- **Store badge button toggle**: Disable the badge in Steam store pages.


---

## ⚠️ Limitations

**ProtonDB device registration**  
The first time you want to submit a report on Steam Deck, you will need to open the protondb website in desktop mode in order to register the Steam Deck.
This is a limitation of the protondb website, and this is only a one-time action.

**Steam Store page ProtonDB badges**  
- Currently the badges are visible as an overlay, which doesn't look the same as the badges on the library.
- It's currently not possible to click on the badge using an external controller.
- Protondb badges are not available in store pages on Linux/Bazitte, and will currently only work on Steam Deck. (I need to check the possibities to make it available on Bazitte too)

---

## 🌍 Translations

Some translations were added or updated using AI, as I don't know yet how Crowdine works.'   This is only temporary.
If you spot an incorrect or awkward translation, pull requests are welcome.

---

## 🧪 Compatibility & Testing

Tested on:
- **SteamOS 3.9** — Steam Deck LCD - Decky Loader v3.2.1 — SteamClient023
- **Ubuntu 25.10** — Steam Big Picture Mode - Decky Loader v3.2.1 — SteamClient023
- **Bazzite 43 (NVIDIA)** - Steam Big Picture Mode - Decky Loader v3.2.1 — SteamClient023

Steam Deck OLED has not been tested yet, because I don't own a Steam Deck OLED. Feel free to send me one.

---

## 💖 Sponsoring

If you find this plugin useful and want to support its continued development, you can sponsor me.

Your support helps with:
- Maintenance and bug fixes  
- New features and improvements  
- Ability to develop new plugins  

### ❤️ Support the project

- 🐙 **GitHub Sponsors**  
  https://github.com/sponsors/bschelst
- ☕ **Ko-fi**  
  https://ko-fi.com/bschelst
- ☕ **Buy Me a Coffee**  
  https://www.buymeacoffee.com/bschelst

---

## 🧩 Requirements

- Steam Deck or Linux PC using Steam Big Picture
- Decky Loader installed


Decky Loader:  
https://github.com/SteamDeckHomebrew/decky-loader

---

## 📦 Installation (Decky Loader)

Use Decky Store, search for ProtonDB badges or use manual instructions below:

1. Download the **latest `.zip` release**:
   https://github.com/bschelst/protondb-decky/releases

2. Open **Game Mode** and launch **Decky Loader**.

3. Enable developer mode in Decky Loader if not enabled yet.

4. Go to **Decky Settings → Plugins → Install from ZIP**.

5. Select the downloaded `protondb-decky-<version>.zip`.

6. Restart steam client.

The badges will appear automatically on supported games in your library.

### 🔄 Updating

To update, install the latest ZIP via Decky Loader.  
Existing settings are preserved.
