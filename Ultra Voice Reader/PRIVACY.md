# Ultra Voice Reader — Privacy Policy

**Publisher:** Computation Corporation  
**Last updated:** 20 October 2026  
**Applies to:** Ultra Voice Reader Chrome extension, published v1.8.18 and planned v1.8.22 advertising update; differences are identified below.

Ultra Voice Reader reads text aloud at the user's request. It does not require an account, and Computation Corporation does not operate a service to collect or store the passages you read.

## Information processed

- **Selected text:** When you click **Read selected** or use an assigned selection keyboard shortcut, the extension accesses the selected text on the current accessible webpage.
- **Webpage text:** When you click **Read this tab**, the extension extracts available text from that tab. Some supported documents (including accessible text-based PDF, DOCX and text URLs) may need a document request with the appropriate Chrome permissions. Protected viewers and scanned PDFs may not be supported.
- **Clipboard text:** The extension reads your clipboard when you click **Read clipboard** or use an assigned clipboard keyboard shortcut; it does not continuously monitor your clipboard.
- **Reading List and preferences:** Extracted or copied passages, bookmarks and reading progress, pinned entries, limited reading history and user settings are stored in Chrome's extension-local storage on your device. You can remove readings inside the extension, and Chrome normally removes the extension's local storage on uninstall.
- **Highlighting:** Word and passage highlights use local page text ranges and browser highlighting mechanisms. The extension does not transmit these highlights to a publisher-operated server.
- **Playback and media controls:** Chrome text-to-speech voices and a bundled silent media asset support reading and compatible media controls. The extension does not record your microphone or audio output.

## Speech voice providers

Speech is performed through the voices offered by Chrome and your operating system. Some installed voices may use a remote service and may send the text being spoken to that voice provider, subject to that provider's privacy practices. Choose a local/offline voice if you want to avoid a remote voice provider.

## Fairpeers promotion and advertising

**Published v1.8.18:** A clearly identified first-party **Fairpeers** promotion may appear only while the Home reading preview is empty. The extension includes a dormant PlayaYield SDK, but v1.8.18 does **not** make PlayaYield production advertising requests. Fairpeers does not receive your copied text, passages, source URLs, bookmarks or reading history from this promotion. Following the Fairpeers link opens an external site only when clicked.

**Planned v1.8.22 (not published as of this update):** When the Home reading preview is empty, a clearly labeled first-party **Fairpeers** promotion appears immediately. If PlayaYield (**PlayaNext LLC**) returns a renderable 320×100 advertisement, it replaces the Fairpeers card. Only one ad is shown at a time; Fairpeers remains visible when offline, while the provider is loading, or if an ad is unavailable, times out or fails. Both are hidden when a reading starts. Neither the house promotion nor the PlayaYield advertisement is inserted into visited websites or shown during reading. The bundled SDK requests and measures ads through its network service; advertising requests include the extension ID, the ad placement and requested dimensions. Network requests inherently disclose IP address and may expose limited technical device/browser information to the provider. The provider receives ad delivery and measurement events (such as available advertisements, impressions, ad clicks and associated event identifiers, and possibly referrer metadata on a click); advertiser destinations may collect information under their own policies. We do **not** provide PlayaYield with extracted webpage text, clipboard text, reading contents, Reading List/bookmark data, or browsing history as advertising parameters. We do not sell or use these reading data for personalized ad targeting.

PlayaYield's privacy information: https://www.playayield.com/privacy. Ads use the existing popup preview only when idle, without external content-script ad injection. Unpacked development installs use PlayaYield's test/mock key; the registered Chrome Web Store extension ID uses its production publishable key. Ad service requests occur only in the version where live advertising is enabled; the published v1.8.18 release remains house-promotion-only. We will review consent obligations and Chrome Web Store privacy declarations before submitting v1.8.22 for review. Users can avoid receiving any ad requests from the extension by not opening the popup, or by uninstalling the extension.

## Document reopening

When a user reopens an unchanged supported document and chooses **Read this tab** again, the extension can restore its saved reading position from Chrome-local storage. It compares the source location and locally extracted text; the feature does not automatically monitor files or upload document contents.

## Permissions

Ultra Voice Reader requests `storage`, `clipboardRead`, `activeTab`, `scripting`, `offscreen`, `tts` and `notifications` permissions to perform the user-requested reading and media functions described above. Optional website and local-file host access is requested when needed for supported documents. You can review or revoke permissions in Chrome extension settings.

## Local data retention and controls

Reading passages, progress bookmarks and preferences are saved in Chrome extension-local storage. Saved reading content remains there until the user removes it, clears eligible Reading List entries, or uninstalls the extension. When completion history is enabled, up to five unpinned completed items are retained; pinned items are retained separately until removed. Computation Corporation does not operate a central service that collects this extension's reading passages. Voices available through Chrome may process text according to their separate provider policies.

## Chrome Web Store Limited Use

Computation Corporation's use of information accessed through Chrome and Google APIs complies with the Chrome Web Store User Data Policy, including its Limited Use requirements. Ultra Voice Reader uses user content only for user-requested reading and related functionality; it does not sell that content or use it to target personalized advertising. The publisher does not routinely access users' locally saved reading passages.

## Reading opened documents

Read this tab processes an accessible PDF, DOCX, TXT or Markdown document already opened in Chrome using its document URL and required extension permissions. It may display extracted text in a companion reader, because Chrome's built-in PDF viewer does not allow extensions to highlight directly inside every document. The extension does not scan folders or upload documents.

## Contact for privacy and support

Publisher: **Computation Corporation**. For support and privacy requests, email **ultravoicereader@gmail.com**, the verified Chrome Web Store publisher contact for Computation Corporation. This is separate from Fairpeers.

This policy will be updated if the extension's information practices change.


## Google Docs export redirects

When a user explicitly selects **Read this tab** on an open Google Docs document, the extension may ask Chrome for optional access to `docs.google.com` and `*.googleusercontent.com`. Google can redirect an authorized document export to a signed Googleusercontent download address. Its text is processed in the extension and stored under the local reading controls above, not uploaded to Computation Corporation. If access is denied or exporting is restricted, the user can open an accessible document URL and use **Read this tab** instead.
