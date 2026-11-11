# AskBox

The tutor inside every daily and series lesson: type a question or ask for the lesson to be explained differently, and get an answer based on that lesson.

- Lives below the third paragraph, inside the reading column, separated by a `rule` hairline. On desktop it can also open from a quiet "Ask" button pinned beside the column.
- States: empty, answering (text streams in with the vermilion caret), answered (follow-up field appears), failed (orange notice, the question is kept, Try again).
- The streaming answer is `aria-live="off"` while writing, then announced once as a status when complete.
- Conversations are not saved. The italic note says so, and leaving the lesson clears it.
- The consumer provides the lesson id, a submit handler and the streamed text.
