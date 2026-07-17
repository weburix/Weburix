# Browser and device verification

The code includes responsive fallbacks for small phones, tablets, desktop screens, touch devices, Safari/WebKit and Firefox. Static checks can catch broken files and syntax errors, but they cannot replace tests on real browsers.

Before launch, verify the deployed HTTPS site on:

- iPhone Safari in portrait and landscape
- Android Chrome in portrait and landscape
- current Firefox on desktop
- current Safari on macOS, if available
- current Chrome or Edge on desktop
- one tablet-width viewport around 768–1024 px
- keyboard-only navigation and visible focus states
- 200% browser zoom without horizontal page scrolling

Test language selection, privacy settings, every form, cart transfer, social links, legal pages and the 404 page. Repeat this after enabling Web3Forms, payment links, analytics or another external integration.

## Mobile repair pass (V17)

The final stylesheet now includes a dedicated phone/tablet layer for:

- compact 66px header with logo, language menu and hamburger controls
- one-column mobile navigation with scroll-safe dropdowns
- single-column forms, cards, checkout, contact and article layouts
- two-column compact statistics and horizontally scrollable teaser strips
- full-width mobile call-to-action and form buttons
- safe-area spacing for iPhone notches and home indicators
- compact chat, cookie banner and back-to-top controls
- reduced blur, disabled tilt and removed expensive hover effects on touch devices
- Safari/Firefox fallbacks and 100vh/100svh/100dvh handling
- prevention of address-bar resize events closing the mobile menu

Recommended final manual checks before launch: 320px, 360px, 390px, 430px, 768px and landscape phone widths.
