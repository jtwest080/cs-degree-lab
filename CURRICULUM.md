# Curriculum outline and build log

This file tracks which units are written, what each unit teaches, and how each unit builds on the ones before it. Update it at the end of every phase.

## Status

| # | Unit | Status | Lessons | Exercises | Project |
|---|---|---|---|---|---|
| 1 | How Computers Work | ✅ Complete (Phase 1) | 6 | 30 | 4-bit adder from NAND gates |
| 2 | Programming Fundamentals (Python) | ✅ Complete (Phase 1) | 9 | 45 | Swiss Army Converter |
| 3 | Core Data Structures | ✅ Complete (Phase 2) | 9 | 43 | Gradebook Analyser |
| 4 | Problem Solving & Algorithms I | ✅ Complete (Phase 3) | 8 | 40 | Library Catalogue |
| 5 | Object-Oriented Programming | ✅ Complete (Phase 4) | 9 | 43 | Corner Shop |
| 6 | Discrete Math for CS | ✅ Complete (Phase 5) | 9 | 45 | Social Network Analyser |
| 7 | Data Structures II | ✅ Complete (Phase 6) | 9 | 45 | Help Desk |
| 8 | Algorithms II | ✅ Complete (Phase 7) | 9 | 41 | Route Planner |
| 9 | Computer Systems (C) | ✅ Complete (Phase 8) | 9 | 37 | Mini CPU (assembler + emulator) |
| 10 | Operating Systems | ✅ Complete (Phase 9) | 9 | 41 | Mini Kernel (scheduler, page replacement, deadlock detector) |
| 11 | Networking | ✅ Complete (Phase 10) | 9 | 44 | Mini Network Toolkit (subnets, routing, DNS cache, TCP reassembly, URLs) |
| 12 | Databases | ✅ Complete (Phase 11) | 9 | 41 | Campus Registrar Database (clean, constrain, index and report on a messy export) |
| 13 | Web Development | ✅ Complete (Phase 12) | 9 | 41 | Task Manager Page (HTML + CSS + JS, tested in a real browser engine) |
| 14 | Software Engineering | Planned | | | |
| 15 | Theory of Computation | Planned | | | |
| 16 | Security | Planned | | | |
| 17 | AI & Machine Learning | Planned | | | |
| 18 | Capstone Projects | Planned | | | |

Totals so far: 113 lessons, 536 practice exercises, 113 lesson quizzes (678 multiple-choice questions + 113 coding questions), 13 unit projects, 991 glossary terms. Every reference solution passes its tests in both desktop Python and Pyodide, and every C solution passes in the same PicoC engine the browser uses (`npm run verify`).

## Unit 1: How Computers Work ✅

| Lesson | Id | Teaches |
|---|---|---|
| 1.1 Bits and Binary | `u1-binary` | why two states, bits/bytes, 2ⁿ patterns, binary ↔ decimal, first Python (`print`, `answer = ...`, `0b`, `bin`, `int(x, 2)`) |
| 1.2 Representing Everything with Bits | `u1-data` | encodings, hexadecimal, ASCII/Unicode/UTF-8, two's complement, overflow, floats (preview), colours/images/sound |
| 1.3 Logic Gates | `u1-logic` | Boolean logic, NOT/AND/OR/XOR/NAND/NOR, truth tables, De Morgan, half and full adders, gates as Python functions |
| 1.4 Inside the CPU | `u1-cpu` | ALU, registers, PC, control unit, clock, ISAs, fetch-decode-execute, jumps → decisions and loops, TOY simulated CPU |
| 1.5 Memory | `u1-memory` | addresses, RAM, address size limits, multi-byte values and endianness, stored-program design, memory hierarchy, caches, locality, AMAT |
| 1.6 From Code to Instructions | `u1-translation` | abstraction layers, assembly, compilers (tokens → syntax tree → code), interpreters, JIT, stack machines, CPython bytecode and VM, syntax vs runtime errors |
| Project | | build NOT/AND/OR/XOR from NAND, then half adder, full adder and a 4-bit ripple-carry adder |

## Unit 2: Programming Fundamentals (Python) ✅

| Lesson | Id | Teaches |
|---|---|---|
| 2.1 Your First Programs | `u2-first-programs` | programs as statement sequences, `print` (args, `sep`, `end`), strings and escapes, comments, SyntaxError and NameError |
| 2.2 Variables, Assignment and Arithmetic | `u2-variables` | assignment semantics, name-tag model, naming rules, `+ - * / // % **`, precedence, multiple assignment and swapping |
| 2.3 Data Types | `u2-types` | int/float/str/bool, `type()`, float imprecision and safe comparison, string methods, conversions, `round`, dynamic typing |
| 2.4 Input and Output | `u2-io` | `input()` always returns str, converting input, f-strings, format specs (`.2f`, `,`, `%`, alignment, `02d`), input-process-output |
| 2.5 Making Decisions | `u2-conditionals` | comparisons, indentation and blocks, `if`/`elif`/`else`, order of conditions, `and`/`or`/`not`, short-circuiting, De Morgan, boundary testing |
| 2.6 while Loops | `u2-while` | loop mechanics and tracing, counters, accumulators, sentinels, `while True` + `break`, validation loops, infinite loops, digit loops |
| 2.7 for Loops | `u2-for` | `range` (stop excluded), looping over strings, for vs while, nested loops and n² work, `continue`, flags |
| 2.8 Functions | `u2-functions` | `def`, parameters vs arguments, `return` vs `print`, `None`, call stack and frames, local scope, defaults, keyword args, docstrings, decomposition |
| 2.9 Debugging, Testing and Handling Errors | `u2-debugging` | error kinds, reading tracebacks, exception field guide, systematic debugging, `assert` tests, mutation testing, `try`/`except`, `raise` |
| Project | | menu-driven unit converter with validated input, separate return-value functions and a main loop |

## Unit 3: Core Data Structures ✅

| Lesson | Id | Teaches |
|---|---|---|
| 3.1 Lists | `u3-lists` | why collections, list literals, indexing from 0 (as an offset, ← 1.5), negative indexes, IndexError, mutability, `append`/`insert`/`pop`/`remove`, `len`/`sum`/`min`/`max`/`sorted`/`in`, building lists in loops |
| 3.2 Slicing and List Algorithms | `u3-list-algorithms` | slices (start/stop/step, copy, reverse), `range(len())`, `enumerate`, `sort` vs `sorted`, `+`/`*`/`extend`/`del`, filter/transform/reduce/search patterns, linear search, two-pointer in-place reversal |
| 3.3 Strings in Depth | `u3-strings` | strings as sequences, immutability in practice, `split`/`join`, search and cleaning methods, `ord`/`chr` and the Caesar cipher, parsing fields, building strings with lists |
| 3.4 References, Copies and Nested Lists | `u3-references` | objects and references, aliasing, mutate vs rebind, `==` vs `is`, functions receive references, in-place vs returning new, shallow vs deep copy, grids and the `[[0]*n]*m` trap |
| 3.5 Tuples, Unpacking and zip | `u3-tuples` | tuples and when to use them, the one-item tuple, packing/unpacking, returning several values, `zip`, records, sorting and `min`/`max` with `key=`, tuple keys, lambda (brief), stable sort |
| 3.6 Dictionaries | `u3-dicts` | key-value lookup, add/update/delete, KeyError, `in` and `get`, `keys`/`values`/`items`, counting and grouping patterns, records as dicts, hashing and why keys must be immutable |
| 3.7 Sets | `u3-sets` | uniqueness and no order, `set()` vs `{}`, `add`/`remove`/`discard`, fast membership, the seen-set pattern, union/intersection/difference/symmetric difference (← 1.3 logic), subsets, two-sum |
| 3.8 Comprehensions and Choosing a Data Structure | `u3-comprehensions` | list/set/dict comprehensions, conditional expressions, nested comprehensions, `any`/`all`/generator expressions, when not to use comprehensions, comparing list/tuple/dict/set, canonical forms (anagrams) |
| 3.9 Reading and Writing Files | `u3-files` | persistence (← 1.5 volatile RAM), paths, `with open`, modes r/w/a, reading whole files and line by line, writing with newlines, CSV with a header row, FileNotFoundError, cleaning messy lines |
| Project | | Gradebook Analyser: load a messy CSV into a dict of dicts, per-student averages and letter grades, per-assignment stats, ranked top students, and an exactly formatted report file |

## Unit 4: Problem Solving & Algorithms I ✅

| Lesson | Id | Teaches |
|---|---|---|
| 4.1 How to Solve Problems | `u4-problem-solving` | what an algorithm is, Pólya's four steps, examples and edge cases first, decomposition, pseudocode, tracing, looking back; leap years, dates and the Luhn checksum |
| 4.2 Counting Steps | `u4-counting-steps` | measuring work by counting steps, growth rates, informal Big O (O(1), O(log n), O(n), O(n²), O(2ⁿ)), logarithms as halvings, hidden loops (`in` on a list, `index`, slices), worst case, sets/dicts to remove n² work |
| 4.3 Binary Search | `u4-binary-search` | searching sorted data by halving, low/high/mid, loop invariants, off-by-one traps, lower bound, counting in a range, guessing games, integer square root by search |
| 4.4 Simple Sorts | `u4-simple-sorts` | selection sort, insertion sort, tracing passes, in-place vs new list, stability, sorting records by key, counting comparisons, counting sort |
| 4.5 Recursion | `u4-recursion` | functions that call themselves, base and recursive cases, the call stack (← 2.8), RecursionError, recursion on numbers/strings/lists, exponential naive Fibonacci and memoisation |
| 4.6 Thinking Recursively | `u4-recursive-thinking` | the leap of faith, recursive data (nested lists), fast power by halving, recursive binary search, generating subsets (backtracking), Towers of Hanoi |
| 4.7 Merge Sort and Divide and Conquer | `u4-merge-sort` | divide and conquer, merging sorted lists, merge sort and why it's n log n, quicksort and pivots, comparing sorts by measurement, counting inversions |
| 4.8 Brute Force, Greedy Algorithms and Choosing a Strategy | `u4-strategies` | exhaustive search and estimating its size, pruning, brute force as a test reference, greedy change-making and where it fails, earliest-end scheduling and exchange arguments, travelling salesperson, a strategy checklist |
| Project | | Library Catalogue: load a CSV of books, stable merge sort with a key, binary search for exact titles, prefix ranges and year ranges, tested on 200,000 books by counting how many items each search looks at |

## Unit 5: Object-Oriented Programming ✅

| Lesson | Id | Teaches |
|---|---|---|
| 5.1 Classes and Objects | `u5-classes` | why own types (vs Unit 3/4 tuples), class vs instance, `__init__`, attributes, `self`, objects as references (← 3.4), lists of objects |
| 5.2 Methods and State | `u5-methods` | queries vs commands, class invariants, check-then-change with `raise` (← 2.9), methods calling methods, history lists, the mutable default trap, finite state machines |
| 5.3 Special Methods | `u5-special-methods` | dunder protocol, `__str__`/`__repr__`, `__eq__` and `NotImplemented`, hashability, `__lt__` and sorting (← 4.4), operator overloading, `__len__`/`__getitem__`/`__contains__`, delegation |
| 5.4 Encapsulation, Properties and Class Attributes | `u5-encapsulation` | interface vs implementation, `_private` convention, `@property`, setters with validation, decorators (first look), class attributes and the `self.x +=` trap, `@classmethod` alternative constructors |
| 5.5 Composition | `u5-composition` | has-a, objects as attributes, delegation, Law of Demeter, dependency injection, composition vs aggregation, consistent two-way links, object diagrams |
| 5.6 Inheritance | `u5-inheritance` | is-a, subclasses, attribute lookup up to `object`, overriding, base code calling overrides, `super()`, `isinstance`, Liskov substitution, favour composition |
| 5.7 Polymorphism and Interfaces | `u5-polymorphism` | one interface many forms, replacing type switches (open/closed), abstract base classes (`NotImplementedError`, `abc.ABC`, `@abstractmethod`), duck typing and protocols, expression trees (← 4.6 recursion, 1.6 syntax trees) |
| 5.8 Modules, Dataclasses and Custom Exceptions | `u5-modules-dataclasses` | modules and `import` forms, standard library tour (`math`, `random`, `collections`, `itertools`, `statistics`), `__name__ == "__main__"`, dataclasses (`order`, `frozen`, `default_factory`), type hints, exception hierarchies with attributes, `else`/`finally` |
| 5.9 Designing with Objects | `u5-design` | nouns and verbs, responsibilities and CRC cards, cohesion and coupling, SOLID, code smells and refactoring, test doubles via dependency injection, injecting randomness, KISS and YAGNI |
| Project | | Corner Shop: frozen `Product` dataclass, `ShopError` exception family, encapsulated `Inventory`, `Basket` composed with an inventory, abstract `DiscountRule` with `PercentOff` and `MultiBuy`, a `Checkout` that prints exact receipts and pays atomically; tests plug in their own rule class |

## Unit 6: Discrete Math for CS ✅

| Lesson | Id | Teaches |
|---|---|---|
| 6.1 Logic | `u6-logic` | propositions, connectives, truth tables generated with `itertools.product`, implication and its converse/inverse/contrapositive, tautologies and equivalence checking by brute force, knights and knaves, DNF from a truth table, satisfiability |
| 6.2 Predicates and Quantifiers | `u6-predicates` | predicates as bool functions, domains, ∀/∃ as `all`/`any`, negating quantifiers, counterexample search (Euler's n² + n + 41), nested quantifiers and their order, "exactly one", translating rules into code |
| 6.3 Sets, Relations and Functions | `u6-sets-relations` | set-builder notation vs comprehensions, power sets, Cartesian products, relations as sets of pairs, reflexive/symmetric/transitive, equivalence classes and partitions, partial orders, transitive closure (prerequisites), injective/surjective/bijective, composition |
| 6.4 Proofs | `u6-proofs` | direct proof, contrapositive, contradiction (√2, infinitely many primes), cases, construction, counterexamples, loop invariants as proofs about code, common fallacies; code as exploration, never as proof |
| 6.5 Induction | `u6-induction` | weak induction as recursion run backwards, checking inductive steps, strong induction (postage, prime factorisation, Fundamental Theorem of Arithmetic), recurrences and closed forms, structural induction on trees (Catalan numbers) |
| 6.6 Counting | `u6-counting` | sum/product rules, complements, permutations and combinations (own `factorial`/`perm`/`comb`), Pascal's triangle and the binomial theorem, pigeonhole principle (constructive collision finding), inclusion-exclusion with lcm; every formula checked against `itertools` |
| 6.7 Probability | `u6-probability` | sample spaces and events with exact `Fraction`s, complement and addition rules, conditional probability, independence, Bayes' rule and base rates, expected value and variance, Monte Carlo simulation with seeded `random`, birthday problem, Monty Hall |
| 6.8 Number Theory | `u6-number-theory` | divisibility and `divmod`, primes and the sieve, Euclid's gcd and lcm, modular arithmetic (calendars, ISBN-10 and Luhn check digits, hashing), square-and-multiply, extended Euclid and modular inverses, toy RSA |
| 6.9 Graphs | `u6-graphs` | vertices/edges, directed and weighted, degree and the handshake lemma, adjacency lists vs matrices, walks/paths/cycles and walk counting with matrix powers, reachability with an explicit stack, connected components, trees (n − 1 edges), Euler paths and Hierholzer's algorithm |
| Project | | Social Network Analyser: clean a messy friendship CSV into an adjacency list, handshake check, degree ranking, mutual friends and friend suggestions, components, fast triangle counting via mutual friends (tested on 3,000 people), density as probability, clustering, and comparison with a random network's expected triangles |

## Unit 7: Data Structures II ✅

| Lesson | Id | Teaches |
|---|---|---|
| 7.1 Abstract Data Types and Dynamic Arrays | `u7-adts-arrays` | ADT vs data structure, one ADT two ways, arrays and O(1) indexing, dynamic array with doubling, amortised analysis, growth policies, shrinking at a quarter (thrashing), shifting cost of insert/delete, list operation costs |
| 7.2 Stacks | `u7-stacks` | LIFO, Stack class with custom exception, undo/redo (command pattern), bracket matching with positions, postfix evaluation, shunting-yard with right-associative `^`, call stack and recursion → explicit stack |
| 7.3 Queues and Deques | `u7-queues` | FIFO, why `pop(0)` is slow, two-stack queue (amortised), circular buffer with `%`, `collections.deque` (`maxlen`, `rotate`), Josephus, minute-by-minute till simulation, monotonic deque for sliding-window maximum |
| 7.4 Linked Lists | `u7-linked-lists` | nodes and references, traversal, insert/delete by rewiring, head and tail, dummy nodes, reverse in place, slow/fast pointers (middle, palindrome), Floyd cycle detection with start and length, doubly linked list with sentinels, array vs linked list (cache locality) |
| 7.5 Hash Tables | `u7-hash-tables` | map ADT, hash functions and polynomial string hashing, collisions (pigeonhole, birthday), separate chaining, load factor, resizing and rehashing, open addressing with linear probing and tombstones, hashing applications (two sum, anagrams), LRU cache = dict + doubly linked list |
| 7.6 Trees and Traversals | `u7-trees` | vocabulary (depth, height as levels), binary trees, recursion on trees, preorder/inorder/postorder, level order with a queue, iterative traversals with a stack, general trees (file system), expression trees, rebuilding from preorder + inorder |
| 7.7 Binary Search Trees | `u7-bst` | BST property, search/insert as one path, delete (three cases, successor), validating with bounds, floor/ceiling/range queries with pruning, insertion order vs height, rotations and self-balancing (AVL, red-black) overview, building balanced trees, BST vs hash table |
| 7.8 Heaps and Priority Queues | `u7-heaps` | priority queue ADT, heap property, array layout (2i + 1, 2i + 2, (i − 1) // 2), sift up/down, O(n) bottom-up heapify, heapsort, `heapq` with `(priority, counter, item)`, top-k, k-way merge, lazy deletion scheduler, running median with two heaps |
| 7.9 Graphs and Graph Search | `u7-graphs` | Graph class (directed flag, in/out-degree), BFS with a queue (distances, parents, shortest paths, why it works, O(V + E)), grids and state spaces as implicit graphs, DFS recursive and iterative, BFS vs DFS, cycle detection (undirected via parent, directed via white/grey/black, reporting the cycle), DAGs and topological order with Kahn's algorithm (heap for alphabetical order, semesters by level) |
| Project | | Help Desk: a chained hash map built only from lists (resizing at load factor 0.75), a heap priority queue with lazy deletion and id tie-breaks, an undo stack for open/escalate/close, a `deque(maxlen=5)` of recent tickets, and a command processor for `desk.txt` |

41 glossary terms.

## Unit 8: Algorithms II ✅

| Lesson | Id | Teaches |
|---|---|---|
| 8.1 Asymptotic Analysis | `u8-asymptotics` | formal O, Ω, Θ definitions with witnesses, growth-rate hierarchy, comparing functions, sums and closed forms, best/worst/average case, analysing loops |
| 8.2 Recurrences | `u8-recurrences` | recurrence relations, unrolling, recursion trees, the master theorem and its three cases, when it does not apply |
| 8.3 Divide and Conquer | `u8-divide-conquer` | divide/conquer/combine, merge sort, quickselect and partition, closest pairs and other splitting patterns, recurrence for each |
| 8.4 Sorting Lower Bounds and Linear-Time Sorts | `u8-sorting-bounds` | decision-tree Ω(n log n) bound for comparison sorts, counting sort, radix sort, bucket sort, stability |
| 8.5 Greedy Algorithms and Exchange Arguments | `u8-greedy` | greedy-choice property, exchange argument, interval scheduling, lateness (EDF), interval partitioning with a heap, fractional knapsack, Huffman coding, where greedy fails (0/1 knapsack, coin systems) |
| 8.6 Dynamic Programming I | `u8-dp-basics` | overlapping subproblems, memoisation (`@cache`) vs tabulation, DP recipe (state, recurrence, order, answer), stairs, coin change (fewest and ways), longest increasing subsequence, grid paths |
| 8.7 Dynamic Programming II | `u8-dp-sequences` | LCS and diff, edit distance and edit scripts, 0/1 knapsack (2D and 1D), pseudo-polynomial time, subset sum and partition, tracebacks, word break |
| 8.8 Shortest Paths | `u8-shortest-paths` | weighted graphs, Dijkstra with a heap and stale-entry skipping, path reconstruction, Bellman-Ford with negative-cycle detection, currency arbitrage, Floyd-Warshall, choosing an algorithm |
| 8.9 Minimum Spanning Trees and Union-Find | `u8-spanning-trees` | spanning trees, cut property, union-find (path compression, union by size), Kruskal, Prim, clustering, cycle detection, bottleneck paths |
| Project | | Route Planner: Dijkstra for quickest routes, Kruskal with your own union-find for the cheapest network, 0/1 knapsack for a sightseeing plan, and a command processor for `map.txt` |

47 glossary terms.

## Unit 9: Computer Systems (C) ✅

All code runs in the browser with PicoC (a small C interpreter compiled to WebAssembly, vendored in `src/vendor/picoc.js`, run in `src/workers/c.worker.js` via `src/lib/cEngine.js`).

| Lesson | Id | Teaches |
|---|---|---|
| 9.1 Hello, C | `u9-hello-c` | compile-and-run model, types and sizes, wraparound, printf format specifiers, casts, integer division |
| 9.2 Control Flow and Functions | `u9-control-functions` | if/loops/switch, prototypes, scope, `static`, pass by value, stack frames, exit status |
| 9.3 Arrays and Strings | `u9-arrays-strings` | arrays, bounds (no checking), null-terminated strings, `string.h`, buffer overflow |
| 9.4 Pointers | `u9-pointers` | addresses, dereference, swap, output parameters, pointer arithmetic, NULL, common pointer bugs |
| 9.5 Pointers and Strings | `u9-pointers-strings` | array decay, char array vs `char *`, `*s++` idioms, arrays of strings, `const` |
| 9.6 Structs, Enums and Unions | `u9-structs` | structs, `->`, padding and alignment, enums, unions, a ring buffer |
| 9.7 The Heap | `u9-heap` | stack vs heap, malloc/calloc/realloc/free, leaks, use-after-free, double free, ownership, dynamic arrays, linked lists, allocator headers |
| 9.8 Bits, Bytes and Number Representation | `u9-bits` | hex, bitwise operators, masks and flags, packing, two's complement, endianness, byte swapping |
| 9.9 From Source to Machine Code | `u9-compilation` | preprocess/compile/assemble/link, macros, reading x86-64 assembly, calling convention and stack frames, linking errors, fetch-decode-execute, a bytecode VM |
| Project | | Mini CPU: an assembler (two passes, labels) and emulator (registers, stack, CALL/RET, error codes) for a small instruction set |

58 glossary terms.

**PicoC limits that shape the lessons** (verified by probing; keep these in mind for any C content):
- No function pointers; `T a[]` array parameters are copied, so write `T *a` (and `int *g` for 2D data); `char **words` works.
- A typedef name cannot be a function's return type: write `struct X *`.
- `while (p)` and `if (p)` on struct pointers fail: compare with `!= NULL`.
- Unsigned right shift and unsigned comparisons behave as signed; `long` is 4 bytes; ternary evaluates both branches (so no recursion through `?:`); macro arguments are not re-evaluated; pointer subtraction gives bytes. Mask after shifting.
- Deep recursion (about 1000 frames) runs out of memory; no heap or undefined-behaviour detection.
- Test semantics for C: a test `code` is JavaScript with `output`, `status`, `error` and `source`; `append` replaces the learner's `main` (renamed `learner_main`). `scripts/verify_c.mjs` checks examples, solutions and starters; `scripts/autofill_c.mjs` fills `output: AUTO` placeholders.

## Unit 10: Operating Systems ✅

Python again. Pyodide has no threads or `fork`, so every OS idea is **simulated**: plain classes for kernels and file systems, and generators that `yield` at switch points for concurrency, run by a deterministic kernel that interprets request tuples such as `("step",)`, `("wait", sem)` and `("signal", sem)`. Examples must be deterministic and identical on desktop Python and Pyodide (no `sys.platform`, threads or `fork`; use `runnable: false` for such snippets).

| Lesson | Id | Teaches |
|---|---|---|
| 10.1 What an Operating System Does | `u10-os-overview` | kernel vs user mode, system calls and traps, file descriptors, strace-style tracing, boot order |
| 10.2 Processes | `u10-processes` | process states, PCB and context switch, fork/exit/wait, zombies and orphans, signals |
| 10.3 CPU Scheduling | `u10-scheduling` | FCFS, SJF, SRTF, round robin, turnaround/waiting/response metrics |
| 10.4 Threads and Races | `u10-concurrency` | concurrency vs parallelism, interleavings, races, check-then-act, Amdahl's law |
| 10.5 Synchronization | `u10-synchronization` | semaphores, mutexes, critical sections, bounded buffer, compare-and-swap |
| 10.6 Deadlock | `u10-deadlock` | wait-for graphs, Coffman conditions, banker's algorithm, lock ordering |
| 10.7 Memory Management | `u10-memory` | allocators (first/best/worst fit, coalescing), paging, address translation, two-level tables, TLB, fragmentation |
| 10.8 Virtual Memory | `u10-virtual-memory` | demand paging, FIFO/LRU/optimal/clock, Belady's anomaly, working sets, thrashing |
| 10.9 File Systems and Storage | `u10-filesystems` | inodes and block pointers, paths and links, permissions, journaling, disk scheduling |
| Project | | Mini Kernel: round-robin/FCFS scheduler, page-replacement counter (FIFO/LRU/OPT) and deadlock detector driven by a workload file |

111 glossary terms.

**Gotchas for later Python units:** a project test function cannot be named `run`; test code shares no state with the learner's other exercises, so include reference helpers inside each test; avoid float knife-edges in tests; state tie-breaking rules in prompts. `scripts/autofill_py.py <lesson.yaml>` fills `output: |` + `AUTO` placeholders.

## How the units connect (prerequisite check)

Before writing each unit, check that everything it relies on has already been taught, and note deliberate callbacks.

**Unit 1** assumes nothing. It introduces just enough Python to check answers (`print`, `name = value`, arithmetic, `0b`/`0x`, and fill-in-the-blank `def ... return` templates), and says explicitly that Unit 2 teaches these properly. The TOY CPU and stack-machine programs are written as lists of tuples; this is presented as notation for the simulator, with lists themselves deferred to Unit 3.

**Unit 2** builds on Unit 1 throughout:
- 2.1 syntax vs runtime errors ← 1.6 compile-then-run
- 2.2 `//` and `%` digit extraction ← 1.1 divide-by-2 binary conversion
- 2.3 float imprecision ← 1.2 binary encodings and floating point; `ord`/`chr` text ← 1.2 character codes
- 2.4 `input()` returns text ← 1.2 keyboard input is character codes
- 2.5 `and`/`or`/`not` and De Morgan ← 1.3 logic gates
- 2.6 `while` loops ← 1.4 conditional and backward jumps; the "skips past zero" infinite loop ← 1.4 exercise
- 2.7 nested-loop work counting → foreshadows Big-O (Unit 8)
- 2.8 call stack ← 1.6 stack machines; abstraction ← 1.6
- 2.9 traceback stack ← 2.8 call stack; boundary tests ← 2.5

Deliberate forward references in Unit 2 (flagged in the lesson text): a list literal used as "for each of these years" in a 2.8 example; `IndexError`/`KeyError` mentioned as coming in Unit 3. Unit 2 exercises avoid lists, indexing and slicing entirely.

**Unit 3** builds on Units 1 and 2:
- 3.1 zero-based indexing ← 1.5 address arithmetic; building lists ← 2.6 accumulators and sentinels; IndexError ← promised in 2.9
- 3.2 slice stop excluded ← 2.7 `range`; linear search and halving → binary search in Unit 4 (← 2.9 divide-and-conquer debugging); swaps ← 2.2 multiple assignment
- 3.3 immutability ← 2.3; `ord`/`chr` ← 1.2 character codes; `join` fixes the trailing-separator problem from 2.7
- 3.4 references ← 2.2 name-tag model; parameters as references ← 2.8 local scope; grids ← 2.7 nested loops
- 3.5 unpacking ← 2.2 swapping; `enumerate` pairs ← 3.2; key functions ← 2.8 functions (functions as values was hinted at in the Unit 2 project stretch goals)
- 3.6 KeyError ← promised in 2.9; hashing → hash tables in Unit 7
- 3.7 set operators ← 1.3 AND/OR/XOR; seen set fixes 3.2's n² dedupe (← 2.7 n² counting)
- 3.8 comprehensions = the 3.2 filter/transform patterns; `any` short-circuits ← 2.5
- 3.9 persistence ← 1.5 volatile memory; UTF-8 ← 1.2; try/except ← 2.9

Deliberate forward references in Unit 3 (flagged in the text): `import copy` and `import random` (modules properly in Unit 5); a generator expression inside `join` in a 3.4 example (explained in 3.8); binary search, hash tables, graphs and Big-O named as coming later. Exercises in each lesson only use what has been taught up to that lesson.

Technical note: lessons can create sample files in their hidden `prelude` (3.9 and the project do this). The browser's Pyodide file system is in memory, so files are recreated on every run and vanish on reload; the desktop verifier runs in a temporary folder.

**Unit 4** builds on Units 2 and 3:
- 4.1 testing edge cases ← 2.5 boundary tests and 2.9 asserts; decomposition ← 2.8 functions
- 4.2 step counting ← 2.7 nested-loop work; hidden loops ← 3.1 `in` and 3.2 slices; set/dict fixes ← 3.6, 3.7
- 4.3 halving ← 2.9 divide-and-conquer debugging and 3.2 linear search; `low`/`high` ← 3.2 two pointers
- 4.4 swaps ← 2.2 multiple assignment; in-place vs new ← 3.4; stability and key functions ← 3.5
- 4.5 call stack and frames ← 2.8 and 2.9 tracebacks; memoisation with a dictionary ← 3.6
- 4.6 nested lists ← 3.4; `isinstance` introduced as a small new tool
- 4.7 merging ← 3.2 two pointers; n log n ← 4.2 logarithms
- 4.8 brute force subsets ← 4.6; scheduling key functions ← 3.5; distance grids ← 3.4; `itertools.permutations` introduced as the library version of 4.6's arrangements

Deliberate forward references in Unit 4: dynamic programming, proofs of greedy correctness, Dijkstra and Huffman (Unit 8); the travelling salesperson problem's significance (Unit 15); a formal treatment of Big O (Units 6 and 8).

**Unit 5** builds on Units 2 to 4:
- 5.1 motivation ← the tuple records of 3.5 and the Unit 4 project (`book[2]`); references ← 3.4
- 5.2 raising exceptions ← 2.9; the mutable default trap ← 2.8 defaults and 3.4 shared references; chained comparisons ← 2.5
- 5.3 `__lt__` and sorting ← 3.5 key functions, 4.4 consistent comparisons; hashability ← 3.6; exact fractions ← 2.3 float imprecision
- 5.4 dates and leap years ← 4.1; computed properties and O(n) cost ← 4.2
- 5.5 delegation ← 5.3; atomic two-sided updates ← 5.2 transfer
- 5.6 template methods ← 5.5; payroll counting ← 3.6
- 5.7 duck typing ← `print(file=...)` and files 3.9; expression trees ← 4.6 recursion and 1.6 syntax trees; Heron's formula, Euclid's gcd as given helpers
- 5.8 `Counter`/`defaultdict` replace the 3.6 patterns; `itertools` ← 4.8; frozen dataclasses fix the 5.3 hashability problem
- 5.9 refactoring with tests ← 2.9 asserts; injected randomness makes 4.x-style testing possible for games

Deliberate forward references in Unit 5: local modules, packages and `pip` (Unit 14, since the browser runs one file); UML (Unit 14); finite state machines (Unit 15); `deque` (Unit 7); `__rmul__` and other reflected operators mentioned only.

**Unit 6** builds on Units 1 to 5:
- 6.1 connectives and truth tables ← 1.3 gates and 2.5 `and`/`or`/`not`; enumerating rows ← 4.8 brute force and 5.8 `itertools.product`
- 6.2 ∀/∃ ← 3.8 `all`/`any`; nested quantifiers ← 2.7 nested loops
- 6.3 sets ← 3.7; relations as sets of tuples ← 3.5; frozensets for hashable sets ← 3.6 hashability; transitive closure ← 4.x iteration until nothing changes
- 6.4 loop invariants ← 4.3 binary search and 4.4 sorts; parity and primes ← 2.2 `%`
- 6.5 induction ← 4.5/4.6 recursion; recurrences ← 4.7 merge sort; tree induction ← 4.6 recursive data
- 6.6 2ⁿ, n! and pairs ← 1.1, 4.8 and 4.2; Pascal recursion ← 4.6 subsets; inclusion-exclusion uses 6.3 subsets
- 6.7 counting probabilities ← 6.6; exact `Fraction` ← 2.3 float imprecision and 5.3; seeded randomness ← 5.9 injected randomness
- 6.8 `//`, `%` ← 2.2; Luhn ← the 4.1 Luhn exercise (now explained as modular arithmetic, plus check-digit generation); square-and-multiply ← 1.1 binary and 4.3 halving; extended Euclid ← 6.5 induction
- 6.9 adjacency lists ← 3.6 dictionaries and 3.7 sets; matrices ← 3.4 nested lists and the `[[0]*n]*n` trap; explicit stack instead of recursion ← 4.5 RecursionError; handshake lemma ← 6.6 counting twice; tree edge count ← 6.5 induction
- Project uses 3.9 CSV reading, 6.3 intersections, 6.6 `math.comb`, 6.7 probability and 6.9 components

Deliberate forward references in Unit 6: BFS/DFS by name, shortest paths and union-find (Units 7 and 8); hash tables and the birthday bound (Unit 7); average-case quicksort (Units 7 and 8); Euler's theorem and real cryptography (Unit 16); SAT and NP (Unit 15); Bayesian spam filtering and ML probability (Unit 17).

**Unit 7** builds on Units 1 to 6:
- 7.1 contiguous memory ← 1.5; amortised sums ← 6.5 induction; `__getitem__`/generators ← 5.3
- 7.2 call stack ← 2.8; stack machines and bytecode ← 1.6; explicit stack ← 6.9 reachability; `operator` module new
- 7.3 circular indexes ← 6.8 modular arithmetic; simulation ← 6.7; `deque` promised in 5.8
- 7.4 references and `is` ← 3.4; cache locality ← 1.5; Floyd proof ← 6.4 proof style
- 7.5 hashability ← 3.6, 5.3; pigeonhole ← 6.6; birthday bound ← 6.7; `% m` ← 6.8; LRU ← 7.4 doubly linked list
- 7.6 trees ← 6.9 (n − 1 edges); recursion ← 4.5–4.6; structural induction ← 6.5; expression trees ← 5.7, postfix ← 7.2
- 7.7 binary search ← 4.3; inorder ← 7.6; validating with bounds ← 6.4 invariants
- 7.8 complete trees ← 7.6; tuple comparison ← 3.5; `itertools.count` ← 5.8
- 7.9 graph vocabulary, adjacency dict of sets, reachability ← 6.9; queue ← 7.3; level order ← 7.6; stack ← 7.2; heap ← 7.8; hashable tuples as keys ← 3.5
- Project combines 7.5 (chaining, resizing), 7.8 (lazy deletion), 7.2 (undo stack), 7.3 (`deque(maxlen)`); `ast` check that the map uses no dict/set

Deliberate forward references in Unit 7: self-balancing trees (AVL, red-black) by name only (Unit 8 may revisit); Dijkstra, DFS-based topological sort and minimum spanning trees (Unit 8); tries and B-trees (Units 8 and 12).

**Unit 7 can assume:** all of Units 1 to 6, including classes and dataclasses (5), recursion (4.5 to 4.7), Big-O-style step counting (4.2), induction for proving properties of trees and heaps (6.5), modular arithmetic and the pigeonhole principle for hashing (6.6, 6.8), probability for expected collision counts (6.7), and graph vocabulary, adjacency lists and reachability (6.9). Unit 7 should implement stacks, queues (`deque`), linked lists, hash tables (chaining and open addressing), binary search trees, heaps and priority queues, and graph classes with proper BFS (distances) and DFS, each analysed with Big O.

**Unit 8 can assume:** all of Units 1 to 7, including every classic data structure implemented and analysed informally (dynamic arrays and amortised cost, stacks, queues, deques, linked lists, hash tables, BSTs, heaps and `heapq`, graph classes), BFS for unweighted shortest paths, DFS, cycle detection with three colours, and Kahn's topological sort. Unit 8 should formalise Big-O/Θ/Ω, solve recurrences, and build on these structures for divide and conquer, greedy algorithms (with heaps), dynamic programming, Dijkstra (BFS + priority queue), minimum spanning trees (union-find is new) and DFS-based topological sort.

**Unit 9 can assume:** all of Units 1 to 8, including formal asymptotic notation and recurrences, divide and conquer, greedy proofs, dynamic programming (memoisation and tabulation), Dijkstra/Bellman-Ford/Floyd-Warshall, minimum spanning trees and union-find, and pseudo-polynomial time (a first hint of NP-completeness for Unit 15).

Deliberate forward references in Unit 8: NP-completeness of 0/1 knapsack and subset sum (Unit 15); A* search (Unit 17); max-flow and string algorithms such as KMP (not planned); amortised analysis of union-find beyond a mention of the inverse Ackermann function.

**Unit 10 can assume:** all of Units 1 to 9, including C (pointers, structs, malloc/free, bit operations, stack frames and calling conventions), how programs are compiled and linked, assembly basics and the fetch-decode-execute cycle, and a working bytecode VM (the Mini CPU project). Unit 10 (Python again) should explain processes, scheduling, virtual memory, files and concurrency, and can simulate these with Python code.

**Unit 11 can assume:** all of Units 1 to 10, including processes, threads and system calls, file descriptors and pipes, scheduling and queues, synchronisation and deadlock, virtual memory, and file systems. Unit 11 (Python) should simulate protocols and networks with plain classes and deterministic code, since browsers cannot open raw sockets.

## Unit 11: Networking ✅

Python again. Browsers cannot open raw sockets, so every protocol is **simulated** with plain functions, byte strings and `struct`, plus the standard library modules that do work in Pyodide (`ipaddress`, `urllib.parse`, `hashlib`, `hmac`, `json`). A simulated `Network` with listen/connect/accept/send/recv teaches the real socket API; real-socket code is shown with `runnable: false`.

| Lesson | Id | Teaches |
|---|---|---|
| 11.1 How the Internet Is Layered | `u11-layers` | packet switching, the four layers, encapsulation, `struct` headers, internet checksum, latency vs bandwidth, store-and-forward |
| 11.2 IP Addresses and Subnets | `u11-ip` | IPv4 as 32-bit integers, CIDR, masks, network/broadcast, private ranges, NAT, DHCP, ARP, longest-prefix match, IPv6 |
| 11.3 Routing: Finding the Way | `u11-routing` | forwarding vs routing, link-state (Dijkstra), distance-vector (Bellman-Ford), counting to infinity, TTL, BGP path choice |
| 11.4 Ports, UDP and TCP | `u11-transport` | ports and the 4-tuple, UDP datagrams, TCP segments, flags, handshake, sequence/ack numbers, reassembly, state machine |
| 11.5 Reliability, Flow and Congestion Control | `u11-reliability` | stop-and-wait, BDP, go-back-N vs selective repeat, fast retransmit, RTT/RTO estimation, rwnd, slow start, AIMD, Tahoe/Reno |
| 11.6 DNS | `u11-dns` | hierarchy, iterative resolution, CNAME, TTL caching, negative caching, record types, wire format and name compression, security |
| 11.7 HTTP and the Web | `u11-http` | URLs and percent-encoding, HTTP/1.1 messages, methods, status codes, cookies, caching/ETag, REST/JSON, HTTP/2 and 3 |
| 11.8 Sockets, Clients and Servers | `u11-sockets` | socket lifecycle, byte streams and framing, concurrency models, chat protocol, retry/backoff, token bucket |
| 11.9 Network Security and TLS | `u11-network-security` | attacks per layer, hashes/HMAC/signatures, Diffie-Hellman, TLS handshake, certificate chains, firewalls, port-scan detection |
| Project | | Mini Network Toolkit: subnets, longest-prefix forwarding, TTL DNS cache with NXDOMAIN caching, TCP stream reassembly with wraparound, URL parsing |

137 glossary terms (duplicates of earlier terms such as "Frame" and "Idempotent" are not repeated).

**Gotchas:** an exercise or project function cannot be named `run` (the harness uses that name), so Lesson 11.4 uses `simulate`. Block-scalar example output must not begin with spaces (left-align the first column of printed tables) or YAML parsing breaks. Quote any title, heading or question containing `: `.

**Unit 12 can assume:** all of Units 1 to 11, including networking (layers, IP, TCP, DNS, HTTP, sockets, TLS), and the Python used so far (classes, generators, `struct`, `json`, `hashlib`). Unit 12 (Databases) needs SQL in the browser: add sql.js (SQLite compiled to WebAssembly) as a new language runner, like Pyodide and PicoC, with `language: sql` units, a result-table view and SQL test code that compares result sets. Verify with a new `scripts/verify_sql.mjs` and add it to `npm run verify`.

## Unit 12: Databases ✅

Language: SQL (SQLite compiled to WebAssembly by sql.js, running in a worker). Every lesson shares a small university database (department, student, course, enrollment) given as the lesson `prelude`; Lessons 12.7 to 12.9 use their own preludes.

| Lesson | Id | Teaches |
|---|---|---|
| 12.1 Tables, Keys and Your First Queries | `u12-relational` | DBMS vs files, relational model, primary/foreign keys, SELECT/WHERE/ORDER BY/LIMIT/DISTINCT, NULL and three-valued logic |
| 12.2 Filtering, Expressions and CASE | `u12-filtering` | LIKE/IN/BETWEEN, AND/OR precedence, functions, integer division, CASE, ISO dates |
| 12.3 Joining Tables | `u12-joins` | inner/left/cross joins, aliases, link tables, self joins, anti-joins, ON vs WHERE |
| 12.4 Aggregation and Grouping | `u12-aggregation` | COUNT/SUM/AVG, GROUP BY, HAVING, evaluation order, double counting, window functions |
| 12.5 Subqueries, CTEs and Set Operations | `u12-subqueries` | scalar/list/table subqueries, correlated, EXISTS, WITH, recursive CTEs, UNION/INTERSECT/EXCEPT |
| 12.6 Changing Data and Defining Tables | `u12-modifying` | INSERT/UPDATE/DELETE, CREATE TABLE, constraints, foreign keys, ALTER, views |
| 12.7 Database Design and Normalization | `u12-design` | ER modelling, anomalies, functional dependencies, 1NF-3NF, lossless splits, denormalisation |
| 12.8 Transactions and ACID | `u12-transactions` | BEGIN/COMMIT/ROLLBACK/SAVEPOINT, ACID, concurrency anomalies, lost updates, locks/MVCC, write-ahead log |
| 12.9 Indexes, Query Plans and Safe SQL | `u12-indexes` | B-trees, EXPLAIN QUERY PLAN, composite and covering indexes, SQL injection and parameters |
| Project | | Campus Registrar Database: normalised tables with constraints, cleaned load, view, index, transactional withdrawal, ranked report |

111 glossary terms (duplicates such as "Join" and "Index" are not repeated).

**SQL runner (new in Phase 11):** `language: sql`. `src/lib/sqlEngine.js` (sql.js with the wasm inlined, so it works offline and in Node) runs the lesson/exercise `prelude` in a fresh in-memory database, then the learner's SQL; the output is the text table of the **last** statement that returns rows (EXPLAIN QUERY PLAN shows only its plan column). Test code is JavaScript with `output, error, columns, rows, source`, plus `query(sql)` (reads the learner's finished database), `expectRows(rows, ordered=true)` and `expectColumns(names)`. Examples that must fail use `expectError: true` and an `error:` line (shown in the lesson and checked). `scripts/verify_sql.mjs` (part of `npm run verify`) and `scripts/autofill_sql.mjs` mirror the C versions. Gotchas: remove any `output: |` block from an `expectError` example before autofill; SQLite returns ROUND results as REAL and integer division truncates; `PRAGMA foreign_keys = ON` is needed per run.

**Unit 13 can assume:** everything through Unit 12, including HTTP/URLs/REST (Unit 11) and SQL/SQL injection (Unit 12).

## Unit 13: Web Development ✅

Languages: HTML/CSS/JS in a sandboxed iframe (`language: html`, lessons 13.1-13.4, 13.7 and the project) and plain JavaScript in a worker (`language: javascript`, lessons 13.5, 13.6, 13.8, 13.9). The unit language is `html`; JavaScript lessons set `language: javascript` themselves.

| Lesson | Id | Teaches |
|---|---|---|
| 13.1 How the Web Works and HTML | `u13-html` | page load recap, elements/attributes, document skeleton, text, lists, links, images, escaping |
| 13.2 Semantic HTML, Forms and Accessibility | `u13-html-forms` | landmarks, tables, form controls, labels, validation, a11y basics |
| 13.3 CSS: Selectors, the Cascade and the Box Model | `u13-css` | selectors, specificity, inheritance, units, colour, box model, custom properties |
| 13.4 CSS Layout | `u13-layout` | normal flow, flexbox, grid, positioning, responsive design, media queries |
| 13.5 JavaScript: The Language | `u13-js-language` | const/let, equality and truthiness, functions, closures, arrays/objects, classes, errors |
| 13.6 Asynchronous JavaScript, JSON and fetch | `u13-async` | event loop, promises, async/await, fetch, JSON |
| 13.7 The DOM and Events | `u13-dom` | selecting, changing, creating elements, events, delegation, state + render |
| 13.8 Components, State and Front-end Frameworks | `u13-frameworks` | virtual nodes, components, reducers/stores, diffing (built from scratch) |
| 13.9 Back-end Servers, REST APIs and Web Security | `u13-backend` | routing, REST, middleware, validation, auth, XSS/CSRF/CORS |
| Project | | Task Manager Page: a complete HTML/CSS/JS page checked by 12 behaviour tests |

79 glossary terms (duplicates such as "Element" and "JSON" are not repeated).

**HTML runner (new in Phase 12):** `src/lib/htmlEngine.js` builds the learner's page into a sandboxed `iframe` (`allow-scripts`, no same-origin) with a harness that captures `console`, errors, and runs test bodies. Test code is async JavaScript with `$`, `$$`, `css(el, prop)` (computed style), `fire`, `click`, `wait`, `assert`, `output`, `source`, `errors`; each test gets a fresh page. Inline-script loops get a counter so a runaway loop throws instead of freezing the app. The editor shows a live preview. `scripts/verify_html.mjs` runs everything in real Chromium via Playwright. **JavaScript runner upgrades:** `src/lib/jsEngine.js` runs code in an async function (top-level `await`), timers use a virtual clock and run in time order, and `fetch` talks to a pretend in-memory API (`/api/users`, `/api/users/:id`, `/api/slow`, `/api/fail`); `scripts/verify_js.mjs` checks all JavaScript items with the same engine. Gotchas: html examples have `output` only for console lines; a project/lesson `language` field overrides the unit.

**Unit 14 can assume:** everything through Unit 13 (JavaScript and Python, SQL, HTTP, the web stack).

## Plan for remaining units (to refine before each phase)

- **14 Software Engineering**, **15 Theory of Computation**, **16 Security**, **17 AI & ML**, **18 Capstones**.

## Technical notes for later phases

- The JavaScript runner (`src/workers/js.worker.js`) is already wired up for Unit 13; SQL runs through sql.js (see Unit 12). C runs through PicoC (see Unit 9).
- Lessons and projects now load on demand (Phase 6): the main bundle holds only a generated index (`virtual:content-index` in `vite.config.js`: titles, exercise ids, quiz MCQs for the review deck), and each full lesson/project is its own small chunk loaded by `useLesson`/`useProject` in `src/lib/content.js`. Main bundle: about 1.1 MB. When publishing, send every chunk in `dist/assets` (and null any that disappeared).

## Phase log

- **Phase 1 (2026-10-24):** app framework (dashboard, lesson viewer, CodeMirror editor, Pyodide runner in a Web Worker with time limits, exercises with tests/hints/locked solutions, quizzes with 80% mastery gating, spaced-repetition review, searchable glossary, unit projects with checklists, settings with backup/restore, light/dark/auto themes, mobile layout) plus complete Units 1 and 2. Content verifier scripts added.
- **Phase 2 (2026-10-25):** complete Unit 3 (9 lessons, 43 exercises, 9 quizzes, Gradebook Analyser project, 67 glossary terms). Lessons can now create sample files in their prelude; the verifier runs in a temp folder. Fixed hosting of the Python standard library (shipped as base64 text) so Python runs on hosts that refuse .zip files.
- **Phase 3 (2026-10-25):** complete Unit 4 (8 lessons, 40 exercises, 8 quizzes, Library Catalogue project, 47 glossary terms). The Python test harness gained `uses_loop()` (checks for loops with the `ast` module, so recursion-only exercises can be enforced); exercises whose starter code is deliberately slow can set `slowStarter: true`; the verifier puts a time limit on starter code.
- **Phase 4 (2026-10-25):** complete Unit 5 (9 lessons, 43 exercises, 9 quizzes, Corner Shop project, 66 glossary terms). No framework changes were needed; dataclasses, `abc` and `collections` run in the test harness as-is. Exercise tests now use `ast` on `source` (not `inspect.getsource`, which can't see code run from a string) when they need to inspect one function's body.
- **Phase 5 (2026-10-25):** complete Unit 6 (9 lessons, 45 exercises, 9 quizzes, Social Network Analyser project, 85 glossary terms). No framework changes were needed; `fractions`, `itertools` and `math.comb`/`lcm` work in the harness and Pyodide.
- **Phase 6 (2026-10-25):** complete Unit 7 (9 lessons, 45 exercises, 9 quizzes, Help Desk project, 41 glossary terms). Lessons and projects now load on demand (main bundle 2.4 MB → 1.1 MB). Fixed a 4.2 test that newer Python versions passed by accident (now times the function instead).
- **Phase 7 (2026-11-07):** complete Unit 8 (9 lessons, 41 exercises, 9 quizzes, Route Planner project, 47 glossary terms). App features added since Phase 6: installable PWA (manifest, generated service worker, update banner), GitHub Pages deploy, Windows/Mac desktop builds (Electron, `desktop/`), an Ask Claude button on every lesson, and a Listen button with natural recorded voice (Kokoro `am_michael`, generated by the "Record lesson voice" workflow into the `audio` branch; clips are named by a hash of the paragraph text, with the browser voice as a fallback). The verifier now also checks that `outcomes` and `summary` entries are plain strings (quote any text containing a colon and a space). Project test code can't define a function called `run` (the test harness has its own).
- **Phase 8 (2026-11-07):** complete Unit 9 (9 lessons, 37 exercises, 9 quizzes, Mini CPU project, 58 glossary terms). New framework features: in-browser C (PicoC WebAssembly in a worker, C tag and syntax highlighting in the editor, `language: c` units and projects with JavaScript test code over the program output), and `scripts/verify_c.mjs` added to `npm run verify`. The Input button is hidden for C.
- **Phase 9 (2026-11-07):** complete Unit 10 (9 lessons, 41 exercises, 9 quizzes, Mini Kernel project, 111 glossary terms). OS concepts are simulated in Python; `scripts/autofill_py.py` added.
- **Phase 10 (2026-11-07):** complete Unit 11 (9 lessons, 44 exercises, 9 quizzes, Mini Network Toolkit project, 137 glossary terms). Networking simulated in Python.
- **Phase 11 (2026-11-07):** complete Unit 12 (9 lessons, 41 exercises, 9 quizzes, Campus Registrar Database project, 111 glossary terms). New framework feature: in-browser SQL (sql.js/SQLite in a worker, SQL tag and editor highlighting, `language: sql` units, `verify_sql.mjs`, `autofill_sql.mjs`, error-example display).
- **Phase 12 (2026-11-07):** complete Unit 13 (9 lessons, 41 exercises, 9 quizzes, Task Manager Page project, 79 glossary terms). New framework features: in-browser HTML/CSS/JS runner with live preview and DOM tests (`verify_html.mjs`), async JavaScript engine with virtual timers and a pretend fetch API (`verify_js.mjs`).
