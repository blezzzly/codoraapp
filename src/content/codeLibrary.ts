import type { CodeExample, Topic } from "@/types";

export const codeExamples: CodeExample[] = [
  {
    id: "lib-hello",
    category: "input-output",
    title: "Hello, World!",
    description: "Your very first program — prints a line of text.",
    code: `#include <iostream>

int main() {
    std::cout << "Hello, World!";
    return 0;
}`,
    explanation: "cout << prints the text. return 0; says the program finished fine.",
    output: "Hello, World!",
  },
  {
    id: "lib-cin",
    category: "input-output",
    title: "Read and Echo",
    description: "Read a number from the user and print it back.",
    code: `#include <iostream>

int main() {
    int n;
    std::cout << "Enter a number: ";
    std::cin >> n;
    std::cout << "You typed " << n;
    return 0;
}`,
    explanation: "cin >> pulls user input into n. Then cout prints it back.",
    output: "Enter a number: 7\nYou typed 7",
  },
  {
    id: "lib-sum",
    category: "variables",
    title: "Add Two Numbers",
    description: "Add two numbers and display the sum.",
    code: `#include <iostream>

int main() {
    int a = 5, b = 3;
    int sum = a + b;
    std::cout << sum;
    return 0;
}`,
    explanation: "Two variables hold the numbers; a third stores their sum.",
    output: "8",
  },
  {
    id: "lib-double",
    category: "data-types",
    title: "Decimals with double",
    description: "Work with non-whole numbers.",
    code: `#include <iostream>

int main() {
    double price = 9.99;
    std::cout << price;
    return 0;
}`,
    explanation: "double stores decimal values like 9.99.",
    output: "9.99",
  },
  {
    id: "lib-even",
    category: "operators",
    title: "Even or Odd Check",
    description: "Use the % operator to check parity.",
    code: `#include <iostream>

int main() {
    int n = 10;
    if (n % 2 == 0) {
        std::cout << "Even";
    } else {
        std::cout << "Odd";
    }
    return 0;
}`,
    explanation: "n % 2 gives the remainder of dividing by 2. A remainder of 0 means even.",
    output: "Even",
  },
  {
    id: "lib-age",
    category: "conditions",
    title: "Adult or Minor",
    description: "A classic if/else decision.",
    code: `#include <iostream>

int main() {
    int age = 20;
    if (age >= 18) {
        std::cout << "Adult";
    } else {
        std::cout << "Minor";
    }
    return 0;
}`,
    explanation: "The condition age >= 18 decides which branch runs.",
    output: "Adult",
  },
  {
    id: "lib-menu",
    category: "switch",
    title: "Simple Menu",
    description: "Pick a branch with switch.",
    code: `#include <iostream>

int main() {
    int choice = 2;
    switch (choice) {
        case 1: std::cout << "Cola"; break;
        case 2: std::cout << "Water"; break;
        default: std::cout << "Unknown";
    }
    return 0;
}`,
    explanation: "switch jumps to the matching case. break stops fall-through.",
    output: "Water",
  },
  {
    id: "lib-print1to5",
    category: "for-loops",
    title: "Print 1 to 5",
    description: "Repeat with a for loop.",
    code: `#include <iostream>

int main() {
    for (int i = 1; i <= 5; i++) {
        std::cout << i << " ";
    }
    return 0;
}`,
    explanation: "The loop starts i at 1, runs while i <= 5, and adds 1 each round.",
    output: "1 2 3 4 5",
  },
  {
    id: "lib-countdown",
    category: "while-loops",
    title: "Countdown",
    description: "Loop while a condition holds.",
    code: `#include <iostream>

int main() {
    int n = 5;
    while (n > 0) {
        std::cout << n << " ";
        n--;
    }
    return 0;
}`,
    explanation: "The while loop keeps going as long as n > 0, decreasing n each time.",
    output: "5 4 3 2 1",
  },
  {
    id: "lib-function",
    category: "functions",
    title: "Your First Function",
    description: "Define and call your own function.",
    code: `#include <iostream>

int square(int x) {
    return x * x;
}

int main() {
    std::cout << square(5);
    return 0;
}`,
    explanation: "square takes an int and returns its square. main calls it.",
    output: "25",
  },
  {
    id: "lib-array",
    category: "arrays",
    title: "Sum an Array",
    description: "Loop over an array of numbers.",
    code: `#include <iostream>

int main() {
    int nums[4] = {2, 4, 6, 8};
    int total = 0;
    for (int i = 0; i < 4; i++) {
        total += nums[i];
    }
    std::cout << total;
    return 0;
}`,
    explanation: "Each nums[i] is added to total. Remember indexes start at 0.",
    output: "20",
  },
  {
    id: "lib-string",
    category: "strings",
    title: "Greeting with a Name",
    description: "Join text with a string variable.",
    code: `#include <iostream>
#include <string>

int main() {
    std::string name = "Anna";
    std::cout << "Hello, " << name << "!";
    return 0;
}`,
    explanation: "The string holds text, and + or << joins it with other text.",
    output: "Hello, Anna!",
  },
  {
    id: "lib-pointer",
    category: "pointers",
    title: "Pointer Basics",
    description: "Store and use a memory address.",
    code: `#include <iostream>

int main() {
    int x = 5;
    int* p = &x;
    *p = 10;
    std::cout << x;
    return 0;
}`,
    explanation: "p points at x. Writing *p = 10 changes x to 10.",
    output: "10",
  },
  {
    id: "lib-struct",
    category: "structures",
    title: "A Student Struct",
    description: "Group related data into one type.",
    code: `#include <iostream>
#include <string>

struct Student {
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
    explanation: "The struct groups a name and age. Each Student object holds its own values.",
    output: "Anna 20",
  },
  {
    id: "lib-class",
    category: "classes",
    title: "A Tiny Class",
    description: "Data and behavior in one class.",
    code: `#include <iostream>

class Dog {
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
    explanation: "Dog is the blueprint; buddy is an object made from it.",
    output: "Woof!",
  },
];

const categoryLabels: Record<Topic, string> = {
  introduction: "Introduction",
  variables: "Variables",
  "data-types": "Data Types",
  "input-output": "Input / Output",
  operators: "Operators",
  conditions: "Conditions",
  switch: "Switch",
  "for-loops": "Loops",
  "while-loops": "Loops",
  "do-while-loops": "Loops",
  functions: "Functions",
  arrays: "Arrays",
  strings: "Strings",
  pointers: "Pointers",
  structures: "Structures",
  oop: "OOP",
  classes: "Classes",
};

export function codeExamplesByCategory(): Record<string, CodeExample[]> {
  const groups: Record<string, CodeExample[]> = {};
  for (const ex of codeExamples) {
    const label = categoryLabels[ex.category] || ex.category;
    (groups[label] = groups[label] || []).push(ex);
  }
  const order = ["Introduction", "Input / Output", "Variables", "Data Types", "Operators", "Conditions", "Switch", "Loops", "Functions", "Arrays", "Strings", "Pointers", "Structures", "Classes"];
  return Object.fromEntries(order.filter((k) => groups[k]).map((k) => [k, groups[k]]));
}