# Ultra Voice Reader — Privacy Policy

**Publisher:** Computation Corporation  
**Effective date:** 18 October 2026  
**Applies to:** Ultra Voice Reader Chrome extension, version 1.8.10 (free release)

Ultra Voice Reader reads text aloud at the user's request. It does not require an account, and Computation Corporation does not operate a service to collect or store the passages you read.

## Information processed

- **Selected text:** When you click **Read selected**, the extension accesses the selected text on the current accessible webpage.
- **Webpage text:** When you click **Read this tab**, the extension extracts available text from that tab. Some supported documents (including accessible text-based PDF, DOCX and text URLs) may need a document request with the appropriate Chrome permissions. Protected viewers and scanned PDFs may not be supported.
- **Clipboard text:** The extension reads your clipboard when you click **Read clipboard**; it does not continuously monitor your clipboard.
- **Reading List and preferences:** Extracted or copied passages, bookmarks and reading progress, pinned entries, limited reading history and user settings are stored in Chrome's extension-local storage on your device. You can remove readings inside the extension, and Chrome normally removes the extension's local storage on uninstall.
- **Highlighting:** Word and passage highlights use local page text ranges and browser highlighting mechanisms. The extension does not transmit these highlights to a publisher-operated server.
- **Playback and media controls:** Chrome text-to-speech voices and a bundled silent media asset support reading and compatible media controls. The extension does not record your microphone or audio output.

## Speech voice providers

Speech is performed through the voices offered by Chrome and your operating system. Some installed voices may use a remote service and may send the text being spoken to that voice provider, subject to that provider's privacy practices. Choose a local/offline voice if you want to avoid a remote voice provider.

## Fairpeers promotion and advertising

The free version may show a clearly identified first-party **Fairpeers** promotion, with a bundled papyrus logo and a link to **https://fairpeers.com/**, only while its Home reading preview is empty. The promotion does not use tracking pixels, make automatic advertising requests or share clipboard text, reading text, reading history, bookmarks or visited webpage URLs. Opening the link is a user-initiated navigation to a separate website, whose availability and privacy practices may differ.

A PlayaYield software module is bundled for a potential future release, but **live third-party ads are disabled in version 1.8.10** and no PlayaYield advertising requests are initiated in this release. If third-party advertising is activated in the future, this policy and the Chrome Web Store disclosures will be reviewed and updated first. Any such network may process technical information as separately disclosed in that later policy.

## Document reopening

When a user reopens an unchanged supported document and chooses **Read this tab** again, the extension can restore its saved reading position from Chrome-local storage. It compares the source location and locally extracted text; the feature does not automatically monitor files or upload document contents.

## Permissions

Ultra Voice Reader requests `storage`, `clipboardRead`, `activeTab`, `scripting`, `offscreen`, `tts` and `notifications` permissions to perform the user-requested reading and media functions described above. Optional website and local-file host access is requested when needed for supported documents. You can review or revoke permissions in Chrome extension settings.

## Local data retention and controls

Reading passages, progress bookmarks and preferences are saved in Chrome extension-local storage. Saved reading content remains there until the user removes it, clears eligible Reading List entries, or uninstalls the extension. When completion history is enabled, up to five unpinned completed items are retained; pinned items are retained separately until removed. Computation Corporation does not operate a central service that collects this extension's reading passages. Voices available through Chrome may process text according to their separate provider policies.

## Chrome Web Store Limited Use

Computation Corporation's use of information accessed through Chrome and Google APIs complies with the Chrome Web Store User Data Policy, including its Limited Use requirements. Ultra Voice Reader uses user content only for user-requested reading and related functionality; it does not sell that content or use it to target personalized advertising. The publisher does not routinely access users' locally saved reading passages.

## Direct file selection\n\nWhen the user chooses **Read file**, Chrome displays a local file picker. The selected PDF, DOCX, TXT or Markdown document is parsed in the extension, without uploading its contents or automatically monitoring local folders. Extracted text and bookmarks are stored and deleted under the same local-reading controls described above.\n\n## Contact for privacy and support

Publisher: **Computation Corporation**. For support and privacy requests, use the verified publisher contact listed on the Ultra Voice Reader Chrome Web Store page. This contact is separate from Fairpeers.

This policy will be updated if the extension's information practices change.


## Google Docs export redirects

When a user explicitly selects **Read this tab** on an open Google Docs document, the extension may ask Chrome for optional access to `docs.google.com` and `*.googleusercontent.com`. Google can redirect an authorized document export to a signed Googleusercontent download address. Its text is processed in the extension and stored under the local reading controls above, not uploaded to Computation Corporation. If access is denied or exporting is restricted, the user can download a document and select **Read file** instead.
