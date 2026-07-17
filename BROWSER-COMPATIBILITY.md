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
