# YouTube Playlist Importer — v1.4.1

Chrome Manifest V3 side-panel extension for private use. This is an **independent** tool, not affiliated with or endorsed by Google or YouTube.

## Source repository and GitHub upload

This folder contains the complete unpacked Chrome extension. To add it to a multi-project GitHub repository, copy the **entire folder** into a subdirectory named `YouTube Playlist Importer/`. Keep `manifest.json`, all JavaScript/CSS/HTML files, `README.md`, `.gitignore`, and the `icons/` directory together. Chrome references these files by relative path.

This source is provided for inspection and personal use; **publishing the repository does not install or run the extension**, publish the user's workbook, or turn it into an official Chrome Web Store release. Do not commit personal Excel workbooks, exported activity logs, Google/YouTube cookies, browser profiles, authentication tokens, or other account data. `.gitignore` excludes common local artifacts but does not protect data already committed; review `git status` and the staged diff before publishing. No open-source license is granted merely by making a repository public.

**New installation:** Download/copy the full extension folder to a local directory. In Chrome, open `chrome://extensions/`, enable **Developer mode**, choose **Load unpacked**, and select the directory containing `manifest.json`. Open the extension side panel, set your target playlist in **Options**, and select a backed-up `.xlsx` or `.xlsm` workbook.

## Updating an existing installation

1. Back up the local import workbook. Do not update while the importer is actively writing it.
2. Replace the files in the existing unpacked extension directory with the complete updated folder, including `icons/`. Avoid switching to a new extension directory if you rely on a remembered workbook handle.
3. Open `chrome://extensions/`, find the existing extension and click **Reload**. Do **not** uninstall/reinstall to perform an update: a new extension ID can lose access to existing saved settings, the workbook handle, counters and recovery journal.
4. Open the extension side panel, go to **Options**, check its saved target playlist (set an exact playlist name on new installations), and reselect the Excel workbook if Chrome requires it.

## Excel workbook structure

- Accepted formats: `.xlsx` (recommended if you do not need macros), or `.xlsm` (macro-enabled). Real OOXML Excel files only; renaming `.csv` to `.xlsm` does not work.
- The easiest structure is a header in row 1 and **one YouTube video per row starting at row 2**:

  | A — Song | B — Video URL |
  | --- | --- |
  | Example song | `https://www.youtube.com/watch?v=dQw4w9WgXcQ` |
  | Another example | `https://youtu.be/9bZkp7q19f0` |

- **Alternative:** only column A is needed if each song-title cell is a real Excel hyperlink whose target is the direct YouTube video URL. A cell containing a raw `youtube.com/watch?v=...` or `youtu.be/...` URL is also accepted.
- A traditional `HYPERLINK("https://...", "Song title")` Excel formula is accepted.
- The workbook filename and sheet name are **not fixed**. The importer chooses the worksheet with the most recognizable YouTube video URLs (or the journal's previous worksheet when resuming).
- Do not supply YouTube search, playlist, Shorts, channel, or music-platform URLs; use individual video watch links.
- An optional `Status` (or `Playlist Status`) header can designate a status column. Entries marked `added`, `done`, `complete`, `completed` or `already added` are skipped. You do **not** have to create this column for a simple import.
- **Critical:** after a video is confirmed saved to the chosen playlist, the importer removes the **entire corresponding worksheet row** and shifts every following row/hyperlink up, then rereads the file to verify the write. Have a separate backup. Do not edit the file in another program during an import.
- Macros in an `.xlsm` archive are carried through, but Excel's signed VBA documents can lose their digital signatures when edited.

## Using the extension

- **Home**: see queue progress; Start queue / Pause / Retry current.
- **Options**: choose the local workbook; edit **Target playlist** name (exact-match name in your signed-in YouTube account) and click **Save name**; set 2–20 second delay.
- **Activity**: inspect log, **Export log**, or **Clear log**. Clearing only deletes saved activity messages; it never resets the workbook, queue, counters or transaction recovery.
- **About**: operating guidance, required workbook structure and safety notes.
- New installations must set the target playlist name under **Options**. Upgrades with an existing remembered workbook preserve the previous default playlist automatically; previously saved names take precedence. The setting persists locally.
- The importer opens a muted YouTube watch tab, attempts to use YouTube's native Save controls, and independently confirms membership. It never intentionally toggles off an already selected playlist entry. It retries a total of three times with increased UI settling periods before pausing and notifying you. The workbook is modified **only after confirmation**.
- Do not change the target playlist during an import or while a verified workbook write is pending recovery. Switching playlists **does not restore links already deleted** from your workbook.

## Window management and reliability

- **Keep the Chrome window containing the extension side panel maximized and open during the queue.** Do not maximize any other application or browser window above it or fully cover it.
- You may use your device with other **windowed, non-maximized applications or browser windows/tabs**, provided the importer window remains visible, the side panel stays open and the queue is not interrupted.
- This is a best-practice recommendation, not a guarantee: Chrome can throttle background tabs, and YouTube can delay or change controls. If the queue pauses, check Home / Activity before retrying.

## Limitations and release caution

- Chrome File System Access may request permissions again after restart. Keep the side panel open while importing; Chrome and YouTube may throttle background UI, and changes to YouTube's controls can break automatic interaction.
- No direct YouTube Data API calls. No YouTube video or audio copying or downloading. The workbook remains on the user's device, and operational logs/counters are stored in `chrome.storage.local`.
- **Not recommended for public Chrome Web Store distribution in this form**. Automated interaction with YouTube may be subject to YouTube Terms of Service restrictions; hosting source code on GitHub does not authorize that interaction. For public distribution, implement authorized YouTube Data API + OAuth playlist operations, with correct consent/privacy disclosures and narrower permissions. Public distribution would require a separate compliance review.
