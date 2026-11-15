# Changelog
All important changes to the ProtonDB Badges plugin are documented here.

## [1.4.0] - 2026-11-15

Thanks for all the feedback & big thanks to the contributors.

### Store page badge
- Size and position settings for the store badge — independent of the library badge, same six positions, defaults to Bottom Middle. (Kenneth Thomson, #20)
- No more stale badge when the store opens — the store could briefly show the previous game's rating. (Kenneth Thomson)
- Fixed a CEF debugger WebSocket leak — every store visit opened a socket that was never closed. (Kenneth Thomson, #19)
- Badge still appears when the store page goes quiet — falls back to the URL from the tab list after 1s instead of showing nothing. (Bart S)
- Exponential backoff on debugger reconnects — 1s, 2s, 4s capped, instead of burning all five attempts in three seconds. (Bart S)

### Library grid status icons
- Status icons on game covers, with an option to show them only on the focused game. (David Beall, #8)
- Icons are cleaned up properly when the feature is switched off — they used to linger. (David Beall)
- Fixed: icons stayed visible after turning off "Show Analysis Button" — they belong to that feature and now hide with it. (Bart S, #11)
- New default: focus-only icons are now ON for fresh installs. (Bart S, based on the work of David Beall, #8)
- Cosmetic fix for small icon. (Bart S, #4)

### Proton versions
- Proton version now applied correctly from the analysis modal — two commits on the same bug. (Bart S)
- Launch options and compat tools can be applied directly from the analysis modal, instead of setting them by hand in Steam. (Bart S)

### Settings panel
- Sections are now collapsible (Store, Enhanced Features, Links) — the QAM panel had grown too long. (Bart S)
- The About section is always visible — it used to disappear in some states. (Bart S)
- Collapsible sections now line up with the rest of the panel — their contents were indented 4px instead of using Steam's own gutter. (Bart S)
- Plugin version in the QAM comes from package metadata instead of being hardcoded. (David Beall)
- Store badge size setting translated, and four unused position keys removed from all 29 locale files. (Bart S)
  ==> ****Note: Translations done with Google Translate, scripted***

### Build and housekeeping
- CI now matches the latest Decky store builder — Node 26, pnpm 12.18.0. (Bart S)
- Dependency pins actually take effect now (Bart S)
- Fixed a .gitignore rule that could have excluded a newly added localisation file. (Bart S)
- Removed an unused json import, general maintenance. (Bart S)

### Other
- Reverted the useParams fallback — a this was only a temporary solution (Bart S)
- relabel enableLibraryBadge → "Enable Badge on Game Page", move the three icon settings into the Library section (Bart S, #18)
  ==> ****Note: Translations done with Google Translate, scripted***
- Fix some minor old clearing protondb cache issue (Bart S, #21)
- Removed instructions helpmodal, and replacing it by a link to the instructions page.
  Reason: updating the plugin for changing the instructions is a burden for everyone. By pointing to a weblink, we can change it without updating the plugin all the time, decrease plugin size , and we can ask web dev team to update the pages, without the need to Decky plugin coding knowledge.

## [1.3.3] - 2026-05-21
### Fixed
- delivery fixes

## [1.3.0] - 2026-01-24
### Added
- **Enhanced Badge System** - Integration with ProtonDB Gateway for advanced compatibility insights
- **Confidence Indicators** - Visual 5-dot system showing reliability of ratings (high/medium/low/none)
- **Trend Arrows** - Displays if compatibility is improving (↗), stable (→), or declining (↘)
- **Contextual Warnings** - Hover tooltips showing alerts for stale data, Proton version mismatches, GPU issues, and anti-cheat
- **Enhanced Features Settings Panel** - Individual toggles to control confidence, trend, and warning displays
- **Confidence Display Styles** - Choose between dots or text visualization for confidence levels
- **Graceful Fallback** - Maintains tier-only display when gateway unavailable or for unsupported games
- **ProtonDB Gateway API Integration** - Fetches pre-computed analysis data with confidence scores, freshness info, and trends

### Technical
- Created gateway API client with timeout and error handling
- Extended cache to store analysis data alongside tier information
- Added TypeScript interfaces for gateway responses
- Implemented glassmorphic styling for new UI components
- Enhanced features automatically hidden in minimalist/compact mode

## [1.2.0] - 2025-12-30

- Changing release numbers & repo for Decky store submission

## [0.0.7] - 2025-12-28
### Added
- timeout for ProtonDB API requests to avoid slow page loads
- GitHub button in settings to quickly access the project repository
- "How to Use" help page with instructions on using the plugin and registering Steam Deck on ProtonDB
- font synced on storage page
- System info added.

## [0.0.6] - 2025-12-28
### Added
- Toggle to enable/disable library page badges.
- Reorganized settings into "Library" and "Store" section, as I think that will be easier in the future.
- Updated screenshot & added screenshot in store page.

### Fixed
- Fixed default values for enableLibraryBadge and enableStoreBadge (now enabled by default)
- Fixed missing translations in DE, FR, ES, NL, IT, PT, PT-BR locale files (still autogenerated!)
- Increased store badge icon size to match library badge

### Known issues
- With external controller it is impossible to open the store badge. (on-screen you can click on it, opening protondb)

## [0.0.5] - 2025-12-28
### Added
- ProtonDB badge overlay on Steam store pages. (!!!)
- Toggle to enable/disable store page badges
- Smooth slide-in/out animations for store overlay
- Option to position badges at bottom of hero image (bottom-left, bottom-middle, bottom-right)
- Dynamic hero height detection for accurate bottom positioning
- Black border on badges when focused/selected
- Controller navigation support between badges
- Renamed plugin from "ProntonDB Decky eXtented" to "ProntonDB eXtended" in Decky.

### Known issues
- Store page/Library badges disabled by default
- With external controller it is impossible to open the store badge.

### Fixed
- Fixed plugin loading issue with Decky's install from zip feature
- Removed outdated pnpm-lock.yaml causing false security alerts
- Hide badges for non-Steam games in library

## [0.0.4] - 2025-12-27
### Added
- Option to center the badges.
- Implemented a check that warns the user if the original plugin is still installed.
- Minor tweak to the badge.
- Fixed an issue when navigating to the badges using a controller.

### Fixed
- Security issue: DOM Clobbering Gadget found in rollup bundled scripts that leads to XSS  (protondb-badges)
- Security issue: glob CLI: Command injection via -c/--cmd executes matches with shell:true (protondb-badges)
- Security issue: Regular Expression Denial of Service (ReDoS) in cross-spawn. (protondb-badges)
- Security issue: js-yaml has prototype pollution in merge. (protondb-badges)

Option to move the badges to the bottom of the hero image.

## [0.0.3] - 2025-12-25
### Added
- Removed the border from the submit button to match other buttons.
- When no report is available, display a *NO REPORT** button and show the submit button.
- Changed the submit button background color.

### Fixed
