# Manual QA checklist (iOS)

## Capture Flow
- [ ] Start a new draft, add a photo, close the app mid-draft, relaunch, and confirm the resume prompt appears.
- [ ] Resume the draft and confirm photos/audio/transcript fields are intact.
- [ ] Force an upload failure (offline or simulator network off), confirm the error message shows with **Try again** and **Save for later**.
- [ ] Tap **Try again** after restoring network and confirm the upload succeeds.
- [ ] Tap **Save for later** and confirm you return to Home with the draft still resumable.
- [ ] After a transcription failure, tap **Retry transcription** and confirm the request retries without re-uploading audio.
- [ ] Navigate back/forward between Photos → Record → Transcript → Privacy and confirm data persists.
