import type { Topic } from "@/types";

export interface TopicMeta {
  id: Topic;
  title: string;
  shortTitle: string;
  description: string;
  order: number;
}

export const TOPIC_ORDER: Topic[] = [
  "introduction",
  "variables",
  "data-types",
  "input-output",
  "operators",
  "conditions",
  "switch",
  "for-loops",
  "while-loops",
  "do-while-loops",
  "functions",
  "arrays",
  "strings",
  "pointers",
  "structures",
  "oop",
  "classes",
];

export const topicMeta: Record<Topic, TopicMeta> = {
  introduction: {
    id: "introduction",
    title: "Introduction to C++",
    shortTitle: "Introduction",
    description: "Your first steps into the C++ programming language.",
    order: 1,
  },
  variables: {
    id: "variables",
    title: "Variables",
    shortTitle: "Variables",
    description: "Store and reuse data with variables.",
    order: 2,
  },
  "data-types": {
    id: "data-types",
    title: "Data Types",
    shortTitle: "Data Types",
    description: "Choose the right type for your data.",
    order: 3,
  },
  "input-output": {
    id: "input-output",
    title: "Input and Output",
    shortTitle: "I/O",
    description: "Talk to the program using cin and cout.",
    order: 4,
  },
  operators: {
    id: "operators",
    title: "Operators",
    shortTitle: "Operators",
    description: "Do math and comparisons like a calculator.",
    order: 5,
  },
  conditions: {
    id: "conditions",
    title: "If / Else",
    shortTitle: "Conditions",
    description: "Make your program make decisions.",
    order: 6,
  },
  switch: {
    id: "switch",
    title: "Switch",
    shortTitle: "Switch",
    description: "Choose between many cases cleanly.",
    order: 7,
  },
  "for-loops": {
    id: "for-loops",
    title: "For Loops",
    shortTitle: "For Loops",
    description: "Repeat code a fixed number of times.",
    order: 8,
  },
  "while-loops": {
    id: "while-loops",
    title: "While Loops",
    shortTitle: "While Loops",
    description: "Repeat code while a condition is true.",
    order: 9,
  },
  "do-while-loops": {
    id: "do-while-loops",
    title: "Do While Loops",
    shortTitle: "Do While",
    description: "Run the code at least once, then repeat.",
    order: 10,
  },
  functions: {
    id: "functions",
    title: "Functions",
    shortTitle: "Functions",
    description: "Reusable blocks of code that do one job.",
    order: 11,
  },
  arrays: {
    id: "arrays",
    title: "Arrays",
    shortTitle: "Arrays",
    description: "Store a list of values in one variable.",
    order: 12,
  },
  strings: {
    id: "strings",
    title: "Strings",
    shortTitle: "Strings",
    description: "Work with words and text.",
    order: 13,
  },
  pointers: {
    id: "pointers",
    title: "Pointers",
    shortTitle: "Pointers",
    description: "Variables that store memory addresses.",
    order: 14,
  },
  structures: {
    id: "structures",
    title: "Structures",
    shortTitle: "Structures",
    description: "Group different values into one type.",
    order: 15,
  },
  oop: {
    id: "oop",
    title: "Object-Oriented Programming",
    shortTitle: "OOP",
    description: "Think in objects and classes.",
    order: 16,
  },
  classes: {
    id: "classes",
    title: "Classes and Objects",
    shortTitle: "Classes",
    description: "Build your own types with data and functions.",
    order: 17,
  },
};

export const topicList: TopicMeta[] = TOPIC_ORDER.map((id) => topicMeta[id]);