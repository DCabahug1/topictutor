// Sample content for the Almanac screens, taken from the reference designs in
// docs/design/reference. It stands in for generated lessons until the real
// data layer exists.

import type { ChoiceQuestion, Subject } from "../types";

// ---- Today's lesson ----

export const DAILY = {
  subject: "Science" as Subject,
  title: "Why leap years exist",
  minutes: 3,
  deeperTopic: "calendars and time",
  askHint: "Why 400 and not 500?",
  paragraphs: [
    "A year is about 365 and a quarter days long, not 365. So a 365-day calendar drifts behind the seasons by nearly six hours a year, a whole day every four years.",
    "Julius Caesar fixed it by adding a leap day every fourth year. That overshoots by about eleven minutes a year. By 1582 the calendar was ten days off.",
    "The Gregorian rule trims the overshoot. Century years skip the leap day unless they divide by 400. So 1900 had none, but 2000 did. That keeps the calendar on track for about 3,000 years.",
  ],
  check: [
    {
      prompt: "Why does the calendar need leap years at all?",
      correctIndex: 1,
      options: [
        "Earth’s orbit is slowly getting longer",
        "A solar year is about a quarter of a day longer than 365 days",
        "The Moon’s cycle does not fit evenly into 12 months",
        "To keep February from drifting into spring",
      ],
      explanation:
        "A year is about 365.2422 days, so a 365-day calendar falls behind by almost six hours a year.",
    },
    {
      prompt: "Which of these years was a leap year?",
      correctIndex: 3,
      options: ["1700", "1800", "1900", "2000"],
      explanation: "2000 divides evenly by 400. The other three are century years that skipped the leap day.",
    },
  ] satisfies ChoiceQuestion[],
  answers: {
    question:
      "Because 400 gets the average year very close to the real one. Over 400 years the rule leaves 97 leap days, so the average calendar year is 365.2425 days. That is only about 26 seconds longer than the solar year.",
    differently:
      "Think of the calendar as a clock that runs slightly slow. Adding a day every four years makes it run slightly fast instead. Skipping three of those extra days every 400 years slows it back down, so it stays almost exactly on time.",
  },
};

export const RECALL = {
  subject: "Finance" as Subject,
  question: {
    prompt: "When interest compounds monthly instead of yearly, what happens to the total after one year?",
    correctIndex: 1,
    options: [
      "It stays the same",
      "It ends up slightly higher",
      "It ends up slightly lower",
      "It depends on the starting amount",
    ],
    explanation: "Each month’s interest starts earning interest too, so the total grows a little faster.",
  } satisfies ChoiceQuestion,
};

/** Past daily lessons, newest first. `daysAgo` is counted back from today. */
export const PAST_DAILY: Array<{ daysAgo: number; subject: Subject; title: string; done: boolean }> = [
  { daysAgo: 1, subject: "Finance", title: "How compound interest compounds", done: true },
  { daysAgo: 2, subject: "History", title: "Why the printing press spread so fast", done: true },
  { daysAgo: 3, subject: "Literature", title: "Where Shakespeare’s new words came from", done: true },
  { daysAgo: 4, subject: "Technology", title: "What a password hash actually stores", done: false },
  { daysAgo: 5, subject: "Arts", title: "How painters rediscovered perspective", done: true },
];

// ---- The web development series ----

export const WEB_TOPIC = "Basics of Web Development";

export const PLACEMENT_TEST: ChoiceQuestion[] = [
  {
    prompt: "When you type a web address and press Enter, what does your browser send first?",
    level: "easy",
    topic: "how a page is requested",
    correctIndex: 0,
    options: ["An HTTP request to a server", "A copy of the page’s HTML", "A CSS file", "A JavaScript program"],
    explanation: "The browser asks a server for the page. HTML, CSS and scripts come back in response.",
  },
  {
    prompt: "What is HTML mainly for?",
    level: "easy",
    topic: "what HTML is for",
    correctIndex: 1,
    options: [
      "Styling colors and fonts",
      "Describing the structure and meaning of content",
      "Storing data on the server",
      "Making pages interactive",
    ],
    explanation: "HTML says what each piece of content is. CSS styles it and JavaScript makes it interactive.",
  },
  {
    prompt:
      "A paragraph has the id intro and sits inside an element with the class note. One rule targets .note p and makes it blue. Another targets #intro and makes it red. What color is the paragraph?",
    level: "hard",
    topic: "which CSS rule wins",
    correctIndex: 1,
    options: [
      "Blue, because that rule comes first",
      "Red, because an id is more specific than a class and an element",
      "Blue, because it names two things",
      "Whichever rule is last in the file",
    ],
    explanation: "An id outweighs any number of classes and element names, so #intro wins wherever it appears.",
  },
  {
    prompt: "By default, what does an element’s width cover?",
    level: "medium",
    topic: "the box model",
    correctIndex: 0,
    options: [
      "The content only",
      "Content and padding",
      "Content, padding and border",
      "Content, padding, border and margin",
    ],
    explanation: "With the default box-sizing, width covers only the content. Padding and border are added on top.",
  },
  {
    prompt: "What is the DOM?",
    level: "hard",
    topic: "the DOM",
    correctIndex: 1,
    options: [
      "A file the server sends alongside the HTML",
      "The browser’s live tree of objects built from the HTML",
      "A JavaScript library for building pages",
      "Another name for a page’s CSS rules",
    ],
    explanation: "The browser builds the DOM as it reads the HTML, and scripts can change it while the page is open.",
  },
];

export type LessonContent = {
  title: string;
  description: string;
  askHint: string;
  paragraphs: string[];
  check: ChoiceQuestion;
};

export const WEB_LESSONS: LessonContent[] = [
  {
    title: "What happens when you type a web address",
    description: "The trip from the address bar to a server and back.",
    askHint: "What is an IP address, exactly?",
    paragraphs: [
      "When you press Enter, your browser first needs the server’s address. It asks the Domain Name System, which works like a phone book, to turn a name like example.com into a numeric IP address.",
      "With that address, the browser sends an HTTP request: a short message saying which page it wants. The server answers with a response, a status code such as 200 for success, and usually a document written in HTML.",
      "That HTML often points to more files, such as stylesheets, scripts and images. The browser requests each of them the same way, which is why a single page can involve dozens of small round trips.",
    ],
    check: {
      prompt: "What does DNS do?",
      correctIndex: 0,
      options: [
        "Turns a name like example.com into an IP address",
        "Stores the page’s HTML",
        "Decides how the page is styled",
        "Makes images load faster",
      ],
      explanation: "DNS works like a phone book for the web, matching names to numeric addresses.",
    },
  },
  {
    title: "HTML gives a page its structure",
    description: "Elements, nesting, and why the right tag matters.",
    askHint: "When should I use a div?",
    paragraphs: [
      "HTML describes what each piece of content is. A heading is marked as a heading, a paragraph as a paragraph, a list as a list. These pieces are called elements, and most have an opening and a closing tag.",
      "Elements nest inside each other, like a list item inside a list inside a section. This nesting gives the page a shape the browser can reason about, before any styling is applied.",
      "Choosing meaningful elements, such as nav for site links or button for actions, matters beyond looks. Screen readers, search engines and keyboard users all rely on that meaning to understand the page.",
    ],
    check: {
      prompt: "Why does choosing a nav element over a plain div matter?",
      correctIndex: 1,
      options: [
        "It makes the links blue",
        "It tells browsers and assistive technology what the content is",
        "It loads faster",
        "CSS requires it",
      ],
      explanation: "The element’s meaning helps screen readers, search engines and keyboard users find their way.",
    },
  },
  {
    title: "How the browser decides which CSS rule wins",
    description: "Specificity, order, and the cascade.",
    askHint: "How do I count specificity?",
    paragraphs: [
      "CSS rules often disagree. One rule might make a paragraph blue while another makes it red. The browser settles this with the cascade, a set of tie-breakers applied in a fixed order.",
      "The main tie-breaker is specificity. An id selector outweighs any number of classes, and a class outweighs any number of element names. So a rule aimed at #intro beats one aimed at .note p, wherever each appears.",
      "Only when two rules are equally specific does order decide, and then the later one wins. Inline styles and the important flag sit above all of this, which is why they are best kept for rare cases.",
    ],
    check: {
      prompt: "Two equally specific rules disagree. Which one wins?",
      correctIndex: 1,
      options: [
        "The first one in the file",
        "The later one in the file",
        "Neither, so the browser default applies",
        "The shorter one",
      ],
      explanation: "When specificity ties, source order breaks the tie and the later rule wins.",
    },
  },
  {
    title: "Boxes, flow and layout",
    description: "The box model and how elements take up space.",
    askHint: "Why does my box come out wider than I set?",
    paragraphs: [
      "To the browser, every element is a rectangle. Each box has content in the middle, then padding, then a border, then margin on the outside, which keeps neighbours at a distance.",
      "By default, the width you set covers only the content, so padding and border make the box wider than you asked. Setting box-sizing to border-box makes width include them, which is easier to reason about.",
      "Boxes then flow down the page in order. Block elements stack and take the full width, while inline elements sit side by side within a line of text. Layout tools like flexbox and grid change that flow.",
    ],
    check: {
      prompt: "What does box-sizing: border-box change?",
      correctIndex: 0,
      options: [
        "Width includes padding and border",
        "Margins are removed",
        "Borders become invisible",
        "Boxes sit side by side",
      ],
      explanation: "With border-box, the width you set is the width you get, padding and border included.",
    },
  },
  {
    title: "From HTML to pixels: the DOM and rendering",
    description: "How the browser turns code into what you see.",
    askHint: "What makes a page feel slow?",
    paragraphs: [
      "As the browser reads HTML, it builds the Document Object Model, or DOM: a live tree of objects, one for each element. Scripts can read and change this tree while the page is open.",
      "The browser combines the DOM with the CSS rules to work out each element’s style, then calculates where every box goes. This step is called layout. Painting then fills in the actual pixels.",
      "When JavaScript changes the DOM, the browser updates only what it needs to, sometimes redoing layout and paint. That is why a page can change without reloading, and why heavy changes can make it feel slow.",
    ],
    check: {
      prompt: "In rendering, what is layout?",
      correctIndex: 0,
      options: [
        "Working out where every box goes",
        "Downloading the HTML",
        "Running the page’s JavaScript",
        "Choosing which fonts to load",
      ],
      explanation: "Layout calculates each box’s size and position. Paint comes after it.",
    },
  },
];

export const WEB_MASTERY: ChoiceQuestion[] = [
  {
    prompt: "What does a server usually send back when a browser requests a page?",
    lessonNumber: 1,
    correctIndex: 0,
    options: ["A response containing HTML", "The DOM", "A picture of the page", "Only the CSS"],
    explanation: "The response carries a status code and, for a page, an HTML document.",
  },
  {
    prompt: "Why use a button element for an action instead of a styled div?",
    lessonNumber: 2,
    correctIndex: 1,
    options: [
      "It looks better by default",
      "Keyboards and screen readers know it is an action",
      "Divs cannot be clicked",
      "It loads faster",
    ],
    explanation: "A button is focusable and announced as a button, so everyone can use it.",
  },
  {
    prompt: "Which of these selectors is the most specific?",
    lessonNumber: 3,
    correctIndex: 2,
    options: ["p", ".note p", "#intro", "div p"],
    explanation: "An id selector outweighs classes and element names.",
  },
  {
    prompt: "With box-sizing: border-box, a box set to 200px wide with 20px of padding is how wide on screen?",
    lessonNumber: 4,
    correctIndex: 1,
    options: ["160px", "200px", "240px", "220px"],
    explanation: "Border-box puts the padding inside the 200px.",
  },
  {
    prompt: "A script changes the DOM. What happens to the page?",
    lessonNumber: 5,
    correctIndex: 1,
    options: [
      "Nothing until you reload",
      "The browser updates what is shown",
      "The HTML file on the server changes",
      "The CSS is discarded",
    ],
    explanation: "The DOM is live. The browser redoes only the layout and paint it needs.",
  },
];

export const WEB_SUGGESTIONS = [
  { title: "JavaScript and the DOM, hands on", why: "Builds on lesson 5." },
  { title: "Responsive layouts with flexbox and grid", why: "Picks up where lesson 4 stopped." },
  { title: "How browsers keep pages fast", why: "Goes deeper into rendering." },
];

/** A generic tutor answer for series lessons, which have no scripted answer. */
export const SERIES_ANSWERS = {
  question:
    "Good question. The short version is in the second paragraph: each step hands its result to the next one, and nothing later can run until the earlier step is done. Read that paragraph once more with your question in mind and the order should fall into place.",
  differently:
    "Picture ordering at a counter. You ask for something, the person behind it works out what you meant, fetches the parts, and hands them back in a fixed order. The lesson describes the same hand-offs, only between your browser and the pieces of a page.",
};

// ---- A returning learner's library ----

export type SeedSeries = {
  id: string;
  title: string;
  category: Subject;
  description: string;
  /** Lessons with their check answered. */
  lessonsDone: number;
  masteryBest: number | null;
  updatedDaysAgo: number;
  /** Lesson titles. The web series uses WEB_LESSONS instead. */
  lessonTitles?: string[];
};

export const SEED_LIBRARY: SeedSeries[] = [
  {
    id: "web",
    title: "How a Web Page Gets Built: HTML, CSS and the Browser",
    category: "Technology",
    description: "From the request your browser sends to the styled page on screen.",
    lessonsDone: 2,
    masteryBest: null,
    updatedDaysAgo: 0,
  },
  {
    id: "rome",
    title: "The Roman Republic, from Kings to Caesar",
    category: "History",
    description: "How a city-state governed itself for five centuries, and why it stopped.",
    lessonsDone: 3,
    masteryBest: null,
    updatedDaysAgo: 1,
    lessonTitles: [
      "How Rome got rid of its kings",
      "Consuls, the Senate and the assemblies",
      "What conquest did to the Roman farmer",
      "Why the Gracchi brothers frightened the Senate",
      "Caesar, the Rubicon and the end of the Republic",
    ],
  },
  {
    id: "sleep",
    title: "Sleep, Light and the Body Clock",
    category: "Health and Wellness",
    description: "Why mornings matter, what blue light really does, and how to reset after travel.",
    lessonsDone: 5,
    masteryBest: 3,
    updatedDaysAgo: 4,
    lessonTitles: [
      "The clock in your brain",
      "Why morning light sets the day",
      "What blue light really does at night",
      "Sleep pressure and the afternoon dip",
      "Resetting after a long flight",
    ],
  },
  {
    id: "balance-sheet",
    title: "Reading a Balance Sheet Without an Accounting Degree",
    category: "Finance",
    description: "Assets, liabilities and equity, and the three numbers worth checking first.",
    lessonsDone: 5,
    masteryBest: 5,
    updatedDaysAgo: 12,
    lessonTitles: [
      "What a balance sheet is a picture of",
      "Assets: what the company owns",
      "Liabilities: what it owes",
      "Equity: what is left over",
      "Three numbers worth checking first",
    ],
  },
  {
    id: "sourdough",
    title: "Why Sourdough Rises: Yeast, Bacteria and Time",
    category: "Science",
    description: "The living culture in a jar, and what temperature does to it.",
    lessonsDone: 0,
    masteryBest: null,
    updatedDaysAgo: 20,
    lessonTitles: [
      "What lives in a starter",
      "Yeast makes the gas",
      "Bacteria make the sour",
      "What temperature changes",
      "Reading a dough instead of a clock",
    ],
  },
  {
    id: "spanish-past",
    title: "Spanish Past Tenses: Preterite or Imperfect?",
    category: "Language",
    description: "A practical rule of thumb, the exceptions that matter, and lots of examples.",
    lessonsDone: 5,
    masteryBest: 4,
    updatedDaysAgo: 29,
    lessonTitles: [
      "Two pasts, two jobs",
      "The preterite: finished events",
      "The imperfect: the background",
      "Verbs that change meaning",
      "Telling a story with both",
    ],
  },
];

/** Lessons finished before the sample history starts, by subject. Feeds the stats page. */
export const SEED_SUBJECT_COUNTS: Array<[Subject, number]> = [
  ["Science", 31],
  ["History", 28],
  ["Technology", 26],
  ["Finance", 22],
  ["Literature", 18],
  ["Language", 16],
  ["Arts", 14],
  ["Health and Wellness", 13],
];

export const SEED_SUBJECTS: Subject[] = [
  "Science",
  "Technology",
  "History",
  "Finance",
  "Literature",
  "Language",
  "Arts",
  "Health and Wellness",
];

export const SEED_RECALL = { correct: 38, total: 46 };
export const SEED_LONGEST_STREAK = 52;

/** Body text for sample series that have titles but no written lessons of their own. */
export function placeholderLesson(title: string, seriesTitle: string): LessonContent {
  return {
    title,
    description: "A sample lesson.",
    askHint: "Can you give an example?",
    paragraphs: [
      `This is sample text for “${title}”, part of the series “${seriesTitle}”. In the finished product this lesson is written for you the first time you open it, using what your placement test showed.`,
      "A real lesson runs to three short paragraphs. The first sets up the idea, the second works through it, and the third ties it to something you already know, so there is always one clear thing to take away.",
      "Below the lesson you can ask the tutor a question, or ask for the same idea explained another way. Then one quick question checks the main point, and answering it marks the lesson as done.",
    ],
    check: {
      prompt: "How many short paragraphs does a lesson have?",
      correctIndex: 2,
      options: ["One", "Two", "Three", "Five"],
      explanation: "Every lesson is three short paragraphs, followed by one question.",
    },
  };
}
