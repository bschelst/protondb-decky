# ProtonDB Badges eXtended


Display tappable ProtonDB badges on your game pages, extended edition.


![ProtonDB Badges](./assets/screenshot.jpg)

## How it works

This plugin retrieves ProtonDB ratings from the ProtonDB API and overlays a tappable badge on the game page. Tapping the badge opens the corresponding ProtonDB page for the game.
This is an update to the protondb-decky plugin, extending it with a Submit button. It allows users to submit a report directly from their library.
The new submit button can be disabled in the settings.

## Why was the eXtended plugin created

I really like the protondb-decky plugin and consider it a must-have on my Steam Deck.
Recently, I noticed that the plugin is no longer maintained and has been archived. At the same time, I found the process of submitting ProtonDB reports rather cumbersome—opening a browser, searching for the game, and so on.
I wanted a more straightforward approach: the ability to submit a report directly from the game itself, with a simple button.

## Options

### Size
Choose between Regular, Small, and Minimalist (No text)

### Position
Place the badge around different corners of the game page header.

### Disable Submit
If you don't want to submit reports, you can disable the submit badge.


## Limitations

**Store Pages:** ProtonDB badges are currently **not supported on Steam store pages** due to Steam's security architecture. Store pages run in an isolated browsing context that cannot be accessed by Decky plugins. Badges work on **library game pages only**.

## Translations

Translations were changed/added using AI, beause I don't speak all those languages. If something is wrong, please let me know.

## Support

The plugin was tested on:
 - SteamOS 3.9 - Decky Loader v.3.2.1 - SteamClient023 - Steam Deck LCD. 
 - Ubuntu 25.10- Decky Loader v.3.2.1 - SteamClient023 
 - Bazitte 43 - Nvidia version - Decky Loader v.3.2.1 - SteamClient023 

As I don't have a Steam Deck OLED, I'm afraid I cannot test it on Steam Deck OLED. If that's a must, you can sponsor me ;)

## 💖 Sponsoring

If you find this project useful and would like to support its continued development, you can sponsor it using one of the platforms below.

Sponsorship helps with:
- Ongoing maintenance and bug fixes
- Adding new features and improvements
- Keeping the project free and open-source

Your support—small or large—is genuinely appreciated and helps keep this project moving forward.

### ❤️ Support the project

- 🐙 **GitHub Sponsors**
  https://github.com/sponsors/bschelst

- ☕ **Ko-fi**
  https://ko-fi.com/bschelst

- ☕ **Buy Me a Coffee**
  https://www.buymeacoffee.com/bschelst


## Decky Loader

This plugin requires [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader).

## 📦 Installation (Decky Loader)

Follow these steps to install **ProtonDB Badges eXtended** using Decky Loader, manually. (plugin is not available on the decky store yet)

### Requirements
- Steam Deck
- Decky Loader installed
- Steam Deck in **Game Mode**

### Installation steps

1. **Download the latest release**
   - Open the GitHub releases page:
     https://github.com/bschelst/protondb-decky-extended/releases
   - Download the **latest `.zip` file** from the most recent release.

2. **Open Decky Loader**
   - Switch to **Game Mode** on your Steam Deck.
   - Open the **Decky Loader** menu (⋯ button).

3. **Install the plugin**
   - Go to **Decky Settings** → **Plugins**.
   - Choose **Install from ZIP** (or **Upload Plugin**, depending on Decky version).
   - Select the downloaded `protondb-decky-extended-<version>.zip` file.

4. **Enable the plugin**
   - Once installed, ensure the plugin is enabled in Decky.
   - The ProtonDB Badges eXtended features will now appear automatically for supported games in your library.

