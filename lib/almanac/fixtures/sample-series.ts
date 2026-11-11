// The public sample series: anyone can open it and its checks work.
// Titles, descriptions and "why" lines are from docs/design/reference/DeskSample.dc.html.

import type { Subject } from "../types";
import type { LessonContent } from "./content";

export const SAMPLE_SERIES = {
  id: "sample",
  title: "How Bridges Stay Up: Forces, Shapes and Materials",
  category: "Science" as Subject,
  description:
    "Five lessons on why bridges look the way they do, from Roman arches to modern cable-stayed spans.",
  whys: [
    "In your own series, this line says which test question the lesson covers.",
    "A quick refresher for a learner who got question 2 right.",
    "Written for a learner who missed question 3.",
    "A quick refresher for a learner who got question 4 right.",
    "Written for a learner who missed question 5.",
  ],
  focus: [false, false, true, false, true],
};

export const SAMPLE_LESSONS: LessonContent[] = [
  {
    title: "Why anything stays up at all",
    description: "Forces, loads, and the two that matter most: tension and compression.",
    askHint: "Is gravity the only load on a bridge?",
    paragraphs: [
      "A bridge has one job: carry weight across a gap and pass it safely into the ground. That weight is called load. Some of it is the bridge itself, and some is whatever crosses it, from walkers to freight trains, plus wind pushing from the side.",
      "Inside the structure, load turns into two kinds of force. Compression squeezes material together, the way a column is squeezed by what sits on top of it. Tension pulls material apart, the way a rope is stretched by what hangs from it.",
      "Every bridge design is a way of steering those two forces through shapes and materials that can take them. Stone and concrete are strong when squeezed and weak when pulled. Steel cable is the opposite of a column: superb in tension, useless in compression.",
    ],
    check: {
      prompt: "A rope holding up a weight is mainly in which state?",
      correctIndex: 1,
      options: ["Compression", "Tension", "Both equally", "Neither"],
      explanation: "The weight pulls the rope apart along its length, which is tension.",
    },
  },
  {
    title: "Beams and the problem of bending",
    description: "Why a plank sags in the middle, and how shape fixes it.",
    askHint: "Why are steel beams shaped like the letter I?",
    paragraphs: [
      "The simplest bridge is a beam: a plank laid across a stream. Stand in the middle and it sags. The top of the plank is being squeezed shorter while the bottom is being stretched longer, so one piece of material carries compression and tension at once.",
      "The material near the middle of the plank’s depth does very little, because it is neither squeezed nor stretched much. That is the idea behind the I-beam. It puts most of its steel in the top and bottom flanges, where the forces are, and joins them with a thin web.",
      "Bending grows quickly with length. Double the span and the beam needs to be far deeper to sag the same amount, and at some point it can barely carry its own weight. That limit is why long bridges stop being simple beams and take other shapes.",
    ],
    check: {
      prompt: "When a beam sags under a load, what happens to its bottom edge?",
      correctIndex: 0,
      options: ["It is stretched, in tension", "It is squeezed, in compression", "Nothing, only the top works", "It twists"],
      explanation: "The top is squeezed and the bottom is stretched, so the bottom edge is in tension.",
    },
  },
  {
    title: "Arches: pushing instead of pulling",
    description: "How stone bridges stood for two thousand years without steel.",
    askHint: "What does the keystone actually do?",
    paragraphs: [
      "An arch solves the beam’s problem by changing the shape. Its curve turns the load into compression that runs along the arch and down into the ground at each end. Nothing in a well-shaped arch needs to be pulled, so nothing needs to resist tension.",
      "That suits stone perfectly. The Romans cut wedge-shaped blocks and set them over a wooden frame. Once the last block, the keystone, was in place, the frame came out and the blocks held each other up by pressing together. Many of those bridges still carry traffic.",
      "The price is at the ends. An arch pushes outward as well as down, so it needs heavy supports, called abutments, or solid rock to push against. Take those away and the arch spreads and falls. A row of arches helps, because each one pushes against its neighbour.",
    ],
    check: {
      prompt: "Why does an arch need strong abutments?",
      correctIndex: 2,
      options: [
        "To stop the keystone falling out",
        "To hold the wooden frame in place",
        "Because the arch pushes outward at its ends",
        "To keep water away from the stone",
      ],
      explanation: "An arch carries its load in compression and pushes outward as well as down, so the ends must resist that push.",
    },
  },
  {
    title: "Suspension and cable-stayed bridges",
    description: "Hanging a road from cables, and why the towers are so tall.",
    askHint: "Why are the cables so thick?",
    paragraphs: [
      "For the longest gaps, engineers hang the road instead of propping it up. In a suspension bridge, two main cables drape over tall towers and are anchored in the ground at each end. Smaller vertical cables hang from them and hold the deck.",
      "The forces split neatly. The cables are in tension along their whole length, which is exactly what steel wire does best. The towers are in compression, carrying the cables’ load straight down. The anchorages resist the pull at the ends.",
      "A cable-stayed bridge skips the main cables. Straight cables run directly from the towers to the deck in a fan. It uses less cable and needs no huge anchorages, which makes it cheaper for medium spans. The very longest crossings are still suspension bridges.",
    ],
    check: {
      prompt: "In a suspension bridge, what are the towers mostly resisting?",
      correctIndex: 0,
      options: ["Compression, pushing down", "Tension, pulling up", "Twisting from the cables", "Nothing, they are decorative"],
      explanation: "The cables pull down on the towers, which carry that load to the ground in compression.",
    },
  },
  {
    title: "When bridges fail",
    description: "Wind, resonance and fatigue, and what engineers learned from each.",
    askHint: "How do engineers test for wind now?",
    paragraphs: [
      "Bridges rarely fail because someone miscounted the weight on them. They fail from effects that were not well understood at the time. In 1940 the Tacoma Narrows Bridge twisted itself apart in a steady wind of about 40 miles an hour, four months after it opened.",
      "Its deck was slender and solid-sided, and the wind made it twist in a way that fed on itself. After that, long bridges were given stiffer, more open decks and were tested as models in wind tunnels before construction. That testing is now routine.",
      "A slower danger is fatigue. A load too small to break a part once can crack it after millions of repeats, as every passing truck flexes the same steel. That is why bridges are inspected on a schedule, and why a design life is stated in years rather than assumed to be forever.",
    ],
    check: {
      prompt: "What is metal fatigue?",
      correctIndex: 3,
      options: [
        "Rust eating through steel",
        "Steel softening in hot weather",
        "A bridge sagging under one heavy load",
        "Cracking caused by many repeated small loads",
      ],
      explanation: "Loads far below the breaking point can still crack a part if they repeat often enough.",
    },
  },
];
