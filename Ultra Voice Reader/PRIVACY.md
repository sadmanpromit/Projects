# Ultra Voice Reader — Privacy Policy

**Publisher:** Computation Corporation  
**Last updated:** 26 October 2026  
**Applies to:** Ultra Voice Reader Chrome extension, including the v1.8.46 release candidate. Features described for v1.8.46 may not yet be available in the version currently published on the Chrome Web Store.

Ultra Voice Reader reads text aloud at the user's request. It does not require an account, and Computation Corporation does not operate a service to collect or store the passages you read.

## Information processed

- **Selected text:** When you click **Read selected** or use an assigned selection keyboard shortcut, the extension accesses the selected text on the current accessible webpage.
- **Webpage text:** When you click **Read this tab**, the extension extracts available text from that tab. Some supported documents (including accessible text-based PDF, DOCX and text URLs) may need a document request with the appropriate Chrome permissions. Protected viewers and scanned PDFs may not be supported.
- **Clipboard text:** The extension reads your clipboard when you click **Read clipboard** or use an assigned clipboard keyboard shortcut; it does not continuously monitor your clipboard.
- **Reading List and preferences:** Extracted or copied passages, bookmarks and reading progress, pinned entries, limited reading history and user settings are stored in Chrome's extension-local storage on your device. You can remove readings inside the extension, and Chrome normally removes the extension's local storage on uninstall.
- **Highlighting:** Word and passage highlights use local page text ranges and browser highlighting mechanisms. The extension does not transmit these highlights to a publisher-operated server.
- **Playback and media controls:** Narration uses Chrome text-to-speech (TTS). In the v1.8.46 candidate, the extension may create a temporary offscreen document with a near-silent HTML audio player and Media Session controls so compatible headset buttons can pause or resume narration. The player is not a recording tool and is stopped during narration teardown; Chrome or a headset may not always deliver every media-key event. The extension does not record your microphone or audio output.

## Speech voice providers

Speech is performed through the voices offered by Chrome and your operating system. Some installed voices may use a remote service and may send the text being spoken to that voice provider, subject to that provider's privacy practices. Choose a local/offline voice if you want to avoid a remote voice provider.

## Fairpeers promotion and advertising

Ultra Voice Reader is offered as a free, advertising-supported reader in its current v1.8.46 release candidate. Earlier releases included a first-party **Fairpeers** promotion and may have differed in when third-party advertising was enabled.

**Agreement before advertising:** When an installation has not accepted the current `ad-supported-2026-10` service agreement, the extension shows an agreement in the popup and blocks its reading features until the user accepts. This is one combined agreement for the advertising-supported service; the current implementation does not provide a separate optional third-party advertising switch. The acceptance is stored locally using `welcomeAgreementVersion`, `welcomeAccepted`, and `sponsoredAdsConsent`. Until the required agreement is accepted, the extension does not initialize the PlayaYield advertising SDK or initiate its ad requests. Users who do not wish to accept may stop using or uninstall the extension.

**Where ads appear:** After acceptance, an available advertisement from **PlayaYield (PlayaNext LLC)** may be shown in the empty Home reading preview. Ads are hidden while text is being read and are not injected into visited webpages. If an ad is unavailable or the user is offline, a Fairpeers promotion may appear instead. The registered Chrome Web Store extension uses the configured production advertising key; unpacked development installations use a test key.

**Advertising data:** For ad delivery and measurement, PlayaYield and participating advertising partners may process information such as your IP address, approximate location, browser or device details, advertising identifiers, ad impressions, and clicks; relevant advertising data may be shared with partners. The extension does **not** intentionally include selected text, webpage passages, clipboard contents, source URLs, Reading List entries, bookmarks, or reading history as advertising request parameters. This is a description of the extension's integration, not a guarantee about all independent third-party SDK or network behavior. Uninstalling cannot retract information already processed by an advertising provider.

**Provider privacy policy:** https://www.playayield.com/privacy. Please review that policy for the provider's own data practices.

## Document reopening

When a user reopens an unchanged supported document and chooses **Read this tab** again, the extension can restore its saved reading position from Chrome-local storage. It compares the source location and locally extracted text; the feature does not automatically monitor files or upload document contents.

## Permissions

Ultra Voice Reader requests `storage` (save readings, bookmarks, settings and history locally), `clipboardRead` (read clipboard after an explicit user action), `activeTab` and `scripting` (extract and highlight readable page text after an explicit action), `offscreen` (temporary document for clipboard access and the near-silent background media player supporting headset controls during narration), `tts` (speech synthesis), and `notifications` (help explain file-access requirements). It can request optional website and local-file access for supported documents when needed. You can review or revoke permissions in Chrome extension settings.

## Local data retention and controls

Reading passages, progress bookmarks and preferences are saved in Chrome extension-local storage. Saved reading content remains there until the user removes it, clears eligible Reading List entries, or uninstalls the extension. When completion history is enabled, up to five unpinned completed items are retained; pinned items are retained separately until removed. Computation Corporation does not operate a central service that collects this extension's reading passages. Voices available through Chrome may process text according to their separate provider policies.

## Chrome Web Store Limited Use and public availability

Ultra Voice Reader uses webpage, clipboard, and document text requested by the user for reading, highlighting, and related local reading-list functions. Computation Corporation does not sell extracted reading text, use that text to target personalized advertisements, or run a publisher-operated service to collect users' saved reading passages. Some system or Chrome voice providers may independently process the text supplied for narration, as described above.

The existing Ultra Voice Reader release **passed Chrome Web Store publication review** and is publicly listed. On October 26, 2026, the publisher also observed a genuine third-party sponsored advertisement in the extension and PlayaYield impression/click activity. **Public publication and operational live advertising are confirmed. No specific advertising-policy violation has been identified from the evidence reviewed.** The advertising integration operates under the disclosed ad-supported-service agreement. The separate v1.8.46 candidate requires its own update review. The publisher maintains accurate disclosures and addresses any concrete policy issue or reviewer feedback if one arises; publication is not a blanket certification of every independent third-party practice.

## Reading opened documents

Read this tab processes an accessible PDF, DOCX, TXT or Markdown document already opened in Chrome using its document URL and required extension permissions. It may display extracted text in a companion reader, because Chrome's built-in PDF viewer does not allow extensions to highlight directly inside every document. The extension does not scan folders or upload documents.

## Contact for privacy and support

Publisher: **Computation Corporation**. For support and privacy requests, email **ultravoicereader@gmail.com**, the verified Chrome Web Store publisher contact for Computation Corporation. This is separate from Fairpeers.

This policy will be updated if the extension's information practices change.


## Google Docs export redirects

When a user explicitly selects **Read this tab** on an open Google Docs document, the extension may ask Chrome for optional access to `docs.google.com` and `*.googleusercontent.com`. Google can redirect an authorized document export to a signed Googleusercontent download address. Its text is processed in the extension and stored under the local reading controls above, not uploaded to Computation Corporation. If access is denied or exporting is restricted, the user can open an accessible document URL and use **Read this tab** instead.
