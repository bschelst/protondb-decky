# Changelog
All notable changes to the Protondb-decky-eXtended plugin are documented in this file.

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

