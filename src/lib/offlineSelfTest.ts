"use client";

import { runOffline, type OfflineExecResult } from "@/lib/offlineExecutor";
import { offlineRuntime } from "@/lib/offlineRuntime/manager";

export interface OfflineEngineSelfCheck {
  installed: boolean;
  verified: boolean;
  run?: OfflineExecResult;
}

export interface OfflineSelfTestResult {
  ok: boolean;
  cpp: OfflineEngineSelfCheck;
  python: OfflineEngineSelfCheck;
  java: OfflineEngineSelfCheck;
  errors: string[];
}

const CPP_PROBE = `#include <iostream>
int main() {
  std::cout << "cpp-offline-ok";
  return 0;
}`;

const PY_PROBE = `print("py-offline-ok")`;

const JAVA_PROBE_HELLO = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from offline Codora!");
    }
}`;

const JAVA_PROBE_SCANNER = `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        System.out.print("Enter your name: ");
        String name = scanner.nextLine();

        System.out.println("Hello " + name);
    }
}`;

const JAVA_PROBE_FEATURES = `import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Variables and types
        int num = 42;
        double pi = 3.14;
        boolean flag = true;
        String text = "Java";
        
        // if/else
        if (num > 0) {
            System.out.println("Positive: " + num);
        } else {
            System.out.println("Non-positive");
        }
        
        // loops
        int sum = 0;
        for (int i = 1; i <= 10; i++) {
            sum += i;
        }
        System.out.println("Sum 1..10: " + sum);
        
        // methods
        System.out.println("Square of 5: " + square(5));
        
        // classes and inheritance
        Animal dog = new Dog();
        dog.speak();
        
        // interfaces
        Flyable bird = new Bird();
        bird.fly();
        
        // ArrayList
        List<String> list = new ArrayList<>();
        list.add("A");
        list.add("B");
        System.out.println("List size: " + list.size());
        
        // HashMap
        Map<String, Integer> map = new HashMap<>();
        map.put("one", 1);
        map.put("two", 2);
        System.out.println("Map value: " + map.get("one"));
        
        // exception handling
        try {
            int result = 10 / 0;
        } catch (ArithmeticException e) {
            System.out.println("Caught exception: " + e.getMessage());
        }
        
        System.out.println("All features OK");
    }
    
    static int square(int x) {
        return x * x;
    }
}

class Animal {
    void speak() {
        System.out.println("Animal speaks");
    }
}

class Dog extends Animal {
    @Override
    void speak() {
        System.out.println("Dog barks");
    }
}

interface Flyable {
    void fly();
}

class Bird implements Flyable {
    public void fly() {
        System.out.println("Bird flies");
    }
}`;

/**
 * End-to-end offline check using the EXACT executor path the editor uses:
 * engine registry → SHA-256 file verification → real worker compile+run.
 * This is what a mobile PWA user runs to confirm "Run" works with no network.
 */
export async function runOfflineSelfTest(): Promise<OfflineSelfTestResult> {
  const errors: string[] = [];
  const result: OfflineSelfTestResult = {
    ok: false,
    cpp: { installed: false, verified: false },
    python: { installed: false, verified: false },
    java: { installed: false, verified: false },
    errors,
  };

  try {
    const cppState = await offlineRuntime.engineState("cpp");
    result.cpp.installed = cppState.installed;
    if (cppState.installed) {
      try {
        result.cpp.verified = (await offlineRuntime.verify("cpp")).ok;
      } catch (e) {
        result.cpp.verified = false;
        errors.push(`C++ verify: ${(e as Error).message}`);
      }
    }
  } catch (e) {
    errors.push(`C++ registry: ${(e as Error).message}`);
  }

  try {
    const pyState = await offlineRuntime.engineState("python");
    result.python.installed = pyState.installed;
    if (pyState.installed) {
      try {
        result.python.verified = (await offlineRuntime.verify("python")).ok;
      } catch (e) {
        result.python.verified = false;
        errors.push(`Python verify: ${(e as Error).message}`);
      }
    }
  } catch (e) {
    errors.push(`Python registry: ${(e as Error).message}`);
  }

  try {
    const javaState = await offlineRuntime.engineState("java");
    result.java.installed = javaState.installed;
    if (javaState.installed) {
      try {
        result.java.verified = (await offlineRuntime.verify("java")).ok;
      } catch (e) {
        result.java.verified = false;
        errors.push(`Java verify: ${(e as Error).message}`);
      }
    }
  } catch (e) {
    errors.push(`Java registry: ${(e as Error).message}`);
  }

  if (result.cpp.installed) {
    try {
      const r = await runOffline(CPP_PROBE, "cpp");
      result.cpp.run = r;
      if (!r.success || !r.output.includes("cpp-offline-ok")) {
        errors.push(`C++ probe: ${r.error ?? r.output}`);
      }
    } catch (e) {
      errors.push(`C++ run: ${(e as Error).message}`);
    }
  }

  if (result.python.installed) {
    try {
      const r = await runOffline(PY_PROBE, "python");
      result.python.run = r;
      if (!r.success || !r.output.includes("py-offline-ok")) {
        errors.push(`Python probe: ${r.error ?? r.output}`);
      }
    } catch (e) {
      errors.push(`Python run: ${(e as Error).message}`);
    }
  }

  if (result.java.installed) {
    // Test 1: Hello World
    try {
      const r = await runOffline(JAVA_PROBE_HELLO, "java", "");
      result.java.run = r;
      if (!r.success || !r.output.includes("Hello from offline Codora!")) {
        errors.push(`Java Hello probe: ${r.error ?? r.output}`);
      }
    } catch (e) {
      errors.push(`Java Hello run: ${(e as Error).message}`);
    }

    // Test 2: Scanner interactive
    try {
      const r = await runOffline(JAVA_PROBE_SCANNER, "java", "TestUser\n");
      if (!r.success || !r.output.includes("Hello TestUser")) {
        errors.push(`Java Scanner probe: ${r.error ?? r.output}`);
      }
    } catch (e) {
      errors.push(`Java Scanner run: ${(e as Error).message}`);
    }

    // Test 3: Beginner Java features
    try {
      const r = await runOffline(JAVA_PROBE_FEATURES, "java", "");
      if (!r.success || !r.output.includes("All features OK")) {
        errors.push(`Java Features probe: ${r.error ?? r.output}`);
      }
    } catch (e) {
      errors.push(`Java Features run: ${(e as Error).message}`);
    }
  }

  result.ok = result.cpp.installed && result.python.installed && result.java.installed && errors.length === 0;
  return result;
}