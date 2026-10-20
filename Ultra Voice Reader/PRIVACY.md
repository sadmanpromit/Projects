# Ultra Voice Reader — Privacy Policy

**Publisher:** Computation Corporation  
**Last updated:** 20 October 2026  
**Applies to:** Ultra Voice Reader Chrome extension, published v1.8.18 and planned v1.8.35 drag-and-drop and optional advertising update; differences are identified below.

Ultra Voice Reader reads text aloud at the user's request. It does not require an account, and Computation Corporation does not operate a service to collect or store the passages you read.

## Information processed

- **Selected text:** When you click **Read selected** or use an assigned selection keyboard shortcut, the extension accesses the selected text on the current accessible webpage.
- **Webpage text:** When you click **Read this tab**, the extension extracts available text from that tab. Some supported documents (including accessible text-based PDF, DOCX and text URLs) may need a document request with the appropriate Chrome permissions. Protected viewers and scanned PDFs may not be supported.
- **Clipboard text:** The extension reads your clipboard when you click **Read clipboard** or use an assigned clipboard keyboard shortcut; it does not continuously monitor your clipboard.
- **Reading List and preferences:** Extracted or copied passages, bookmarks and reading progress, pinned entries, limited reading history and user settings are stored in Chrome's extension-local storage on your device. You can remove readings inside the extension, and Chrome normally removes the extension's local storage on uninstall.
- **Highlighting:** Word and passage highlights use local page text ranges and browser highlighting mechanisms. The extension does not transmit these highlights to a publisher-operated server.
- **Playback and media controls:** Reading uses Chrome text-to-speech voices. Compatible media-key Play/Pause controls are best effort and depend on Chrome and the device; this version does not use a synthetic silent-audio player. The extension does not record your microphone or audio output.

## Speech voice providers

Speech is performed through the voices offered by Chrome and your operating system. Some installed voices may use a remote service and may send the text being spoken to that voice provider, subject to that provider's privacy practices. Choose a local/offline voice if you want to avoid a remote voice provider.

## Fairpeers promotion and advertising

**Published v1.8.18:** A clearly identified first-party **Fairpeers** promotion may appear only while the Home reading preview is empty. The extension includes a dormant PlayaYield SDK, but v1.8.18 does **not** make PlayaYield production advertising requests. Fairpeers does not receive your copied text, passages, source URLs, bookmarks or reading history from this promotion. Following the Fairpeers link opens an external site only when clicked.

**Planned v1.8.35 (not published as of this update):** Ultra Voice Reader is a free, advertising-supported text reader. On first installation, the extension opens a one-time welcome screen requiring the user to agree to ad-supported service conditions, including the advertising data processing disclosed here, before reader features can be used. Users updating from an earlier version must accept the changed agreement once; prior optional-ad choices are not accepted as this new agreement. There is no separate optional ad switch: users who do not accept cannot use the reader and may uninstall it. Acceptance is locally recorded using `welcomeAgreementVersion=ad-supported-2026-10`, `welcomeAccepted=true` and `sponsoredAdsConsent=granted`. Before the new agreement is saved, the PlayaYield advertising SDK is not initialized and no ad requests are initiated. After acceptance, an available PlayaYield (PlayaNext LLC) advertisement may appear in the empty Home preview and replace the Fairpeers house promotion. Ads are hidden while reading and never inserted into websites. No-fill or offline operation displays Fairpeers instead. PlayaYield may process IP address, approximate location, browser/device details, ad impressions and clicks, advertising identifiers, and share related information with advertising/demand partners. We do not submit reading text, clipboard contents, source URLs, Reading List items, bookmarks, or reading history as ad request parameters. Uninstalling cannot undo information already transmitted to the advertising provider. Mandatory consent to this advertising use may not satisfy Chrome Web Store policies or applicable requirements for freely given consent.\n\nPlayaYield's policy: https://www.playayield.com/privacy. Unpacked development installs use the provider test/mock key; the registered Chrome Web Store ID uses its configured publishable production key. Google Chrome voice providers may independently process requested speech text, as disclosed above. The publisher must still meet Chrome Web Store data-use and transfer restrictions and any applicable notice/consent requirements; this document does not certify the provider's independently unverified data transfers.

## Document reopening

When a user reopens an unchanged supported document and chooses **Read this tab** again, the extension can restore its saved reading position from Chrome-local storage. It compares the source location and locally extracted text; the feature does not automatically monitor files or upload document contents.

## Permissions

Ultra Voice Reader requests `storage` (save locally stored readings, bookmarks, settings and history), `clipboardRead` (read clipboard on user request), `activeTab` and `scripting` (extract and highlight readable page text after an explicit action), `offscreen` (temporary document for user-invoked clipboard shortcuts, not background audio playback), `tts` (speech synthesis), and `notifications` (explain how to enable file access if needed). Optional website and local-file host access is requested for supported documents only when needed. You can review or revoke permissions in Chrome extension settings.

## Local data retention and controls

Reading passages, progress bookmarks and preferences are saved in Chrome extension-local storage. Saved reading content remains there until the user removes it, clears eligible Reading List entries, or uninstalls the extension. When completion history is enabled, up to five unpinned completed items are retained; pinned items are retained separately until removed. Computation Corporation does not operate a central service that collects this extension's reading passages. Voices available through Chrome may process text according to their separate provider policies.

## Chrome Web Store Limited Use

Ultra Voice Reader uses reading text and associated Chrome API data only for user-requested reading and related functionality. Computation Corporation does not sell extracted reading text, use it to target personalized advertising, or routinely access users' locally saved reading passages. PlayaYield ad processing in the planned release begins only after a combined ad-supported service agreement, and may involve technical data and onward sharing as described above. This bundled agreement may not satisfy legal or Store requirements for consent. The compatibility of those onward transfers with Chrome Web Store Limited Use requirements is under review and must be resolved before publication; this policy does not certify independent third-party practices.

## Reading opened documents

Read this tab processes an accessible PDF, DOCX, TXT or Markdown document already opened in Chrome using its document URL and required extension permissions. It may display extracted text in a companion reader, because Chrome's built-in PDF viewer does not allow extensions to highlight directly inside every document. The extension does not scan folders or upload documents.

## Contact for privacy and support

Publisher: **Computation Corporation**. For support and privacy requests, email **ultravoicereader@gmail.com**, the verified Chrome Web Store publisher contact for Computation Corporation. This is separate from Fairpeers.

This policy will be updated if the extension's information practices change.


## Google Docs export redirects

When a user explicitly selects **Read this tab** on an open Google Docs document, the extension may ask Chrome for optional access to `docs.google.com` and `*.googleusercontent.com`. Google can redirect an authorized document export to a signed Googleusercontent download address. Its text is processed in the extension and stored under the local reading controls above, not uploaded to Computation Corporation. If access is denied or exporting is restricted, the user can open an accessible document URL and use **Read this tab** instead.
