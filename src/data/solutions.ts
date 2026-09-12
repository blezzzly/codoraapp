import type { Problem } from "@/types";
import type { LanguageId } from "@/lib/languages";

export const JAVA_SOLUTIONS: Record<string, string> = {
  "problem-001": `import java.util.Scanner;

class Main {
    public static void main(String[] args) {
        System.out.print("Hello, World!");
    }
}`,
  "problem-002": `import java.util.Scanner;

class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        int a = input.nextInt();
        int b = input.nextInt();
        System.out.print(a + b);
    }
}`,
  "problem-003": `import java.util.Scanner;

class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        int a = input.nextInt();
        int b = input.nextInt();
        System.out.print(a * b);
    }
}`,
  "problem-004": `import java.util.Scanner;

class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        int length = input.nextInt();
        int width = input.nextInt();
        int area = length * width;
        System.out.print(area);
    }
}`,
  "problem-005": `import java.util.Scanner;

class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        int n = input.nextInt();
        if (n % 2 == 0) {
            System.out.print("Even");
        } else {
            System.out.print("Odd");
        }
    }
}`,
  "problem-006": `import java.util.Scanner;

class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        int a = input.nextInt();
        int b = input.nextInt();
        if (a > b) {
            System.out.print(a);
        } else {
            System.out.print(b);
        }
    }
}`,
  "problem-007": `import java.util.Scanner;

class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        int a = input.nextInt();
        int b = input.nextInt();
        System.out.print(b + " " + a);
    }
}`,
  "problem-008": `import java.util.Scanner;

class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        int n = input.nextInt();
        if (n > 0) {
            System.out.print("Positive");
        } else if (n < 0) {
            System.out.print("Negative");
        } else {
            System.out.print("Zero");
        }
    }
}`,
  "problem-009": `import java.util.Scanner;

class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        int a = input.nextInt();
        int b = input.nextInt();
        int c = input.nextInt();
        int largest = a;
        if (b > largest) largest = b;
        if (c > largest) largest = c;
        System.out.print(largest);
    }
}`,
  "problem-010": `import java.util.Scanner;

class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        int score = input.nextInt();
        char grade;
        if (score >= 90) grade = 'A';
        else if (score >= 80) grade = 'B';
        else if (score >= 70) grade = 'C';
        else if (score >= 60) grade = 'D';
        else grade = 'F';
        System.out.print(grade);
    }
}`,
  "problem-011": `import java.util.Scanner;

class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        int year = input.nextInt();
        boolean leap = (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
        if (leap) {
            System.out.print("Leap Year");
        } else {
            System.out.print("Not Leap Year");
        }
    }
}`,
  "problem-012": `import java.util.Scanner;

class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        int n = input.nextInt();
        if (n % 3 == 0 && n % 5 == 0) {
            System.out.print("Divisible");
        } else {
            System.out.print("Not Divisible");
        }
    }
}`,
  "problem-013": `import java.util.Scanner;

class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        double celsius = input.nextDouble();
        double fahrenheit = celsius * 9.0 / 5.0 + 32;
        if (fahrenheit == Math.floor(fahrenheit)) {
            System.out.print((long) fahrenheit);
        } else {
            System.out.printf("%.2f", fahrenheit);
        }
    }
}`,
  "problem-014": `import java.util.Scanner;

class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        int n = input.nextInt();
        boolean first = true;
        for (int i = 1; i <= n; i++) {
            if (!first) System.out.print(" ");
            first = false;
            System.out.print(i);
        }
    }
}`,
  "problem-015": `import java.util.Scanner;

class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        int n = input.nextInt();
        long sum = 0;
        for (int i = 1; i <= n; i++) {
            sum += i;
        }
        System.out.print(sum);
    }
}`,
  "problem-016": `import java.util.Scanner;

class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        int n = input.nextInt();
        boolean first = true;
        for (int i = 2; i <= n; i += 2) {
            if (!first) System.out.print(" ");
            first = false;
            System.out.print(i);
        }
    }
}`,
  "problem-017": `import java.util.Scanner;

class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        int n = input.nextInt();
        long fact = 1;
        for (int i = 1; i <= n; i++) {
            fact *= i;
        }
        System.out.print(fact);
    }
}`,
  "problem-018": `import java.util.Scanner;

class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        long n = input.nextLong();
        int count = 0;
        while (n > 0) {
            count++;
            n /= 10;
        }
        System.out.print(count);
    }
}`,
  "problem-019": `import java.util.Scanner;

class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        int n = input.nextInt();
        boolean first = true;
        for (int i = 1; i <= 10; i++) {
            if (!first) System.out.print(" ");
            first = false;
            System.out.print(n * i);
        }
    }
}`,
  "problem-020": `import java.util.Scanner;

class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        long n = input.nextLong();
        long p = input.nextLong();
        long result = 1;
        for (long i = 0; i < p; i++) {
            result *= n;
        }
        System.out.print(result);
    }
}`,
};

export const PYTHON_SOLUTIONS: Record<string, string> = {
  "problem-001": `# prints the greeting
print("Hello, World!")`,
  "problem-002": `# read a and b, then print their sum
a, b = map(int, input().split())
print(a + b)`,
  "problem-003": `# read a and b, then print their product
a, b = map(int, input().split())
print(a * b)`,
  "problem-004": `# read length and width, then print the area
length, width = map(int, input().split())
area = length * width
print(area)`,
  "problem-005": `# check if n is even using the remainder operator
n = int(input())
if n % 2 == 0:
    print("Even")
else:
    print("Odd")`,
  "problem-006": `# compare a and b, then print the larger one
a, b = map(int, input().split())
if a > b:
    print(a)
else:
    print(b)`,
  "problem-007": `# print b first, then a
a, b = map(int, input().split())
print(b, a)`,
  "problem-008": `# three cases: positive, negative, or zero
n = int(input())
if n > 0:
    print("Positive")
elif n < 0:
    print("Negative")
else:
    print("Zero")`,
  "problem-009": `# track the largest value as you compare three numbers
a, b, c = map(int, input().split())
largest = a
if b > largest:
    largest = b
if c > largest:
    largest = c
print(largest)`,
  "problem-010": `# check from the highest grade down
score = int(input())
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
elif score >= 60:
    grade = "D"
else:
    grade = "F"
print(grade)`,
  "problem-011": `# leap year rule
year = int(input())
if (year % 4 == 0 and year % 100 != 0) or year % 400 == 0:
    print("Leap Year")
else:
    print("Not Leap Year")`,
  "problem-012": `# divisible by both 3 and 5
n = int(input())
if n % 3 == 0 and n % 5 == 0:
    print("Divisible")
else:
    print("Not Divisible")`,
  "problem-013": `# convert celsius to fahrenheit
celsius = float(input())
fahrenheit = celsius * 9.0 / 5.0 + 32
if fahrenheit == int(fahrenheit):
    print(int(fahrenheit))
else:
    print(f"{fahrenheit:.2f}")`,
  "problem-014": `# print numbers from 1 to n
n = int(input())
print(" ".join(str(i) for i in range(1, n + 1)))`,
  "problem-015": `# add every number from 1 to n
n = int(input())
total = 0
for i in range(1, n + 1):
    total += i
print(total)`,
  "problem-016": `# even numbers from 2 up to n, stepping by 2
n = int(input())
print(" ".join(str(i) for i in range(2, n + 1, 2)))`,
  "problem-017": `# multiply every number from 1 to n
n = int(input())
fact = 1
for i in range(1, n + 1):
    fact *= i
print(fact)`,
  "problem-018": `# keep dividing by 10 until nothing is left
n = int(input())
count = 0
while n > 0:
    count += 1
    n //= 10
print(count)`,
  "problem-019": `# n times every number from 1 to 10
n = int(input())
print(" ".join(str(n * i) for i in range(1, 11)))`,
  "problem-020": `# multiply n by itself p times
n, p = map(int, input().split())
result = 1
for _ in range(p):
    result *= n
print(result)`,
};

export function getSolutionCodeFor(problem: Problem, langId: LanguageId): string {
  if (langId === "cpp") return problem.solutionCode;
  if (langId === "java") return JAVA_SOLUTIONS[problem.id] ?? problem.starterCode;
  return PYTHON_SOLUTIONS[problem.id] ?? problem.starterCode;
}