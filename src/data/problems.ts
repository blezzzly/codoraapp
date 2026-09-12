import type { Problem, World } from "@/types";
import type { LanguageId } from "@/lib/languages";
import { getSolutionCodeFor } from "@/data/solutions";

export const worlds: World[] = [
  {
    id: "world-1",
    title: "C++ Basics",
    description: "Print output, use variables, and do simple math.",
    order: 1,
    icon: "Sparkles",
    color: "#F0C0C0",
    lessons: [
      "problem-001",
      "problem-002",
      "problem-003",
      "problem-004",
      "problem-005",
      "problem-006",
      "problem-007",
    ],
    unlocked: true,
    mastery: 0,
  },
  {
    id: "world-2",
    title: "Decisions",
    description: "Make your programs make choices with if / else.",
    order: 2,
    icon: "GitBranch",
    color: "#FCE4E4",
    lessons: [
      "problem-008",
      "problem-009",
      "problem-010",
      "problem-011",
      "problem-012",
      "problem-013",
    ],
    unlocked: false,
    mastery: 0,
  },
  {
    id: "world-3",
    title: "Loops",
    description: "Repeat actions efficiently with for and while.",
    order: 3,
    icon: "RotateCw",
    color: "#4A3B5E",
    lessons: [
      "problem-014",
      "problem-015",
      "problem-016",
      "problem-017",
      "problem-018",
      "problem-019",
      "problem-020",
    ],
    unlocked: false,
    mastery: 0,
  },
];

const CPP_GENERIC_SCAFFOLD = `#include <iostream>
using namespace std;

int main() {

    // 1. read the input

    // 2. compute the answer

    // 3. print the result

}`;

export const problems: Problem[] = [
  {
    id: "problem-001",
    title: "Hello, World!",
    difficulty: "beginner",
    world: "world-1",
    worldOrder: 1,
    lessonOrder: 1,
    description: "Write a program that prints 'Hello, World!' to the screen.",
    filename: "hello.cpp",
    input: "None",
    output: "Hello, World!",
    example: { input: "", output: "Hello, World!" },
    constraints: [],
    hints: [
      { level: 1, title: "Start", content: "Use cout to print text." },
      { level: 2, title: "Syntax", content: 'cout << "Hello, World!";' },
    ],
    concepts: ["output", "cout"],
    starterCode: `#include <iostream>
using namespace std;

int main() {

    // print: Hello, World!

}`,
    solutionCode: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!";
    return 0;
}`,
    testCases: [{ input: "", expectedOutput: "Hello, World!" }],
    hiddenTests: [],
    xpReward: 10,
  },
  {
    id: "problem-002",
    title: "Simple Sum",
    difficulty: "beginner",
    world: "world-1",
    worldOrder: 1,
    lessonOrder: 2,
    description: "Read two integers and print their sum.",
    filename: "sum.cpp",
    input: "Two integers a and b",
    output: "The sum a + b",
    example: { input: "5 3", output: "8" },
    constraints: [],
    hints: [
      { level: 1, title: "Read", content: "Use cin >> a >> b; to read two numbers." },
      { level: 2, title: "Add", content: "a + b gives the sum." },
    ],
    concepts: ["cin", "variables", "addition"],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int a, b;

    // read a and b from the input

    // print their sum

}`,
    solutionCode: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b;
    return 0;
}`,
    testCases: [{ input: "5 3", expectedOutput: "8" }],
    hiddenTests: [],
    xpReward: 10,
  },
  {
    id: "problem-003",
    title: "Multiply Numbers",
    difficulty: "beginner",
    world: "world-1",
    worldOrder: 1,
    lessonOrder: 3,
    description: "Read two integers and print their product.",
    filename: "multiply.cpp",
    input: "Two integers a and b",
    output: "The product a * b",
    example: { input: "4 5", output: "20" },
    constraints: [],
    hints: [
      { level: 1, title: "Read", content: "Use cin >> a >> b;" },
      { level: 2, title: "Multiply", content: "a * b gives the product." },
    ],
    concepts: ["cin", "multiplication"],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int a, b;

    // read a and b

    // print their product

}`,
    solutionCode: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a * b;
    return 0;
}`,
    testCases: [{ input: "4 5", expectedOutput: "20" }],
    hiddenTests: [],
    xpReward: 10,
  },
  {
    id: "problem-004",
    title: "Area of Rectangle",
    difficulty: "beginner",
    world: "world-1",
    worldOrder: 1,
    lessonOrder: 4,
    description: "Read the length and width of a rectangle and print its area.",
    filename: "area.cpp",
    input: "Two integers length and width",
    output: "The area (length * width)",
    example: { input: "5 3", output: "15" },
    constraints: [],
    hints: [
      { level: 1, title: "Formula", content: "Area = length * width" },
      { level: 2, title: "Read", content: "cin >> length >> width;" },
    ],
    concepts: ["cin", "multiplication", "formulas"],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int length, width;

    // read length and width

    // compute area = length * width

    // print the area

}`,
    solutionCode: `#include <iostream>
using namespace std;

int main() {
    int length, width;
    cin >> length >> width;
    int area = length * width;
    cout << area;
    return 0;
}`,
    testCases: [{ input: "5 3", expectedOutput: "15" }],
    hiddenTests: [{ input: "10 4", expectedOutput: "40" }],
    xpReward: 10,
  },
  {
    id: "problem-005",
    title: "Even or Odd",
    difficulty: "beginner",
    world: "world-1",
    worldOrder: 1,
    lessonOrder: 5,
    description: "Read one number and print whether it is Even or Odd.",
    filename: "evenodd.cpp",
    input: "One integer n",
    output: "Even or Odd",
    example: { input: "4", output: "Even" },
    constraints: [],
    hints: [
      { level: 1, title: "Modulo", content: "Use n % 2 to check divisibility by 2." },
      { level: 2, title: "Even", content: "If n % 2 == 0, the number is even." },
    ],
    concepts: ["modulo", "if-else"],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int n;

    // read n

    // if n % 2 == 0 print "Even", otherwise print "Odd"

}`,
    solutionCode: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    if (n % 2 == 0)
        cout << "Even";
    else
        cout << "Odd";
    return 0;
}`,
    testCases: [{ input: "4", expectedOutput: "Even" }],
    hiddenTests: [{ input: "7", expectedOutput: "Odd" }],
    xpReward: 15,
  },
  {
    id: "problem-006",
    title: "Maximum of Two",
    difficulty: "beginner",
    world: "world-1",
    worldOrder: 1,
    lessonOrder: 6,
    description: "Read two numbers and print the larger one.",
    filename: "max2.cpp",
    input: "Two integers a and b",
    output: "The larger number",
    example: { input: "3 7", output: "7" },
    constraints: [],
    hints: [
      { level: 1, title: "Compare", content: "Use an if statement to compare a and b." },
      { level: 2, title: "Else", content: "If a > b print a, otherwise print b." },
    ],
    concepts: ["if-else", "comparison"],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int a, b;

    // read a and b

    // print the larger one

}`,
    solutionCode: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    if (a > b)
        cout << a;
    else
        cout << b;
    return 0;
}`,
    testCases: [{ input: "3 7", expectedOutput: "7" }],
    hiddenTests: [{ input: "9 2", expectedOutput: "9" }],
    xpReward: 10,
  },
  {
    id: "problem-007",
    title: "Swap Numbers",
    difficulty: "beginner",
    world: "world-1",
    worldOrder: 1,
    lessonOrder: 7,
    description: "Read two numbers and print them in reverse order (b then a).",
    filename: "swap.cpp",
    input: "Two integers a and b",
    output: "b a (swapped)",
    example: { input: "1 2", output: "2 1" },
    constraints: [],
    hints: [
      { level: 1, title: "Order", content: "Print the second number before the first." },
      { level: 2, title: "Space", content: 'cout << b << " " << a;' },
    ],
    concepts: ["output", "ordering"],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int a, b;

    // read a and b

    // print b first, then a, separated by a space

}`,
    solutionCode: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << b << " " << a;
    return 0;
}`,
    testCases: [{ input: "1 2", expectedOutput: "2 1" }],
    hiddenTests: [{ input: "10 20", expectedOutput: "20 10" }],
    xpReward: 10,
  },
  {
    id: "problem-008",
    title: "Positive, Negative, or Zero",
    difficulty: "easy",
    world: "world-2",
    worldOrder: 2,
    lessonOrder: 8,
    description: "Read one number and print Positive, Negative, or Zero.",
    filename: "sign.cpp",
    input: "One integer n",
    output: "Positive, Negative, or Zero",
    example: { input: "-5", output: "Negative" },
    constraints: [],
    hints: [
      { level: 1, title: "Compare", content: "Check if n > 0, n < 0, or n == 0." },
      { level: 2, title: "Else if", content: "Use if / else if / else for three cases." },
    ],
    concepts: ["if-else", "comparisons"],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int n;

    // read n

    // print Positive, Negative, or Zero

}`,
    solutionCode: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    if (n > 0)
        cout << "Positive";
    else if (n < 0)
        cout << "Negative";
    else
        cout << "Zero";
    return 0;
}`,
    testCases: [{ input: "-5", expectedOutput: "Negative" }],
    hiddenTests: [
      { input: "0", expectedOutput: "Zero" },
      { input: "8", expectedOutput: "Positive" },
    ],
    xpReward: 15,
  },
  {
    id: "problem-009",
    title: "Largest of Three",
    difficulty: "easy",
    world: "world-2",
    worldOrder: 2,
    lessonOrder: 9,
    description: "Read three numbers and print the largest one.",
    filename: "max3.cpp",
    input: "Three integers a, b, c",
    output: "The largest number",
    example: { input: "1 5 3", output: "5" },
    constraints: [],
    hints: [
      { level: 1, title: "Compare", content: "Compare a with b and c, then b with c." },
      { level: 2, title: "Track it", content: "Start with a, then update if b or c is bigger." },
    ],
    concepts: ["if-else", "comparisons"],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int a, b, c;

    // read three numbers

    // print the largest of the three

}`,
    solutionCode: `#include <iostream>
using namespace std;

int main() {
    int a, b, c;
    cin >> a >> b >> c;
    int largest = a;
    if (b > largest) largest = b;
    if (c > largest) largest = c;
    cout << largest;
    return 0;
}`,
    testCases: [{ input: "1 5 3", expectedOutput: "5" }],
    hiddenTests: [{ input: "9 2 7", expectedOutput: "9" }],
    xpReward: 15,
  },
  {
    id: "problem-010",
    title: "Grade Checker",
    difficulty: "easy",
    world: "world-2",
    worldOrder: 2,
    lessonOrder: 10,
    description: "Convert a numeric score (0-100) into a letter grade.",
    filename: "grade.cpp",
    input: "One integer score (0-100)",
    output: "A, B, C, D, or F",
    example: { input: "85", output: "B" },
    constraints: ["0 <= score <= 100"],
    hints: [
      {
        level: 1,
        title: "Ranges",
        content: "A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: 0-59",
      },
      { level: 2, title: "Order", content: "Check from the highest grade down." },
    ],
    concepts: ["if-else", "grading"],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int score;

    // read the score

    // print A, B, C, D, or F depending on the score

}`,
    solutionCode: `#include <iostream>
using namespace std;

int main() {
    int score;
    cin >> score;
    if (score >= 90) cout << "A";
    else if (score >= 80) cout << "B";
    else if (score >= 70) cout << "C";
    else if (score >= 60) cout << "D";
    else cout << "F";
    return 0;
}`,
    testCases: [{ input: "85", expectedOutput: "B" }],
    hiddenTests: [
      { input: "95", expectedOutput: "A" },
      { input: "42", expectedOutput: "F" },
    ],
    xpReward: 15,
  },
  {
    id: "problem-011",
    title: "Leap Year",
    difficulty: "easy",
    world: "world-2",
    worldOrder: 2,
    lessonOrder: 11,
    description: "Check if a year is a leap year.",
    filename: "leapyear.cpp",
    input: "One integer year",
    output: "Leap Year or Not Leap Year",
    example: { input: "2024", output: "Leap Year" },
    constraints: ["1 <= year <= 10000"],
    hints: [
      {
        level: 1,
        title: "Rule",
        content: "Divisible by 4, but not by 100 unless also divisible by 400.",
      },
      {
        level: 2,
        title: "Formula",
        content: "(year % 4 == 0 && year % 100 != 0) || year % 400 == 0",
      },
    ],
    concepts: ["if-else", "modulo", "leap-year"],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int year;

    // read the year

    // check the leap year rule and print the result

}`,
    solutionCode: `#include <iostream>
using namespace std;

int main() {
    int year;
    cin >> year;
    if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0)
        cout << "Leap Year";
    else
        cout << "Not Leap Year";
    return 0;
}`,
    testCases: [{ input: "2024", expectedOutput: "Leap Year" }],
    hiddenTests: [
      { input: "1900", expectedOutput: "Not Leap Year" },
      { input: "2000", expectedOutput: "Leap Year" },
    ],
    xpReward: 20,
  },
  {
    id: "problem-012",
    title: "Divisibility Check",
    difficulty: "easy",
    world: "world-2",
    worldOrder: 2,
    lessonOrder: 12,
    description: "Check if a number is divisible by both 3 and 5.",
    filename: "divisible.cpp",
    input: "One integer n",
    output: "Divisible or Not Divisible",
    example: { input: "15", output: "Divisible" },
    constraints: ["1 <= n <= 10000"],
    hints: [
      {
        level: 1,
        title: "Check",
        content: "A number is divisible by 15 if divisible by both 3 and 5.",
      },
      { level: 2, title: "Formula", content: "n % 3 == 0 && n % 5 == 0" },
    ],
    concepts: ["modulo", "if-else", "logical-and"],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int n;

    // read n

    // print "Divisible" if n is divisible by both 3 and 5

}`,
    solutionCode: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    if (n % 3 == 0 && n % 5 == 0)
        cout << "Divisible";
    else
        cout << "Not Divisible";
    return 0;
}`,
    testCases: [{ input: "15", expectedOutput: "Divisible" }],
    hiddenTests: [
      { input: "10", expectedOutput: "Not Divisible" },
      { input: "30", expectedOutput: "Divisible" },
    ],
    xpReward: 15,
  },
  {
    id: "problem-013",
    title: "Temperature Converter",
    difficulty: "medium",
    world: "world-2",
    worldOrder: 2,
    lessonOrder: 13,
    description: "Convert a temperature in Celsius to Fahrenheit.",
    filename: "temp.cpp",
    input: "One double temperature in Celsius",
    output: "Temperature in Fahrenheit (2 decimal places)",
    example: { input: "0", output: "32" },
    constraints: ["-273.15 <= celsius <= 1000"],
    hints: [
      { level: 1, title: "Formula", content: "F = C * 9/5 + 32" },
      { level: 2, title: "Format", content: "Use fixed and setprecision(2) for two decimals." },
    ],
    concepts: ["arithmetic", "formulas", "double"],
    starterCode: `#include <iostream>
#include <iomanip>
using namespace std;

int main() {
    double celsius;

    // read the temperature in Celsius

    // convert to Fahrenheit: F = C * 9 / 5 + 32

    // print F with two decimal places

}`,
    solutionCode: `#include <iostream>
#include <iomanip>
using namespace std;

int main() {
    double celsius;
    cin >> celsius;
    double fahrenheit = celsius * 9.0 / 5.0 + 32;
    cout << fixed << setprecision(2) << fahrenheit;
    return 0;
}`,
    testCases: [
      { input: "0", expectedOutput: "32" },
      { input: "100", expectedOutput: "212" },
      { input: "-40", expectedOutput: "-40" },
    ],
    hiddenTests: [],
    xpReward: 25,
  },{
    id: "problem-014",
    title: "Print 1 to N",
    difficulty: "easy",
    world: "world-3",
    worldOrder: 3,
    lessonOrder: 14,
    description: "Read a number N and print the numbers 1 to N separated by spaces.",
    filename: "printn.cpp",
    input: "One integer N (1 <= N <= 100)",
    output: "Numbers 1 to N separated by spaces",
    example: { input: "5", output: "1 2 3 4 5" },
    constraints: ["1 <= N <= 100"],
    hints: [
      { level: 1, title: "For loop", content: "for (int i = 1; i <= N; i++) repeats N times." },
      { level: 2, title: "Spacing", content: "Print a space before every number except the first." },
    ],
    concepts: ["for-loops", "output"],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int N;

    // read N

    // use a for loop to print 1 2 3 ... N

}`,
    solutionCode: `#include <iostream>
using namespace std;

int main() {
    int N;
    cin >> N;
    bool first = true;
    for (int i = 1; i <= N; i++) {
        if (!first) cout << " ";
        first = false;
        cout << i;
    }
    return 0;
}`,
    testCases: [{ input: "5", expectedOutput: "1 2 3 4 5" }],
    hiddenTests: [{ input: "3", expectedOutput: "1 2 3" }],
    xpReward: 20,
  },
  {
    id: "problem-015",
    title: "Sum 1 to N",
    difficulty: "easy",
    world: "world-3",
    worldOrder: 3,
    lessonOrder: 15,
    description: "Read a number N and print the sum of 1 + 2 + ... + N.",
    filename: "sumn.cpp",
    input: "One integer N (1 <= N <= 10000)",
    output: "The sum 1 + 2 + ... + N",
    example: { input: "10", output: "55" },
    constraints: ["1 <= N <= 10000"],
    hints: [
      { level: 1, title: "Accumulate", content: "Keep a running total inside the loop." },
      { level: 2, title: "Add each", content: "sum += i; inside a for loop from 1 to N." },
    ],
    concepts: ["for-loops", "accumulator"],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int N;

    // read N

    // add numbers 1 to N into a total, then print it

}`,
    solutionCode: `#include <iostream>
using namespace std;

int main() {
    int N;
    cin >> N;
    long long sum = 0;
    for (int i = 1; i <= N; i++)
        sum += i;
    cout << sum;
    return 0;
}`,
    testCases: [{ input: "10", expectedOutput: "55" }],
    hiddenTests: [{ input: "3", expectedOutput: "6" }],
    xpReward: 20,
  },
  {
    id: "problem-016",
    title: "Even Numbers",
    difficulty: "easy",
    world: "world-3",
    worldOrder: 3,
    lessonOrder: 16,
    description: "Read a number N and print all even numbers from 1 to N.",
    filename: "evenloop.cpp",
    input: "One integer N (1 <= N <= 100)",
    output: "All even numbers from 1 to N, separated by spaces",
    example: { input: "10", output: "2 4 6 8 10" },
    constraints: ["1 <= N <= 100"],
    hints: [
      { level: 1, title: "Start at 2", content: "Even numbers start at 2." },
      { level: 2, title: "Step by 2", content: "for (int i = 2; i <= N; i += 2)" },
    ],
    concepts: ["for-loops", "even numbers"],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int N;

    // read N

    // print every even number from 1 to N

}`,
    solutionCode: `#include <iostream>
using namespace std;

int main() {
    int N;
    cin >> N;
    bool first = true;
    for (int i = 2; i <= N; i += 2) {
        if (!first) cout << " ";
        first = false;
        cout << i;
    }
    return 0;
}`,
    testCases: [{ input: "10", expectedOutput: "2 4 6 8 10" }],
    hiddenTests: [{ input: "6", expectedOutput: "2 4 6" }],
    xpReward: 20,
  },
  {
    id: "problem-017",
    title: "Factorial",
    difficulty: "medium",
    world: "world-3",
    worldOrder: 3,
    lessonOrder: 17,
    description: "Read a number N and print N! (N factorial).",
    filename: "factorial.cpp",
    input: "One integer N (1 <= N <= 12)",
    output: "N! = 1 * 2 * ... * N",
    example: { input: "5", output: "120" },
    constraints: ["1 <= N <= 12"],
    hints: [
      { level: 1, title: "Product", content: "Multiply a running product by each i." },
      { level: 2, title: "Start at 1", content: "product = 1; then product *= i; from 1 to N." },
    ],
    concepts: ["for-loops", "factorial"],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int N;

    // read N

    // multiply 1 * 2 * ... * N and print the result

}`,
    solutionCode: `#include <iostream>
using namespace std;

int main() {
    int N;
    cin >> N;
    long long fact = 1;
    for (int i = 1; i <= N; i++)
        fact *= i;
    cout << fact;
    return 0;
}`,
    testCases: [{ input: "5", expectedOutput: "120" }],
    hiddenTests: [{ input: "3", expectedOutput: "6" }],
    xpReward: 20,
  },
  {
    id: "problem-018",
    title: "Count Digits",
    difficulty: "medium",
    world: "world-3",
    worldOrder: 3,
    lessonOrder: 18,
    description: "Read a positive number and count how many digits it has.",
    filename: "digits.cpp",
    input: "One integer N (1 <= N <= 1,000,000,000)",
    output: "The number of digits in N",
    example: { input: "12345", output: "5" },
    constraints: ["1 <= N <= 1000000000"],
    hints: [
      { level: 1, title: "Remove one", content: "Each time you divide by 10, one digit disappears." },
      { level: 2, title: "While loop", content: "while (N > 0) { count++; N /= 10; }" },
    ],
    concepts: ["while-loops", "digits"],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    long long N;

    // read N

    // keep dividing N by 10 and count how many times

}`,
    solutionCode: `#include <iostream>
using namespace std;

int main() {
    long long N;
    cin >> N;
    int count = 0;
    while (N > 0) {
        count++;
        N /= 10;
    }
    cout << count;
    return 0;
}`,
    testCases: [{ input: "12345", expectedOutput: "5" }],
    hiddenTests: [
      { input: "7", expectedOutput: "1" },
      { input: "1000", expectedOutput: "4" },
    ],
    xpReward: 20,
  },
  {
    id: "problem-019",
    title: "Multiplication Table",
    difficulty: "medium",
    world: "world-3",
    worldOrder: 3,
    lessonOrder: 19,
    description: "Read a number N and print its multiplication table from 1 to 10.",
    filename: "table.cpp",
    input: "One integer N (1 <= N <= 9)",
    output: "N*1 N*2 ... N*10 separated by spaces",
    example: { input: "3", output: "3 6 9 12 15 18 21 24 27 30" },
    constraints: ["1 <= N <= 9"],
    hints: [
      { level: 1, title: "Loop to 10", content: "for (int i = 1; i <= 10; i++)" },
      { level: 2, title: "Multiply", content: "Print N * i for each i." },
    ],
    concepts: ["for-loops", "multiplication"],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int N;

    // read N

    // print N * 1, N * 2, ... up to N * 10

}`,
    solutionCode: `#include <iostream>
using namespace std;

int main() {
    int N;
    cin >> N;
    bool first = true;
    for (int i = 1; i <= 10; i++) {
        if (!first) cout << " ";
        first = false;
        cout << N * i;
    }
    return 0;
}`,
    testCases: [{ input: "3", expectedOutput: "3 6 9 12 15 18 21 24 27 30" }],
    hiddenTests: [{ input: "2", expectedOutput: "2 4 6 8 10 12 14 16 18 20" }],
    xpReward: 20,
  },
  {
    id: "problem-020",
    title: "Power of Number",
    difficulty: "medium",
    world: "world-3",
    worldOrder: 3,
    lessonOrder: 20,
    description: "Read a base N and exponent P, and print N raised to the power of P.",
    filename: "power.cpp",
    input: "Two integers N and P (0 <= N,P <= 9)",
    output: "N raised to the power P",
    example: { input: "2 10", output: "1024" },
    constraints: ["0 <= N <= 9", "0 <= P <= 9"],
    hints: [
      { level: 1, title: "Repeated multiply", content: "Multiply the result by N, P times." },
      { level: 2, title: "Loop", content: "result = 1; for P times: result *= N;" },
    ],
    concepts: ["for-loops", "power"],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    long long N, P;

    // read the base N and the exponent P

    // multiply N by itself P times and print the result

}`,
    solutionCode: `#include <iostream>
using namespace std;

int main() {
    long long N, P;
    cin >> N >> P;
    long long result = 1;
    for (int i = 0; i < P; i++)
        result *= N;
    cout << result;
    return 0;
}`,
    testCases: [{ input: "2 10", expectedOutput: "1024" }],
    hiddenTests: [
      { input: "3 3", expectedOutput: "27" },
      { input: "5 0", expectedOutput: "1" },
    ],
    xpReward: 25,
  },
] satisfies Problem[];

export function getProblemById(id: string | undefined | null): Problem {
  const found = problems.find((p) => p.id === id);
  return found ?? problems[0];
}

/** Beginner-friendly starter (scaffold) code for a given language. */
export function getStarterCode(problem: Problem, langId: LanguageId): string {
  if (langId === "cpp") {
    return problem.starterCode || CPP_GENERIC_SCAFFOLD;
  }
  if (langId === "java") {
    return `import java.util.Scanner;

class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);

        // ${problem.title}
        // Input: ${problem.input}
        // Output: ${problem.output}
        // Example output: ${problem.example.output}
    }
}`;
  }
  return `# ${problem.title}
# Input: ${problem.input}
# Output: ${problem.output}
# Example output: ${problem.example.output}

# Type your solution below
`;
}

/** Working (solution) code used for lesson examples. C++ is primary. */
export function getSolutionCode(problem: Problem, langId: LanguageId): string {
  return getSolutionCodeFor(problem, langId);
}

/** The first problem the learner has not yet solved, in course order. */
export function getNextProblem(progress: Record<string, { status: string }>): Problem {
  return (
    problems.find((p) => progress[p.id]?.status !== "solved") ??
    problems[problems.length - 1]
  );
}

export { CPP_GENERIC_SCAFFOLD };
