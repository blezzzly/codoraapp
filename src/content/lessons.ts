import type { LessonContent, Topic, KeyConcept, Problem, QuizQuestion } from "@/types";

const QUESTION_POOL = [
  "0", "1", "2", "5", "8", "10", "12", "15", "20", "25", "50", "100", "120", "5040",
  "Even", "Odd", "Positive", "Negative", "Zero",
  "Yes", "No", "A", "B", "C", "D", "F",
  "Hello, World!", "15", "35", "Area", "Largest",
];

function scramble<T>(arr: T[], seed: string): T[] {
  const copy = [...arr];
  let s = seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 31 + 7) % (i + 1);
    const j = s;
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const problemTopic: Record<string, Topic> = {
  "problem-001": "input-output",
  "problem-002": "variables",
  "problem-003": "variables",
  "problem-004": "operators",
  "problem-005": "conditions",
  "problem-006": "conditions",
  "problem-007": "variables",
  "problem-008": "conditions",
  "problem-009": "conditions",
  "problem-010": "conditions",
  "problem-011": "conditions",
  "problem-012": "operators",
  "problem-013": "input-output",
  "problem-014": "for-loops",
  "problem-015": "for-loops",
  "problem-016": "for-loops",
  "problem-017": "while-loops",
  "problem-018": "while-loops",
  "problem-019": "for-loops",
  "problem-020": "while-loops",
};

export function getTopicForProblem(problemId: string): Topic | undefined {
  return problemTopic[problemId];
}

const key = (title: string, explanation: string, code?: string): KeyConcept => ({
  title,
  explanation,
  ...(code ? { code } : {}),
});

export const lessonContent: Partial<Record<Topic, LessonContent>> = {
  "introduction": {
    whatIsThis:
      "C++ is a programming language used to write instructions for a computer. A program is just a list of instructions that the computer follows, one by one, from top to bottom.",
    whyDoWeUseIt:
      "C++ is great for beginners because it is strict — you have to be careful and precise — and because it is used everywhere, from games to operating systems. Learning C++ teaches you how computers really think.",
    howToThinkAboutIt:
      "Think of your program as a recipe. The main function is your cookbook page. main() is the starting point — the computer always looks for main first, then follows each instruction you wrote.",
    whenToUseIt:
      "Use C++ whenever you need a program that runs fast and gives you full control. For this course, you use C++ to practice every programming concept you will meet in your first subject.",
    keyConcepts: [
      key("The #include line", "Brings in extra tools/headers. <iostream> gives you input and output (cin/cout)."),
      key("main() is the start", "Every C++ program begins running inside int main(). Without it, the program has no starting point."),
      key("Statements end with ;", "Each instruction (statement) ends with a semicolon, like a period at the end of a sentence."),
    ],
    example: {
      explanation: "A complete, minimal program that prints a line of text.",
      code: `#include <iostream>

int main() {
    std::cout << "Hello, World!";
    return 0;
}`,
      output: "Hello, World!",
    },
    studentTask: "Open your first program in the IDE, change the message, and run it.",
    notes: [
      "return 0; tells the computer the program finished successfully.",
      "std:: tells C++ where the cout tool lives. You can avoid typing std:: by adding using namespace std; after the includes.",
    ],
    commonMistakes: [
      { mistake: "Forgetting the #include <iostream> line.", fix: "Without it, the compiler does not know what cout is." },
      { mistake: "Typing main without parentheses: int main.", fix: "Always write int main() with empty parentheses." },
      { mistake: "Writing code outside main().", fix: "Your instructions belong inside the { } of main." },
    ],
    quiz: [
      {
        question: "Where does every C++ program start running?",
        options: ["The first #include", "int main()", "The return statement", "The iostream file"],
        answerIndex: 1,
        explanation: "The computer always starts at int main() and follows your instructions from top to bottom.",
      },
      {
        question: "How does a statement end in C++?",
        options: ["With a period .", "With a semicolon ;", "With a comma ,", "With a new line"],
        answerIndex: 1,
        explanation: "In C++, most statements end with a semicolon ( ; ).",
      },
    ],
  },

  "variables": {
    whatIsThis:
      "A variable is a named box where you store a value. You can create a box, put a number or word in it, change the value later, and read it whenever you need it.",
    whyDoWeUseIt:
      "Programs need to remember things: a score, a name, an answer. Variables let you store, reuse, and change values instead of typing them again and again.",
    howToThinkAboutIt:
      "Declaring a variable is like labeling a box: int score; creates a box named score that can hold whole numbers. Putting a value in is like placing it inside the box.",
    whenToUseIt:
      "Use a variable whenever you need to save data for later, like the user's age, a running total, or the result of a calculation.",
    keyConcepts: [
      key("Declaration", "Creating a variable: int age; (type, then name, then semicolon)."),
      key("Assignment", "Putting a value in: age = 18; or all at once: int age = 18;"),
      key("Reading a variable", "Using its name pulls the value out, e.g. cout << age;"),
    ],
    example: {
      explanation: "Create a box, fill it, change it, and print it.",
      code: `int score = 5;
score = 10;
std::cout << score;`,
      output: "10",
    },
    studentTask: "Declare a variable that stores how many siblings you have, then print it.",
    notes: [
      "A variable can only hold ONE value at a time. Assigning a new value overwrites the old one.",
      "Variable names are case-sensitive: score and Score are different.",
      "Name variables clearly: totalScore is easier to read than ts.",
    ],
    commonMistakes: [
      { mistake: "Using a variable before creating it.", fix: "Declare it first: int count = 0; before you use count." },
      { mistake: "Assigning a decimal to an int (int x = 2.5).", fix: "int only stores whole numbers. Use double for decimals." },
      { mistake: "Starting a name with a number (int 2x;).", fix: "Names must start with a letter or underscore." },
    ],
    quiz: [
      {
        question: "What is a variable?",
        options: ["A math formula", "A named place that stores a value", "A type of compiler", "An #include line"],
        answerIndex: 1,
        explanation: "A variable is a named box that holds a value you can reuse and change.",
      },
      {
        question: "After this code, what does x hold?\nint x = 3;\nx = 9;",
        options: ["3", "9", "12", "Nothing"],
        answerIndex: 1,
        explanation: "The second line overwrites the box, so x is 9.",
      },
    ],
  },

  "data-types": {
    whatIsThis:
      "A data type tells the computer what kind of value a variable holds: whole numbers, decimals, letters, or truth values (true/false).",
    whyDoWeUseIt:
      "The computer stores each type differently, so choosing the right type keeps your program correct and efficient.",
    howToThinkAboutIt:
      "Pick the smallest type that fits your data: int for whole numbers, double for decimals, char for a single letter, bool for true/false, string for words.",
    whenToUseIt:
      "Whenever you declare a variable, ask: 'What kind of data is this?' That answer is your type.",
    keyConcepts: [
      key("int", "Whole numbers, e.g. int age = 18;"),
      key("double", "Decimals, e.g. double price = 9.99;"),
      key("char / string", "One character ('A') vs. text (\"Hello\")."),
      key("bool", "true or false — perfect for conditions."),
    ],
    example: {
      explanation: "Declare one variable of each common type and print them.",
      code: `int age = 18;
double grade = 1.75;
char letter = 'A';
bool passed = true;

std::cout << age << " " << grade << " " << letter << " " << passed;`,
      output: "18 1.75 A 1",
    },
    studentTask: "Create variables that store your age (int), your height (double), and your name (string).",
    notes: [
      "char uses SINGLE quotes: 'A'. string uses DOUBLE quotes: \"Hello\".",
      "bool prints as 1 (true) or 0 (false).",
      "string needs #include <string> in older compilers; modern ones usually include it via <iostream>.",
    ],
    commonMistakes: [
      { mistake: "Writing double quotes for a char: char c = \"A\";", fix: "Use single quotes for single characters." },
      { mistake: "Storing 2.5 in an int and losing the .5.", fix: "Use double for anything with a decimal." },
      { mistake: "Forgetting the quotes around string text.", fix: "Text values need double quotes: string name = \"Anna\";" },
    ],
    quiz: [
      {
        question: "Which type holds a decimal like 3.14?",
        options: ["int", "char", "double", "bool"],
        answerIndex: 2,
        explanation: "double stores decimals; int only stores whole numbers.",
      },
      {
        question: "bool can store what values?",
        options: ["Any number", "true or false", "Single letters", "Whole sentences"],
        answerIndex: 1,
        explanation: "A bool (boolean) holds only true or false.",
      },
    ],
  },

  "input-output": {
    whatIsThis:
      "Input and output are how your program talks to the user. cin reads what the user types; cout prints text to the screen.",
    whyDoWeUseIt:
      "A program that cannot read input is fixed forever. Reading input lets the same program answer different questions.",
    howToThinkAboutIt:
      "cin >> pulls a value into a variable (arrow points INTO the variable). cout << pushes text out to the screen (arrow points OUT to the console).",
    whenToUseIt:
      "Every time your program needs data from the user (a number, a word) or needs to show a result, use cin/cout.",
    keyConcepts: [
      key("cout <<", "Prints to the console. You can chain: cout << \"Hi \" << name;"),
      key("cin >>", "Reads user input into a variable: cin >> age;"),
      key("endl or \\n", "Starts a new line: cout << \"Hi\" << endl; or \"\\n\"."),
    ],
    example: {
      explanation: "Ask the user for a number, then print it back.",
      code: `int n;
std::cout << "Enter a number: ";
std::cin >> n;
std::cout << "You entered " << n;`,
      output: "Enter a number: 7\nYou entered 7",
    },
    studentTask: "Write a program that asks for a name and greets the user by name.",
    notes: [
      "The arrows are easy to mix up: cin >> (into), cout << (out).",
      "cin >> values ignore spaces by default — reading words needs getline.",
      "cin >> expects an int if the variable is int; typing text will misbehave or break it in C++.",
    ],
    commonMistakes: [
      { mistake: "Writing cout>> or cin<<.", fix: "cout uses <<, cin uses >>. The arrow shows the direction data flows." },
      { mistake: "Forgetting the variable after >>: cin >> ;", fix: "Always read into a declared variable: cin >> age;" },
      { mistake: "Reading input before the variable exists.", fix: "Declare the variable first, then read into it." },
    ],
    quiz: [
      {
        question: "Which line correctly reads a number into the variable age?",
        options: ["cin << age;", "cout >> age;", "cin >> age;", "age >> cin;"],
        answerIndex: 2,
        explanation: "cin uses the >> arrow pointing into the variable.",
      },
      {
        question: "What is missing: cout << \"Hello\"",
        options: ["A space", "A semicolon", "Another <<", "The word endl"],
        answerIndex: 1,
        explanation: "Like every C++ statement, it must end with a semicolon.",
      },
    ],
  },

  "operators": {
    whatIsThis:
      "Operators are symbols that do things to values: + adds, - subtracts, * multiplies, / divides, % takes the remainder, and == compares.",
    whyDoWeUseIt:
      "Almost every program does math or comparisons. Operators are the building blocks of calculations and decisions.",
    howToThinkAboutIt:
      "Like a calculator: 3 + 4 gives 7. The difference is the % (modulo) operator, which gives you the REMAINDER of a division (9 % 2 is 1).",
    whenToUseIt:
      "Use arithmetic (+ - * / %) to compute values, and comparison (== != < > <= >=) inside if/while to make decisions.",
    keyConcepts: [
      key("Arithmetic", "+ - * / for math. Integer division drops the decimal: 7 / 2 is 3."),
      key("Modulo %", "The remainder: 7 % 2 is 1. Great for even/odd checks (n % 2 == 0)."),
      key("Comparison", "== != < > <= >=. These produce true or false."),
      key("Assignment =", "Puts a value IN a variable: total = a + b;"),
    ],
    example: {
      explanation: "Compute a total and check if it is even.",
      code: `int a = 7, b = 2;
int sum = a + b;   // 9
int rem = a % b;   // 1

std::cout << sum << " " << rem;

if (a % 2 == 0) {
    std::cout << " even";
} else {
    std::cout << " odd";
}`,
      output: "9 1 odd",
    },
    studentTask: "Write a program that reads two numbers and prints their sum and product.",
    notes: [
      "7 / 2 is 3 when both are int. To get 3.5, make at least one a double.",
      "== compares, = assigns. Mixing these up is the most common beginner bug.",
      "% only works with whole numbers.",
    ],
    commonMistakes: [
      { mistake: "Using = instead of == inside if.", fix: "if (x == 5) compares; if (x = 5) assigns 5 to x!" },
      { mistake: "Expecting 7 / 2 to be 3.5.", fix: "Integer division drops the decimal. Use double for decimals." },
      { mistake: "Using % on doubles.", fix: "% works only on integers like int." },
    ],
    quiz: [
      {
        question: "What is 9 % 4?",
        options: ["2", "2.25", "1", "5"],
        answerIndex: 0,
        explanation: "9 % 4 is the remainder: 9 / 4 = 2 with remainder 1, so the answer is 1.",
      },
      {
        question: "Which compares two values?",
        options: ["=", "==", "=>", "!"],
        answerIndex: 1,
        explanation: "== is the equality comparison. = is assignment.",
      },
    ],
  },

  "conditions": {
    whatIsThis:
      "An if/else statement lets your program make a choice. If a condition is true, run one block; otherwise (else) run another.",
    whyDoWeUseIt:
      "Without choices, every program does the same thing forever. Conditions make programs respond to different situations.",
    howToThinkAboutIt:
      "Like a fork in a road: 'if it is raining, take the umbrella; else, wear sunglasses.' The condition is a true/false question.",
    whenToUseIt:
      "Whenever the program must behave differently based on data — checking if a number is even, if a grade passes, if an age is adult.",
    keyConcepts: [
      key("if (condition) { }", "Run this block only when the condition is true."),
      key("else { }", "Run this block when the condition is false."),
      key("else if", "Check another condition when the first one was false."),
    ],
    example: {
      explanation: "Decide what to print based on a user's age.",
      code: `int age;
std::cin >> age;

if (age >= 18) {
    std::cout << "You are an adult.";
} else {
    std::cout << "You are a minor.";
}`,
      output: "Input: 20\\nYou are an adult.",
    },
    studentTask: "Write a program that prints 'Even' or 'Odd' based on a number.",
    notes: [
      "The condition must be a true/false expression.",
      "else belongs to the most recent if.",
      "You can nest if inside if, but it gets hard to read — keep it shallow.",
    ],
    commonMistakes: [
      { mistake: "Putting a semicolon after if (x > 0);", fix: "That semicolon ends the if, so the block runs always. Remove it." },
      { mistake: "Using = instead of == in the condition.", fix: "if (x == 5), not if (x = 5)." },
      { mistake: "Mismatched braces { }.", fix: "Every { needs a matching }. Indent code inside braces." },
    ],
    quiz: [
      {
        question: "What would this print?\nint x = 5;\nif (x > 3) {\n    std::cout << \"Yes\";\n} else {\n    std::cout << \"No\";\n}",
        options: ["No", "Yes", "YesNo", "Nothing"],
        answerIndex: 1,
        explanation: "5 > 3 is true, so the if block runs and prints Yes.",
      },
      {
        question: "Which condition is correct?",
        options: ["if x == 5", "if (x == 5)", "if x = 5 then", "if [x == 5]"],
        answerIndex: 1,
        explanation: "Conditions go inside parentheses: if (x == 5).",
      },
    ],
  },

  "switch": {
    whatIsThis:
      "A switch statement picks one branch based on the value of a variable, instead of writing many if/else if lines.",
    whyDoWeUseIt:
      "When you compare one variable against many specific values (1, 2, 3...) a switch is cleaner and easier to read.",
    howToThinkAboutIt:
      "Like a vending machine: press 1 → cola, press 2 → water, press 3 → juice. The switch finds the matching case and runs it.",
    whenToUseIt:
      "When you need many branches for exact integer values — menus, days of the week, simple choices.",
    keyConcepts: [
      key("switch (value) { case x: ... break; }", "Each case checks one exact value."),
      key("break", "Stops the switch so it does not fall into the next case."),
      key("default", "Runs when no case matches."),
    ],
    example: {
      explanation: "Pick a message based on a menu number.",
      code: `int choice;
std::cin >> choice;

switch (choice) {
    case 1:
        std::cout << "Cola";
        break;
    case 2:
        std::cout << "Water";
        break;
    default:
        std::cout << "Unknown";
}`,
      output: "Input: 2\\nWater",
    },
    studentTask: "Write a switch that prints a message for the numbers 1, 2, 3 and 'Other' otherwise.",
    notes: [
      "Each case typically ends with break; otherwise the program continues into the next case (fall-through).",
      "switch only works well with whole values (int or char), not decimals or ranges.",
      "Use if/else for ranges like (score >= 90); use switch for exact values.",
    ],
    commonMistakes: [
      { mistake: "Forgetting break;.", fix: "Without it, all following cases run too." },
      { mistake: "Missing colons after case: case 1", fix: "Write case 1: with a colon." },
      { mistake: "Putting braces inside case: case 1 { }", fix: "Cases do not need extra braces — just break." },
    ],
    quiz: [
      {
        question: "What does break; do in a switch?",
        options: ["Exits the whole program", "Stops the current case from falling through", "Restarts the switch", "Skips the next case"],
        answerIndex: 1,
        explanation: "break stops the switch at that point, preventing fall-through into later cases.",
      },
      {
        question: "A switch is best for...",
        options: ["Comparing against many exact values", "Looping 10 times", "Reading input", "Comparing ranges"],
        answerIndex: 0,
        explanation: "Switch shines when you compare one int/char to many exact values.",
      },
    ],
  },

  "for-loops": {
    whatIsThis:
      "A for loop repeats a block of code a set number of times, using a counter that starts, stops, and steps by a certain amount.",
    whyDoWeUseIt:
      "Instead of typing the same code ten times, one loop runs it ten times automatically. Loops handle repetition.",
    howToThinkAboutIt:
      "for (start; keepGoing; step) — like counting 1, 2, 3...: start at 1, keep going while count <= 10, add 1 each round.",
    whenToUseIt:
      "When you know exactly how many times to repeat — print 1 to N, sum the first N numbers, draw N stars.",
    keyConcepts: [
      key("for (int i = 1; i <= n; i++)", "The three parts: initialize (int i = 1), condition (i <= n), update (i++)."),
      key("The loop body", "The code inside { } runs once per round."),
      key("Naming the counter", "i, j, k are common names for loop counters."),
    ],
    example: {
      explanation: "Print the numbers 1 to 5.",
      code: `for (int i = 1; i <= 5; i++) {
    std::cout << i << " ";
}`,
      output: "1 2 3 4 5",
    },
    studentTask: "Print all even numbers from 0 to 20.",
    notes: [
      "The update i++ means i = i + 1. This is how the loop moves forward.",
      "Be careful: the counter starts fresh each loop — int i is declared inside the parentheses.",
      "Missing the update part causes an infinite loop!",
    ],
    commonMistakes: [
      { mistake: "Semicolon after the for line: for(...);", fix: "The loop body must be a block/statement, not an empty statement." },
      { mistake: "Using <= instead of < (or vice versa) and off-by-one.", fix: "Trace it: print 1..N needs i <= n; print 0..N-1 needs i < n." },
      { mistake: "Forgetting i++ → infinite loop.", fix: "Always include the update step." },
    ],
    quiz: [
      {
        question: "How many times does this print?\nfor (int i = 0; i < 4; i++) { std::cout << i; }",
        options: ["3", "4", "5", "Infinite"],
        answerIndex: 1,
        explanation: "i goes 0, 1, 2, 3 then stops when i = 4, so it prints 4 times.",
      },
      {
        question: "What is missing from an infinite loop?\nfor (int i = 1; i <= 10; ____) { ... }",
        options: ["a declaration", "an update like i++", "a semicolon", "braces"],
        answerIndex: 1,
        explanation: "Without the update (i++), i never increases, so the condition stays true forever.",
      },
    ],
  },

  "while-loops": {
    whatIsThis:
      "A while loop repeats a block of code as long as (while) a condition is true. It checks the condition BEFORE each round.",
    whyDoWeUseIt:
      "When you do not know ahead of time how many repetitions you need — like reading numbers until the user types 0.",
    howToThinkAboutIt:
      "Like a guard at a door: while the door is open, walk through. The guard checks each time before letting you through.",
    whenToUseIt:
      "When repetition depends on a condition, not a fixed count — e.g. 'keep dividing until the number is 0'.",
    keyConcepts: [
      key("while (condition) { body }", "Check condition; if true, run body, then check again."),
      key("A changing variable", "Something inside the body must eventually make the condition false."),
      key("while vs for", "Use for when you know the count; use while when you know the condition."),
    ],
    example: {
      explanation: "Keep subtracting until the number reaches 0.",
      code: `int n = 10;
while (n > 0) {
    std::cout << n << " ";
    n = n - 3;
}`,
      output: "10 7 4 1",
    },
    studentTask: "Write a while loop that counts down from 5 to 1.",
    notes: [
      "If the condition is false at the start, the body never runs.",
      "You MUST change something in the body that affects the condition, or it loops forever.",
      "A common pattern: while (true) with an internal break to exit.",
    ],
    commonMistakes: [
      { mistake: "No way for the condition to become false → infinite loop.", fix: "Update the variable inside the body." },
      { mistake: "Forgetting braces when the body spans two lines.", fix: "Always wrap multi-statement bodies in { }." },
      { mistake: "Putting a semicolon after while (n > 0);", fix: "That makes an empty loop body → infinite loop." },
    ],
    quiz: [
      {
        question: "If n = 0, how many times does this run?\nwhile (n > 0) { n--; }",
        options: ["Once", "Zero times", "Infinite", "Depends on n"],
        answerIndex: 1,
        explanation: "The condition is checked first. 0 > 0 is false, so the body never runs.",
      },
      {
        question: "A while loop checks its condition...",
        options: ["After running the body", "Before running the body", "Only once", "Never"],
        answerIndex: 1,
        explanation: "while checks before each round, which is why it can run zero times.",
      },
    ],
  },

  "do-while-loops": {
    whatIsThis:
      "A do-while loop runs its body at least ONCE, then repeats while a condition is true. It checks the condition AFTER each round.",
    whyDoWeUseIt:
      "For menus and 'ask again' situations where you always want one attempt or one question before deciding to continue.",
    howToThinkAboutIt:
      "do { do this } while (condition) — 'first do it, then check.' The body is guaranteed to run at least once.",
    whenToUseIt:
      "When the first run must always happen regardless of the condition, like showing a menu at least one time.",
    keyConcepts: [
      key("do { body } while (condition);", "Body runs once, then repeats while the condition is true."),
      key("The trailing semicolon", "do/while ends with a semicolon after the condition."),
      key("do vs while", "while may skip entirely; do-while always runs once first."),
    ],
    example: {
      explanation: "Show a menu at least once, then keep showing it while the choice is not 0.",
      code: `int choice;
do {
    std::cout << "Menu (0 to exit): ";
    std::cin >> choice;
} while (choice != 0);`,
      output: "Menu (0 to exit): 1\nMenu (0 to exit): 0\n",
    },
    studentTask: "Write a do-while that asks for a positive number, repeating until the user gives one.",
    notes: [
      "Remember the semicolon after the while (condition); here — it is required and easy to forget.",
      "Because the body runs first, you avoid duplicating code before the loop.",
    ],
    commonMistakes: [
      { mistake: "Forgetting the semicolon after while(...);", fix: "do/while is the only loop that ends with a semicolon." },
      { mistake: "Using do-while when the body might not need to run at all.", fix: "Prefer while for that case." },
    ],
    quiz: [
      {
        question: "A do-while loop always runs its body...",
        options: ["At least once", "Zero or more times", "Exactly once", "Never"],
        answerIndex: 0,
        explanation: "do-while checks the condition AFTER the body, so it always runs at least once.",
      },
      {
        question: "Which loop ends with a semicolon?",
        options: ["for", "while", "do-while", "None"],
        answerIndex: 2,
        explanation: "Only do-while ends with a semicolon after its condition.",
      },
    ],
  },

  "functions": {
    whatIsThis:
      "A function is a named block of reusable code. You define it once, then call it anywhere — passing values in and getting a result back.",
    whyDoWeUseIt:
      "Functions stop you from copying the same code everywhere, make programs easier to read, and let you test one piece at a time.",
    howToThinkAboutIt:
      "Like a vending machine: you insert coins (parameters), it returns a snack (return value). A function hides its inner work.",
    whenToUseIt:
      "Whenever a task is repeated, has a clear single job, or you want a cleaner main — compute area, check prime, greet a user.",
    keyConcepts: [
      key("Return type", "What the function gives back: int, double, void (nothing)."),
      key("Parameters", "Values the function needs as input: double area(double w, double h)."),
      key("return", "Sends a value back and ends the function."),
      key("Calling", "int a = area(4, 5); runs the function and stores its result."),
    ],
    example: {
      explanation: "A function that returns the square of a number, plus main that uses it.",
      code: `int square(int x) {
    return x * x;
}

int main() {
    std::cout << square(5);
    return 0;
}`,
      output: "25",
    },
    studentTask: "Write a function maxTwo(a, b) that returns the larger of two numbers, then call it in main.",
    notes: [
      "main() is also a function — the one the program starts with.",
      "A void function returns nothing; you just call it: showMenu();.",
      "Declare a function before using it, or add a prototype at the top.",
    ],
    commonMistakes: [
      { mistake: "Forgetting the return type.", fix: "Every function needs a return type: int, double, void, etc." },
      { mistake: "Calling without parentheses: square 5;", fix: "Call with parentheses and arguments: square(5);" },
      { mistake: "Putting main's code inside another function's braces.", fix: "Check that every function closes with } before the next starts." },
    ],
    quiz: [
      {
        question: "What does a function with return type int MUST do?",
        options: ["Print something", "Return an integer value", "Read input", "Declare variables"],
        answerIndex: 1,
        explanation: "An int function must return an int using the return statement.",
      },
      {
        question: "What does void mean as a return type?",
        options: ["Returns zero", "Returns nothing", "Returns true", "Compiles without errors"],
        answerIndex: 1,
        explanation: "A void function performs an action and returns no value.",
      },
    ],
  },

  "arrays": {
    whatIsThis:
      "An array is a list of values of the same type stored under one name, accessed by an index number starting at 0.",
    whyDoWeUseIt:
      "Instead of 100 separate variables (score1, score2...), one array stores them all and lets you loop through them.",
    howToThinkAboutIt:
      "Think of a row of lockers. The array is the row; the index is the locker number (starting at 0). scores[2] is the third locker.",
    whenToUseIt:
      "When you have many related values you will process the same way — grades, temperatures, numbers in a list.",
    keyConcepts: [
      key("Declaration", "int scores[5]; creates an array of 5 ints."),
      key("Indexing starts at 0", "scores[0] is the first element, scores[4] is the last."),
      key("Reading/writing", "scores[i] = 10; cout << scores[0];"),
      key("Looping", "for (int i = 0; i < n; i++) processes every element."),
    ],
    example: {
      explanation: "Fill an array, then print its sum.",
      code: `int nums[4] = {2, 4, 6, 8};
int total = 0;

for (int i = 0; i < 4; i++) {
    total += nums[i];
}

std::cout << total;`,
      output: "20",
    },
    studentTask: "Read 5 numbers into an array and print the largest one.",
    notes: [
      "The first element is index 0, not 1 — confusing at first, but essential.",
      "An array of size n has valid indexes 0 to n-1.",
      "Trying to read past the end (out of bounds) is undefined — it may crash.",
    ],
    commonMistakes: [
      { mistake: "Accessing nums[4] on a 4-element array.", fix: "Valid indexes go 0..3. nums[4] is out of bounds." },
      { mistake: "Starting the loop at 1 and skipping the first element.", fix: "Start at 0: for (int i = 0; ...)." },
      { mistake: "Setting the array size too small.", fix: "The size must be at least as big as the data you store." },
    ],
    quiz: [
      {
        question: "What is the index of the FIRST element?",
        options: ["1", "0", "-1", "The array name"],
        answerIndex: 1,
        explanation: "Arrays are zero-indexed: the first element is arr[0].",
      },
      {
        question: "For int a[3], which index is valid?",
        options: ["3", "4", "2", "-1"],
        answerIndex: 2,
        explanation: "Valid indexes are 0, 1, 2 — that's 3 elements.",
      },
    ],
  },

  "strings": {
    whatIsThis:
      "A string is text: a sequence of characters stored as one value. You can read it, add to it, find in it, and get its length.",
    whyDoWeUseIt:
      "Programs mostly deal with words — names, messages, input like 'yes'/'no'. Strings let you handle text as data.",
    howToThinkAboutIt:
      "A string is like an array of characters under the hood. You can use + to join (concatenate) and .length() to count characters.",
    whenToUseIt:
      "Any time you work with text, from greeting a user to checking if input equals 'quit'.",
    keyConcepts: [
      key("Declaring", "string name = \"Anna\"; needs #include <string>."),
      key("Concatenation", "+ joins strings: \"Hello \" + name."),
      key("length()", "name.length() gives the number of characters."),
      key("Comparing", "== compares text: if (word == \"quit\")"),
    ],
    example: {
      explanation: "Read a name, greet them, and report its length.",
      code: `std::string name;
std::cin >> name;

std::cout << "Hi " << name << "\\n";
std::cout << "Length: " << name.length();`,
      output: "Input: Dex\\nHi Dex\nLength: 3",
    },
    studentTask: "Write a program that prints a word and its first and last characters.",
    notes: [
      "cin >> reads only the first word. For a whole line (with spaces) use getline(cin, text).",
      "String indexing works: word[0] is the first character.",
      "Include <string> to be safe, even if it often compiles without it.",
    ],
    commonMistakes: [
      { mistake: "cin >> failing for names with spaces.", fix: "Use getline(cin, name); to read a full line." },
      { mistake: "Trying to compare with = instead of ==.", fix: "if (text == \"yes\") compares text." },
      { mistake: "Forgetting #include <string>.", fix: "Add #include <string> when using std::string." },
    ],
    quiz: [
      {
        question: "Which statement reads a whole line with spaces?",
        options: ["cin >> text;", "getline(cin, text);", "text << cin;", "read(text);"],
        answerIndex: 1,
        explanation: "getline(cin, text) reads everything until the newline, spaces included.",
      },
      {
        question: "What does \"Hi \" + \"there\" produce?",
        options: ["\"Hithere\"", "\"Hi there\"", "An error", "\"Hi\\nthere\""],
        answerIndex: 1,
        explanation: "+ concatenates strings, keeping the space already in \"Hi \".",
      },
    ],
  },

  "pointers": {
    whatIsThis:
      "A pointer is a variable that stores a memory ADDRESS instead of a normal value. It 'points to' where another variable lives in memory.",
    whyDoWeUseIt:
      "Pointers let functions share and change the same variable, and let you build dynamic structures. They also explain a lot about how computers work.",
    howToThinkAboutIt:
      "A house has an address. A normal variable holds the furniture; a pointer holds the address of the house so you can go look inside.",
    whenToUseIt:
      "When you need a function to modify the caller's variable, or later when you study dynamic memory and linked lists.",
    keyConcepts: [
      key("Declaration", "int* p; declares a pointer to an int."),
      key("Address-of &", "int* p = &x; stores the address of x."),
      key("Dereference *", "*p = 10; goes to the address and changes the value there."),
      key("nullptr", "A pointer holding no address; check before using."),
    ],
    example: {
      explanation: "Make a pointer to a variable and change the variable through it.",
      code: `int x = 5;
int* p = &x;

*p = 10;   // change x through the pointer

std::cout << x;`,
      output: "10",
    },
    studentTask: "Create an int, a pointer to it, and print x using both x and *p.",
    notes: [
      "&x means 'address of x'; *p means 'the value p points to'. They are opposites.",
      "Always initialize a pointer before using it. Dereferencing an uninitialized pointer crashes.",
      "Use nullptr so you can check if a pointer points anywhere.",
    ],
    commonMistakes: [
      { mistake: "Forgetting the * when using the pointed-to value.", fix: "p is the address; *p is the value it points to." },
      { mistake: "Printing *p before p is set.", fix: "Set it: int* p = &x; before using *p." },
      { mistake: "Confusing & (address) with && (logical AND).", fix: "Single & gets an address; double && is 'and'." },
    ],
    quiz: [
      {
        question: "int* p = &x; — what does p store?",
        options: ["The value of x", "The address of x", "Twice the value of x", "A copy of x"],
        answerIndex: 1,
        explanation: "&x returns the memory address, so p stores that address.",
      },
      {
        question: "After int x = 5; int* p = &x; *p = 8; what is x?",
        options: ["5", "8", "13", "Error"],
        answerIndex: 1,
        explanation: "*p = 8 writes 8 into the memory p points to — which is x.",
      },
    ],
  },

  "structures": {
    whatIsThis:
      "A struct (structure) lets you group several different values into one new type. A student struct could hold a name, age, and grade together.",
    whyDoWeUseIt:
      "Real objects have many attributes. A struct keeps related data together so you pass ONE variable instead of many.",
    howToThinkAboutIt:
      "Like a paper form with fields: name, age, grade. Filling the form creates one student 'object' with all fields tagged.",
    whenToUseIt:
      "Whenever data belongs together — a person, a product, a test record — and you want to manage it as one thing.",
    keyConcepts: [
      key("Defining a struct", "struct Student { string name; int age; };"),
      key("Creating an instance", "Student s; then s.name = \"Anna\"; s.age = 20;"),
      key("Member access .", "The dot accesses a field: cout << s.name;"),
    ],
    example: {
      explanation: "Define a struct, fill two instances, and print one.",
      code: `struct Student {
    std::string name;
    int age;
};

int main() {
    Student s;
    s.name = "Anna";
    s.age = 20;

    std::cout << s.name << " " << s.age;
    return 0;
}`,
      output: "Anna 20",
    },
    studentTask: "Define a struct Point with x and y, then print the sum of the coordinates.",
    notes: [
      "Define the struct BEFORE main (and before functions that use it).",
      "Each instance is independent: Student a and Student b hold their own values.",
      "You can also initialize with braces: Student s = {\"Anna\", 20};",
    ],
    commonMistakes: [
      { mistake: "Defining the struct inside main, then using it after.", fix: "Structs are normally defined at the top, before main." },
      { mistake: "Forgetting the semicolon after the struct's closing brace.", fix: "End the definition with };" },
      { mistake: "Accessing fields with -> when they are not pointers.", fix: "Use . for an object (s.name); use -> only with pointers." },
    ],
    quiz: [
      {
        question: "Which line does NOT belong at the end of a struct definition?",
        options: ["};", "}", ";", "(none)"],
        answerIndex: 1,
        explanation: "A struct definition ends with }; — the semicolon is required.",
      },
      {
        question: "How do you access a field of an object?",
        options: ["s->name", "s.name", "s::name", "name(s)"],
        answerIndex: 1,
        explanation: "Use the dot operator: s.name.",
      },
    ],
  },

  "oop": {
    whatIsThis:
      "Object-Oriented Programming (OOP) is a style where you build programs around 'objects' — things that hold data AND the functions that work on that data.",
    whyDoWeUseIt:
      "OOP keeps data and behavior together, makes code easier to reuse and extend, and mirrors how we think about real-world things.",
    howToThinkAboutIt:
      "A car object has data (color, speed) and behavior (accelerate, brake). In OOP you model: 'what is it?' and 'what can it do?'",
    whenToUseIt:
      "For larger programs with many related items and behaviors. Start with classes when a program has natural objects.",
    keyConcepts: [
      key("Class", "The blueprint/template for an object."),
      key("Object", "A concrete instance made from the class."),
      key("Encapsulation", "Keep data safe inside; expose only public methods."),
      key("The four pillars", "Encapsulation, inheritance, polymorphism, abstraction."),
    ],
    example: {
      explanation: "Model a simple Dog class with a method.",
      code: `class Dog {
  public:
    void bark() {
        std::cout << "Woof!";
    }
};

int main() {
    Dog buddy;
    buddy.bark();
    return 0;
}`,
      output: "Woof!",
    },
    studentTask: "Describe the objects in a small system (e.g., a gradebook) and what data + behavior each has.",
    notes: [
      "A class is a blueprint; you create objects (instances) from it.",
      "public: means members can be used outside the class.",
      "This topic builds on structs — a class adds behavior (functions) and access control.",
    ],
    commonMistakes: [
      { mistake: "Forgetting to create an object before using methods.", fix: "Dog buddy; first, then buddy.bark();." },
      { mistake: "Calling a member function with the wrong parentheses.", fix: "Always call methods with (): buddy.bark();" },
      { mistake: "Missing the class's public: label, then wondering why nothing works.", fix: "Members are private by default — add public: to expose them." },
    ],
    quiz: [
      {
        question: "What is a class in OOP?",
        options: ["A single object", "A blueprint for objects", "A variable", "A loop"],
        answerIndex: 1,
        explanation: "A class is the blueprint; objects are the things you make from it.",
      },
      {
        question: "The idea of keeping data private inside a class is called...",
        options: ["Compilation", "Encapsulation", "Concatenation", "Iteration"],
        answerIndex: 1,
        explanation: "Encapsulation hides internal data and exposes safe public methods.",
      },
    ],
  },

  "classes": {
    whatIsThis:
      "Classes extend structs: they bundle data (attributes) with functions (methods) and control who can access them via public, private, and protected.",
    whyDoWeUseIt:
      "Classes let you build types that behave like real objects — with rules for how their data can be changed, keeping objects in a valid state.",
    howToThinkAboutIt:
      "A bank account class holds 'balance' (private) and offers methods like deposit() and withdraw() (public). Outsiders can only touch balance through methods.",
    whenToUseIt:
      "Whenever data must follow rules — e.g. a balance can't go negative, an age can't be 300. Methods enforce those rules.",
    keyConcepts: [
      key("public / private", "public members open to all; private members hidden inside."),
      key("Constructor", "A special method that sets up the object: BankAccount(int start);"),
      key("Methods", "Functions inside the class that act on its data."),
      key("Accessor & mutator", "getX() reads data; setX() changes it safely."),
    ],
    example: {
      explanation: "A bank account class with a private balance and safe methods.",
      code: `class BankAccount {
  private:
    double balance;

  public:
    BankAccount() { balance = 0; }

    void deposit(double amount) {
        balance += amount;
    }

    double getBalance() {
        return balance;
    }
};

int main() {
    BankAccount acc;
    acc.deposit(100);
    std::cout << acc.getBalance();
    return 0;
}`,
      output: "100",
    },
    studentTask: "Create a class Rectangle with private width and height, a constructor, and an area() method.",
    notes: [
      "The constructor has the same name as the class and no return type.",
      "Members are private by default in a class; you add public: to expose methods.",
      "Methods can read and change the private data of their own object freely.",
    ],
    commonMistakes: [
      { mistake: "Accessing a private member from main.", fix: "Use public methods: acc.getBalance() instead of acc.balance." },
      { mistake: "A constructor with a return type: void BankAccount()...", fix: "Constructors never have a return type." },
      { mistake: "Forgetting the semicolon after the class.", fix: "End the class definition with };." },
    ],
    quiz: [
      {
        question: "Which section exposes methods to the outside?",
        options: ["private:", "public:", "protected:", "none"],
        answerIndex: 1,
        explanation: "public: members are accessible from outside the class.",
      },
      {
        question: "What does a constructor do?",
        options: ["Destroys the object", "Initializes the object when created", "Returns the balance", "Compiles the program"],
        answerIndex: 1,
        explanation: "A constructor runs automatically when an object is created to set it up.",
      },
    ],
  },
};

function buildPredictQuiz(problem: Problem): QuizQuestion | null {
  const correct = (problem.example?.output || "").trim();
  if (!correct) return null;

  const distractors: string[] = [];
  for (const candidate of QUESTION_POOL) {
    if (distractors.length >= 3) break;
    if (candidate !== correct) distractors.push(candidate);
  }
  while (distractors.length < 3) {
    distractors.push(`(${distractors.length + 2} output)`);
  }

  const options = scramble([correct, ...distractors], problem.id);
  const answerIndex = options.indexOf(correct);

  const inputText = problem.example?.input ? `the input "${problem.example.input}"` : "this program";
  return {
    question: `If your program receives ${inputText}, what should it print?`,
    options,
    answerIndex,
    explanation: `According to the example, ${problem.title} must print exactly "${correct}". This is checked against test cases in Practice.`,
  };
}

export function buildProblemLesson(problem: Problem): LessonContent {
  const topic = getTopicForProblem(problem.id);
  const topicContent = topic ? lessonContent[topic] : undefined;

  const hasInput = problem.example?.input ? problem.example.input.trim() !== "" : false;

  const keyConcepts: KeyConcept[] = [];
  if (hasInput) {
    keyConcepts.push(
      key("Read the input", `Use std::cin >> to read the input: ${problem.input}.`),
    );
  }
  for (const hint of problem.hints) {
    keyConcepts.push(key(hint.title, hint.content));
  }
  keyConcepts.push(
    key("Print the result", `Use std::cout to print your answer: ${problem.output}.`),
  );
  if (keyConcepts.length > 4) keyConcepts.length = 4;

  const commonMistakes = [
    {
      mistake: "Forgetting to read the input before computing.",
      fix: hasInput
        ? `Always read it first, e.g. with std::cin >>, before you calculate or decide.`
        : "This problem has no input, so just print the output directly.",
    },
    {
      mistake: `Not matching the expected output exactly.`,
      fix: `For the sample, the output must be exactly: "${problem.example?.output || problem.output}". Spelling and case matter.`,
    },
  ];
  if (topicContent?.commonMistakes?.[0]) {
    commonMistakes.push(topicContent.commonMistakes[0]);
  }

  const quiz: QuizQuestion[] = [];
  const predict = buildPredictQuiz(problem);
  if (predict) quiz.push(predict);
  if (topicContent?.quiz?.[0]) quiz.push(topicContent.quiz[0]);

  return {
    whatIsThis: `Your goal in this lesson: ${problem.title}. ${problem.description} You'll practice ${problem.concepts.join(", ").replace(/,([^,]*)$/, " and$1")} and turn it into a working program.`,
    whyDoWeUseIt:
      topicContent?.whyDoWeUseIt ??
      `This is one of the core skills of programming — solving this builds the muscle memory you'll use in every C++ program.`,
    howToThinkAboutIt: `Think in steps: (1) read the input${hasInput ? ` — ${problem.input}` : " (there is none here)"}; (2) do the calculation or decision; (3) print the result — ${problem.output}. Nothing else.`,
    whenToUseIt:
      topicContent?.whenToUseIt ??
      `Use this skill whenever a task like this appears — read data, process it, print the answer.`,
    keyConcepts,
    example: {
      explanation: `A working solution for "${problem.title}". With the sample input${hasInput ? ` "${problem.example!.input}"` : ""}, it produces the output below.`,
      code: problem.solutionCode,
      output: problem.example?.output || problem.output,
    },
    studentTask: `${problem.description} (Input: ${problem.input}; Output: ${problem.output})`,
    notes: problem.hints.map((hint) => `${hint.title}: ${hint.content}`),
    commonMistakes,
    quiz,
  };
}