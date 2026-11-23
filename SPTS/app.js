/**
 * SPTS Backend - Server-side Logic (app.js)
 * Student Performance Tracker System v1.0
 * 
 * This file contains all business logic, authentication,
 * data management, and API simulation for the SPTS.
 */

// ==================== DATA LAYER ====================
class SPTSDatabase {
    constructor() {
        this.loadData();
    }

    loadData() {
        const saved = localStorage.getItem('spts_data');
        if (saved) {
            this.data = JSON.parse(saved);
        } else {
            this.data = null;
        }
    }

    async initFromJSON() {
        const defaults = this.getDefaultData();
        let loadedData = null;
        try {
            // First try to fetch from server or relative file
            const response = await fetch('data.json?t=' + Date.now());
            if (response.ok) {
                loadedData = await response.json();
            }
        } catch (e) {
            console.warn('Network fetch of data.json failed, using localStorage or defaults:', e);
        }

        if (!loadedData) {
            loadedData = this.data || defaults;
        }

        this.mergeDefaults(loadedData, defaults);
        localStorage.setItem('spts_data', JSON.stringify(this.data));
        return true;
    }

    mergeDefaults(primary, fallback) {
        this.data = primary || fallback;
        if (!this.data) this.data = fallback;

        // Ensure all required top-level collections exist
        ['users', 'subjects', 'marks', 'attendance', 'teachers', 'courses', 'questions', 'assignments'].forEach(key => {
            if (!this.data[key]) {
                this.data[key] = fallback[key] || [];
            }
        });

        // Ensure every student has attendance & marks records
        const students = Object.values(this.data.users || {}).filter(u => u.role === 'student');
        students.forEach(s => {
            if (!this.data.attendance[s.id] || Object.keys(this.data.attendance[s.id]).length === 0) {
                if (fallback.attendance && fallback.attendance[s.id]) {
                    this.data.attendance[s.id] = JSON.parse(JSON.stringify(fallback.attendance[s.id]));
                } else {
                    this.data.attendance[s.id] = {
                        "CS301": {"present": 38, "total": 45, "percentage": 84.4},
                        "CS302": {"present": 40, "total": 45, "percentage": 88.9},
                        "CS303": {"present": 35, "total": 42, "percentage": 83.3},
                        "CS304": {"present": 37, "total": 42, "percentage": 88.1},
                        "CS305": {"present": 42, "total": 45, "percentage": 93.3}
                    };
                }
            }
            if (!this.data.marks[s.id] || Object.keys(this.data.marks[s.id]).length === 0) {
                if (fallback.marks && fallback.marks[s.id]) {
                    this.data.marks[s.id] = JSON.parse(JSON.stringify(fallback.marks[s.id]));
                } else {
                    this.data.marks[s.id] = {
                        "CS301": {"mst1": 38, "mst2": 40, "internal": 22, "endsem": 55, "total": 100},
                        "CS302": {"mst1": 35, "mst2": 37, "internal": 20, "endsem": 50, "total": 100},
                        "CS303": {"mst1": 42, "mst2": 44, "internal": 24, "endsem": 60, "total": 100},
                        "CS304": {"mst1": 30, "mst2": 33, "internal": 18, "endsem": 45, "total": 100},
                        "CS305": {"mst1": 36, "mst2": 39, "internal": 21, "endsem": 52, "total": 100}
                    };
                }
            }
        });

        // Ensure questions & assignments are populated
        if (!this.data.questions || this.data.questions.length === 0) {
            this.data.questions = fallback.questions || [];
        }
        if (!this.data.assignments || this.data.assignments.length === 0) {
            this.data.assignments = fallback.assignments || [];
        }
    }

    getDefaultData() {
        return {
            "users": {
                "Divyanshi_B": {
                    "id": "Divyanshi_B",
                    "name": "Divyanshi Bhawsar",
                    "email": "divyanshi.bhawsar@spts.edu",
                    "password": "admin123",
                    "role": "admin",
                    "profilePic": ""
                },
                "Divyanshi_G": {
                    "id": "Divyanshi_G",
                    "name": "Divyanshi Gaur",
                    "email": "divyanshi.gaur@spts.edu",
                    "password": "teacher123",
                    "role": "teacher",
                    "profilePic": "",
                    "department": "CSE",
                    "subjects": ["Data Structures", "Operating Systems"],
                    "classesAssigned": 120,
                    "classesPresent": 110,
                    "classesSkipped": 10,
                    "feedback": [
                        {"from": "Dhruv Chadha", "rating": 5, "comment": "Excellent teaching methodology"},
                        {"from": "Divyansh Carpenter", "rating": 4, "comment": "Very helpful and clear explanations"},
                        {"from": "Divyansh Deore", "rating": 5, "comment": "Best teacher in the department"},
                        {"from": "Dhruv Nigam", "rating": 4, "comment": "Great engagement in class"}
                    ]
                },
                "Dhruv_C": {
                    "id": "Dhruv_C",
                    "name": "Dhruv Chadha",
                    "email": "dhruv.chadha@spts.edu",
                    "password": "student123",
                    "role": "student",
                    "profilePic": "",
                    "rollNo": "CSE2024001",
                    "programme": "B.Tech",
                    "branch": "CSE",
                    "semester": 3,
                    "year": 2
                },
                "Divyansh_C": {
                    "id": "Divyansh_C",
                    "name": "Divyansh Carpenter",
                    "email": "divyansh.carpenter@spts.edu",
                    "password": "student123",
                    "role": "student",
                    "profilePic": "",
                    "rollNo": "CSE2024002",
                    "programme": "B.Tech",
                    "branch": "CSE",
                    "semester": 3,
                    "year": 2
                },
                "Divyansh_D": {
                    "id": "Divyansh_D",
                    "name": "Divyansh Deore",
                    "email": "divyansh.deore@spts.edu",
                    "password": "student123",
                    "role": "student",
                    "profilePic": "",
                    "rollNo": "CSE2024003",
                    "programme": "B.Tech",
                    "branch": "CSE",
                    "semester": 3,
                    "year": 2
                },
                "Dhruv_N": {
                    "id": "Dhruv_N",
                    "name": "Dhruv Nigam",
                    "email": "dhruv.nigam@spts.edu",
                    "password": "student123",
                    "role": "student",
                    "profilePic": "",
                    "rollNo": "CSE2024004",
                    "programme": "B.Tech",
                    "branch": "CSE",
                    "semester": 3,
                    "year": 2
                }
            },
            "subjects": [
                {"code": "CS301", "name": "Data Structures", "credits": 4, "teacher": "Divyanshi_G"},
                {"code": "CS302", "name": "Operating Systems", "credits": 4, "teacher": "Divyanshi_G"},
                {"code": "CS303", "name": "Database Management Systems", "credits": 3, "teacher": "Divyanshi_G"},
                {"code": "CS304", "name": "Computer Networks", "credits": 3, "teacher": "Divyanshi_G"},
                {"code": "CS305", "name": "Mathematics III", "credits": 4, "teacher": "Divyanshi_G"}
            ],
            "marks": {
                "Dhruv_C": {
                    "CS301": {"mst1": 38, "mst2": 40, "internal": 22, "endsem": 55, "total": 100},
                    "CS302": {"mst1": 35, "mst2": 37, "internal": 20, "endsem": 50, "total": 100},
                    "CS303": {"mst1": 42, "mst2": 44, "internal": 24, "endsem": 60, "total": 100},
                    "CS304": {"mst1": 30, "mst2": 33, "internal": 18, "endsem": 45, "total": 100},
                    "CS305": {"mst1": 36, "mst2": 39, "internal": 21, "endsem": 52, "total": 100}
                },
                "Divyansh_C": {
                    "CS301": {"mst1": 40, "mst2": 42, "internal": 23, "endsem": 58, "total": 100},
                    "CS302": {"mst1": 33, "mst2": 36, "internal": 19, "endsem": 48, "total": 100},
                    "CS303": {"mst1": 44, "mst2": 45, "internal": 25, "endsem": 62, "total": 100},
                    "CS304": {"mst1": 28, "mst2": 31, "internal": 17, "endsem": 42, "total": 100},
                    "CS305": {"mst1": 37, "mst2": 40, "internal": 22, "endsem": 54, "total": 100}
                },
                "Divyansh_D": {
                    "CS301": {"mst1": 45, "mst2": 44, "internal": 25, "endsem": 65, "total": 100},
                    "CS302": {"mst1": 40, "mst2": 42, "internal": 23, "endsem": 58, "total": 100},
                    "CS303": {"mst1": 38, "mst2": 40, "internal": 22, "endsem": 55, "total": 100},
                    "CS304": {"mst1": 35, "mst2": 37, "internal": 20, "endsem": 50, "total": 100},
                    "CS305": {"mst1": 42, "mst2": 43, "internal": 24, "endsem": 60, "total": 100}
                },
                "Dhruv_N": {
                    "CS301": {"mst1": 32, "mst2": 35, "internal": 19, "endsem": 47, "total": 100},
                    "CS302": {"mst1": 28, "mst2": 30, "internal": 16, "endsem": 40, "total": 100},
                    "CS303": {"mst1": 36, "mst2": 38, "internal": 21, "endsem": 53, "total": 100},
                    "CS304": {"mst1": 25, "mst2": 28, "internal": 15, "endsem": 38, "total": 100},
                    "CS305": {"mst1": 30, "mst2": 33, "internal": 18, "endsem": 45, "total": 100}
                }
            },
            "attendance": {
                "Dhruv_C": {
                    "CS301": {"present": 38, "total": 45, "percentage": 84.4},
                    "CS302": {"present": 40, "total": 45, "percentage": 88.9},
                    "CS303": {"present": 35, "total": 42, "percentage": 83.3},
                    "CS304": {"present": 37, "total": 42, "percentage": 88.1},
                    "CS305": {"present": 42, "total": 45, "percentage": 93.3}
                },
                "Divyansh_C": {
                    "CS301": {"present": 36, "total": 45, "percentage": 80.0},
                    "CS302": {"present": 38, "total": 45, "percentage": 84.4},
                    "CS303": {"present": 33, "total": 42, "percentage": 78.6},
                    "CS304": {"present": 35, "total": 42, "percentage": 83.3},
                    "CS305": {"present": 40, "total": 45, "percentage": 88.9}
                },
                "Divyansh_D": {
                    "CS301": {"present": 42, "total": 45, "percentage": 93.3},
                    "CS302": {"present": 43, "total": 45, "percentage": 95.6},
                    "CS303": {"present": 40, "total": 42, "percentage": 95.2},
                    "CS304": {"present": 39, "total": 42, "percentage": 92.9},
                    "CS305": {"present": 44, "total": 45, "percentage": 97.8}
                },
                "Dhruv_N": {
                    "CS301": {"present": 30, "total": 45, "percentage": 66.7},
                    "CS302": {"present": 32, "total": 45, "percentage": 71.1},
                    "CS303": {"present": 28, "total": 42, "percentage": 66.7},
                    "CS304": {"present": 30, "total": 42, "percentage": 71.4},
                    "CS305": {"present": 35, "total": 45, "percentage": 77.8}
                }
            },
            "teachers": [
                {
                    "id": "Divyanshi_G",
                    "name": "Divyanshi Gaur",
                    "department": "CSE",
                    "subjects": ["Data Structures", "Operating Systems"],
                    "classesAssigned": 120,
                    "classesPresent": 110,
                    "classesSkipped": 10,
                    "holidays": 10,
                    "avgFeedbackRating": 4.5
                },
                {
                    "id": "Garvita_123",
                    "name": "Garvita Khera",
                    "department": "CSE",
                    "subjects": ["Database Management Systems", "Computer Networks"],
                    "classesAssigned": 45,
                    "classesPresent": 43,
                    "classesSkipped": 2,
                    "holidays": 2,
                    "avgFeedbackRating": 4.8
                }
            ],
            "courses": [
                {"name": "B.Tech", "branches": ["CSE"], "semesters": 8}
            ],
            "questions": [
                {
                                "id": 1,
                                "subject": "CS301",
                                "exam": "mst1",
                                "question": "What is the primary characteristic of an Abstract Data Type (ADT)?",
                                "optionA": "It specifies data implementation details",
                                "optionB": "It specifies operations without implementation details",
                                "optionC": "It is always stored in non-volatile memory",
                                "optionD": "It can only store primitive data types",
                                "answer": "B"
                },
                {
                                "id": 2,
                                "subject": "CS301",
                                "exam": "mst1",
                                "question": "Which data structure is most appropriate for evaluating postfix arithmetic expressions?",
                                "optionA": "Queue",
                                "optionB": "Stack",
                                "optionC": "Binary Search Tree",
                                "optionD": "Hash Table",
                                "answer": "B"
                },
                {
                                "id": 3,
                                "subject": "CS301",
                                "exam": "mst1",
                                "question": "What is the worst-case time complexity of searching an element in a balanced Binary Search Tree?",
                                "optionA": "O(1)",
                                "optionB": "O(log n)",
                                "optionC": "O(n)",
                                "optionD": "O(n log n)",
                                "answer": "B"
                },
                {
                                "id": 4,
                                "subject": "CS301",
                                "exam": "mst2",
                                "question": "Which data structure follows the First-In-First-Out (FIFO) access order?",
                                "optionA": "Stack",
                                "optionB": "Queue",
                                "optionC": "Tree",
                                "optionD": "Graph",
                                "answer": "B"
                },
                {
                                "id": 5,
                                "subject": "CS302",
                                "exam": "mst1",
                                "question": "Which of the following is NOT an operating system kernel responsibility?",
                                "optionA": "Process Scheduling",
                                "optionB": "Memory Management",
                                "optionC": "Source Code Compilation",
                                "optionD": "Interrupt Handling",
                                "answer": "C"
                },
                {
                                "id": 6,
                                "subject": "CS301",
                                "exam": "mst2",
                                "question": "What is the worst-case time complexity of QuickSort?",
                                "optionA": "O(n)",
                                "optionB": "O(n log n)",
                                "optionC": "O(n^2)",
                                "optionD": "O(log n)",
                                "answer": "C"
                },
                {
                                "id": 7,
                                "subject": "CS301",
                                "exam": "internal",
                                "question": "Which graph traversal algorithm uses a Queue data structure?",
                                "optionA": "Depth First Search (DFS)",
                                "optionB": "Breadth First Search (BFS)",
                                "optionC": "Dijkstra's Algorithm",
                                "optionD": "Kruskal's Algorithm",
                                "answer": "B"
                },
                {
                                "id": 8,
                                "subject": "CS301",
                                "exam": "endsem",
                                "question": "In an AVL tree, the balance factor of any node must be strictly within which range?",
                                "optionA": "-1, 0, or 1",
                                "optionB": "-2, 0, or 2",
                                "optionC": "0 to height",
                                "optionD": "Always 0",
                                "answer": "A"
                },
                {
                                "id": 9,
                                "subject": "CS302",
                                "exam": "mst1",
                                "question": "Which CPU scheduling algorithm can cause indefinite blocking (starvation)?",
                                "optionA": "Round Robin",
                                "optionB": "First-Come First-Served",
                                "optionC": "Shortest Job First (non-preemptive)",
                                "optionD": "Priority Scheduling without aging",
                                "answer": "D"
                },
                {
                                "id": 10,
                                "subject": "CS302",
                                "exam": "mst2",
                                "question": "Which of the following conditions is NOT required for a deadlock to occur (Coffman conditions)?",
                                "optionA": "Mutual Exclusion",
                                "optionB": "Hold and Wait",
                                "optionC": "Preemption Allowed",
                                "optionD": "Circular Wait",
                                "answer": "C"
                },
                {
                                "id": 11,
                                "subject": "CS302",
                                "exam": "internal",
                                "question": "What term describes a state where an OS spends more time swapping pages than executing instructions?",
                                "optionA": "Deadlock",
                                "optionB": "Thrashing",
                                "optionC": "Fragmentation",
                                "optionD": "Starvation",
                                "answer": "B"
                },
                {
                                "id": 12,
                                "subject": "CS302",
                                "exam": "endsem",
                                "question": "The Banker's Algorithm in modern operating systems is primarily used for:",
                                "optionA": "Deadlock Avoidance",
                                "optionB": "Deadlock Detection and Recovery",
                                "optionC": "Virtual Memory Paging",
                                "optionD": "Disk Head Scheduling",
                                "answer": "A"
                },
                {
                                "id": 13,
                                "subject": "CS303",
                                "exam": "mst1",
                                "question": "A relation is in Second Normal Form (2NF) if it is in 1NF and contains no:",
                                "optionA": "Transitive Dependency",
                                "optionB": "Partial Functional Dependency",
                                "optionC": "Multi-valued Dependency",
                                "optionD": "Join Dependency",
                                "answer": "B"
                },
                {
                                "id": 14,
                                "subject": "CS303",
                                "exam": "mst2",
                                "question": "Which ACID property guarantees that all transactions complete entirely or not at all?",
                                "optionA": "Atomicity",
                                "optionB": "Consistency",
                                "optionC": "Isolation",
                                "optionD": "Durability",
                                "answer": "A"
                },
                {
                                "id": 15,
                                "subject": "CS303",
                                "exam": "internal",
                                "question": "Which SQL clause is strictly used to filter grouped rows resulting from a GROUP BY query?",
                                "optionA": "WHERE",
                                "optionB": "HAVING",
                                "optionC": "ORDER BY",
                                "optionD": "FILTER",
                                "answer": "B"
                },
                {
                                "id": 16,
                                "subject": "CS303",
                                "exam": "endsem",
                                "question": "Which index structure is standard in relational databases for efficient range queries and sequential access?",
                                "optionA": "B+ Tree",
                                "optionB": "Hash Map",
                                "optionC": "Red-Black Tree",
                                "optionD": "Trie",
                                "answer": "A"
                },
                {
                                "id": 17,
                                "subject": "CS304",
                                "exam": "mst1",
                                "question": "In the OSI reference model, which layer provides end-to-end reliability and flow control?",
                                "optionA": "Network Layer",
                                "optionB": "Transport Layer",
                                "optionC": "Session Layer",
                                "optionD": "Data Link Layer",
                                "answer": "B"
                },
                {
                                "id": 18,
                                "subject": "CS304",
                                "exam": "mst2",
                                "question": "Which transport protocol is connectionless and does not guarantee message delivery or ordering?",
                                "optionA": "TCP",
                                "optionB": "UDP",
                                "optionC": "SCTP",
                                "optionD": "SSH",
                                "answer": "B"
                },
                {
                                "id": 19,
                                "subject": "CS304",
                                "exam": "internal",
                                "question": "What is the standard default subnet mask for an IPv4 Class C network?",
                                "optionA": "255.0.0.0",
                                "optionB": "255.255.0.0",
                                "optionC": "255.255.255.0",
                                "optionD": "255.255.255.255",
                                "answer": "C"
                },
                {
                                "id": 20,
                                "subject": "CS304",
                                "exam": "endsem",
                                "question": "Which interior routing protocol calculates optimal routing paths using Dijkstra's Shortest Path algorithm?",
                                "optionA": "Routing Information Protocol (RIP)",
                                "optionB": "Open Shortest Path First (OSPF)",
                                "optionC": "Border Gateway Protocol (BGP)",
                                "optionD": "Address Resolution Protocol (ARP)",
                                "answer": "B"
                },
                {
                                "id": 21,
                                "subject": "CS305",
                                "exam": "mst1",
                                "question": "What is the probability of rolling a sum of 7 when rolling two fair six-sided dice simultaneously?",
                                "optionA": "1/6",
                                "optionB": "1/12",
                                "optionC": "5/36",
                                "optionD": "7/36",
                                "answer": "A"
                },
                {
                                "id": 22,
                                "subject": "CS305",
                                "exam": "mst2",
                                "question": "According to the Handshaking Lemma for any undirected graph, the sum of vertex degrees is:",
                                "optionA": "Equal to the number of vertices",
                                "optionB": "Twice the number of edges",
                                "optionC": "Equal to chromatic number",
                                "optionD": "Always a prime number",
                                "answer": "B"
                },
                {
                                "id": 23,
                                "subject": "CS305",
                                "exam": "internal",
                                "question": "If a square matrix has a determinant equal to zero, the matrix is classified as:",
                                "optionA": "Orthogonal",
                                "optionB": "Singular (non-invertible)",
                                "optionC": "Identity Matrix",
                                "optionD": "Symmetric",
                                "answer": "B"
                },
                {
                                "id": 24,
                                "subject": "CS305",
                                "exam": "endsem",
                                "question": "The eigenvalues of any upper or lower triangular matrix are precisely:",
                                "optionA": "Zero everywhere",
                                "optionB": "Its main diagonal entries",
                                "optionC": "The determinants of each minor",
                                "optionD": "Complex conjugate pairs",
                                "answer": "B"
                }
],
            "assignments": [
                {
                                "id": 1,
                                "title": "Binary Search Tree & Balanced AVL Implementation",
                                "subject": "CS301",
                                "dueDate": "2026-11-28",
                                "maxMarks": 25,
                                "description": "Implement node insertion, deletion, and rotation routines for a self-balancing AVL Tree in C++ or Java with empirical balance-factor verification.",
                                "submissions": {
                                                "Dhruv_C": {
                                                                "studentName": "Dhruv Chadha",
                                                                "submittedAt": "11/14/2026, 3:20:15 PM",
                                                                "content": "Implemented complete AVL tree with left/right rotations and balance factor verification. GitHub: https://github.com/dhruv-chadha/avl-tree-cpp",
                                                                "marks": 24,
                                                                "status": "Submitted"
                                                },
                                                "Divyansh_C": {
                                                                "studentName": "Divyansh Carpenter",
                                                                "submittedAt": "11/13/2026, 5:10:45 PM",
                                                                "content": "Implemented BST and AVL trees with in-order traversal and height metrics in Java.",
                                                                "marks": 23,
                                                                "status": "Submitted"
                                                }
                                }
                },
                {
                                "id": 2,
                                "title": "Process Scheduling Algorithms Simulation",
                                "subject": "CS302",
                                "dueDate": "2026-12-02",
                                "maxMarks": 25,
                                "description": "Simulate Round Robin (time quantum = 4ms) and Preemptive Shortest Job First (SJF) in Python or C. Compute average turnaround and waiting times.",
                                "submissions": {
                                                "Divyansh_C": {
                                                                "studentName": "Divyansh Carpenter",
                                                                "submittedAt": "11/14/2026, 6:40:12 PM",
                                                                "content": "Simulated Round Robin and SJF with Gantt charts. Average turnaround time computed.",
                                                                "marks": 25,
                                                                "status": "Submitted"
                                                }
                                }
                },
                {
                                "id": 3,
                                "title": "Relational Schema Design & 3NF Normalization",
                                "subject": "CS303",
                                "dueDate": "2026-12-05",
                                "maxMarks": 25,
                                "description": "Construct an enterprise database schema for an E-Commerce portal. Normalize up to 3NF/BCNF, documenting functional dependencies and candidate keys.",
                                "submissions": {
                                                "Divyansh_C": {
                                                                "studentName": "Divyansh Carpenter",
                                                                "submittedAt": "11/14/2026, 8:15:00 PM",
                                                                "content": "Constructed 3NF and BCNF schema for hospital management with dependency diagrams.",
                                                                "marks": 24,
                                                                "status": "Submitted"
                                                }
                                }
                },
                {
                                "id": 4,
                                "title": "Multi-threaded TCP Socket Client-Server Chat",
                                "subject": "CS304",
                                "dueDate": "2026-12-08",
                                "maxMarks": 25,
                                "description": "Build a multi-client concurrent TCP socket chat server in Python or Java supporting broadcast broadcasting and client join/leave notifications.",
                                "submissions": {}
                },
                {
                                "id": 5,
                                "title": "Discrete Graph Theory & Shortest Path Proofs",
                                "subject": "CS305",
                                "dueDate": "2026-12-12",
                                "maxMarks": 25,
                                "description": "Prove the Handshaking Lemma for connected undirected graphs and solve single-source shortest paths on an 8-node weighted topology using Dijkstra.",
                                "submissions": {}
                }
]
        };
    }

    async save() {
        // Save to browser localStorage
        localStorage.setItem('spts_data', JSON.stringify(this.data));
        // Also persist to Java backend on disk if available
        try {
            await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.data, null, 2)
            });
        } catch (e) {
            // Standalone/offline mode fallback
        }
    }

    reset() {
        localStorage.removeItem('spts_data');
        this.data = null;
    }
}

// ==================== AUTH SERVICE ====================
class AuthService {
    constructor(db) {
        this.db = db;
        this.currentUser = null;
        this.sessionKey = 'spts_session';
    }

    hashPassword(password) {
        // Simple hash simulation (in production, use bcrypt on server)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    login(userId, password, role) {
        const user = this.db.data.users[userId];
        if (!user) {
            return { success: false, message: 'User ID not found. Please check your credentials.' };
        }
        if (user.password !== password) {
            return { success: false, message: 'Invalid password. Please try again.' };
        }
        if (user.role !== role) {
            return { success: false, message: `This ID is registered as "${user.role}" and cannot sign in as "${role}".` };
        }
        this.currentUser = user;
        sessionStorage.setItem(this.sessionKey, JSON.stringify({
            userId: user.id,
            role: user.role,
            loginTime: new Date().toISOString()
        }));
        return { success: true, user: user };
    }

    logout() {
        this.currentUser = null;
        sessionStorage.removeItem(this.sessionKey);
    }

    restoreSession() {
        const session = sessionStorage.getItem(this.sessionKey);
        if (session) {
            const { userId } = JSON.parse(session);
            this.currentUser = this.db.data.users[userId];
            return this.currentUser;
        }
        return null;
    }

    changePassword(userId, oldPassword, newPassword) {
        const user = this.db.data.users[userId];
        if (!user) return { success: false, message: 'User not found.' };
        if (user.password !== oldPassword) return { success: false, message: 'Current password is incorrect.' };
        if (newPassword.length < 6) return { success: false, message: 'New password must be at least 6 characters.' };
        user.password = newPassword;
        this.db.save();
        return { success: true, message: 'Password changed successfully!' };
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getRole() {
        return this.currentUser ? this.currentUser.role : null;
    }
}

// ==================== STUDENT SERVICE ====================
class StudentService {
    constructor(db) {
        this.db = db;
    }

    getAllStudents() {
        return Object.values(this.db.data.users).filter(u => u.role === 'student');
    }

    getStudent(studentId) {
        const user = this.db.data.users[studentId];
        if (user && user.role === 'student') return user;
        return null;
    }

    addStudent(studentData) {
        if (this.db.data.users[studentData.id]) {
            return { success: false, message: 'Student ID already exists.' };
        }
        this.db.data.users[studentData.id] = {
            ...studentData,
            role: 'student',
            profilePic: '',
            programme: 'B.Tech',
            branch: 'CSE'
        };
        // Initialize empty marks and attendance
        this.db.data.marks[studentData.id] = {};
        this.db.data.attendance[studentData.id] = {};
        this.db.data.subjects.forEach(sub => {
            this.db.data.marks[studentData.id][sub.code] = { mst1: 0, mst2: 0, internal: 0, endsem: 0, total: sub.credits > 0 ? 100 : 100 };
            this.db.data.attendance[studentData.id][sub.code] = { present: 0, total: 0, percentage: 0 };
        });
        this.db.save();
        return { success: true, message: 'Student added successfully!' };
    }

    updateStudent(studentId, updates) {
        if (!this.db.data.users[studentId]) {
            return { success: false, message: 'Student not found.' };
        }
        Object.assign(this.db.data.users[studentId], updates);
        this.db.save();
        return { success: true, message: 'Student updated successfully!' };
    }

    deleteStudent(studentId) {
        if (!this.db.data.users[studentId]) {
            return { success: false, message: 'Student not found.' };
        }
        delete this.db.data.users[studentId];
        delete this.db.data.marks[studentId];
        delete this.db.data.attendance[studentId];
        this.db.save();
        return { success: true, message: 'Student deleted successfully!' };
    }

    updateProfilePic(studentId, picDataUrl) {
        if (!this.db.data.users[studentId]) {
            return { success: false, message: 'User not found.' };
        }
        this.db.data.users[studentId].profilePic = picDataUrl;
        this.db.save();
        return { success: true, message: 'Profile picture updated!' };
    }

    getStudentPerformance(studentId) {
        const marks = this.db.data.marks[studentId];
        const attendance = this.db.data.attendance[studentId];
        if (!marks) return { totalObtained: 100, totalMax: 100, overallPercentage: '100.0', category: 'Excellent', weakSubjects: [] };

        let totalObtained = 0, totalMax = 0, weakSubjects = [];
        const subjects = this.db.data.subjects || [];

        let subjectCount = 0;
        subjects.forEach(sub => {
            const m = marks[sub.code];
            if (m) {
                subjectCount++;
                const obtained = (m.mst1 || 0) + (m.mst2 || 0) + (m.internal || 0) + (m.endsem || 0);
                // Total assessment max sum: mst1(50) + mst2(50) + internal(25) + endsem(75) = 200
                // Or if calculated out of 100, scale obtained
                const max = m.total || 100;
                // Standardize percentage calculation correctly:
                // Sum of assessment components divided by maximum attainable marks
                const assessmentMax = 200; // 50 + 50 + 25 + 75
                const subPct = (obtained / assessmentMax) * 100;
                totalObtained += obtained;
                totalMax += assessmentMax;

                if (subPct < 50 && obtained > 0) weakSubjects.push(sub.name);
            }
        });

        // Default to 100% if no marks recorded yet
        let overallPct = 100.0;
        if (totalMax > 0 && totalObtained > 0) {
            overallPct = (totalObtained / totalMax) * 100;
        } else if (totalMax > 0 && totalObtained === 0) {
            overallPct = 100.0; // Default count as 100% per user request
        }

        let category = 'Excellent';
        if (overallPct < 40) category = 'Needs Improvement';
        else if (overallPct < 60) category = 'Average';
        else if (overallPct < 75) category = 'Good';

        return {
            totalObtained, totalMax, overallPercentage: overallPct.toFixed(1),
            category, weakSubjects
        };
    }
}

// ==================== TEACHER SERVICE ====================
class TeacherService {
    constructor(db) {
        this.db = db;
    }

    getAllTeachers() {
        return Object.values(this.db.data.users).filter(u => u.role === 'teacher');
    }

    getTeacher(teacherId) {
        const user = this.db.data.users[teacherId];
        if (user && user.role === 'teacher') return user;
        return null;
    }

    addTeacher(teacherData) {
        if (this.db.data.users[teacherData.id]) {
            return { success: false, message: 'Teacher ID already exists.' };
        }
        let subjects = teacherData.subjects || [];
        if (typeof subjects === 'string') {
            subjects = subjects.split(',').map(s => s.trim()).filter(s => s.length > 0);
        }
        const assigned = parseInt(teacherData.classesAssigned) || 120;
        const holidays = teacherData.holidays !== undefined 
            ? parseInt(teacherData.holidays) 
            : (parseInt(teacherData.holidaysTaken) || parseInt(teacherData.classesSkipped) || 0);
        const present = Math.max(0, assigned - holidays);

        this.db.data.users[teacherData.id] = {
            ...teacherData,
            role: 'teacher',
            profilePic: '',
            department: teacherData.department || teacherData.dept || 'CSE',
            subjects: subjects,
            classesAssigned: assigned,
            classesPresent: present,
            classesSkipped: holidays,
            holidays: holidays,
            feedback: []
        };
        // Add to teachers list
        if (!this.db.data.teachers) this.db.data.teachers = [];
        this.db.data.teachers.push({
            id: teacherData.id,
            name: teacherData.name,
            department: teacherData.department || teacherData.dept || 'CSE',
            subjects: subjects,
            classesAssigned: assigned,
            classesPresent: present,
            classesSkipped: holidays,
            holidays: holidays,
            avgFeedbackRating: 0
        });
        this.db.save();
        return { success: true, message: 'Faculty member appointed successfully!' };
    }

    deleteTeacher(teacherId) {
        let deleted = false;
        if (this.db.data.users[teacherId]) {
            delete this.db.data.users[teacherId];
            deleted = true;
        }
        if (this.db.data.teachers && this.db.data.teachers.length > 0) {
            const prevLen = this.db.data.teachers.length;
            this.db.data.teachers = this.db.data.teachers.filter(t => t.id !== teacherId);
            if (this.db.data.teachers.length < prevLen) deleted = true;
        }
        if (!deleted) {
            return { success: false, message: 'Faculty member not found.' };
        }
        this.db.save();
        return { success: true, message: 'Faculty record removed successfully.' };
    }

    getTeacherReport(teacherId) {
        const teacher = this.db.data.users[teacherId] || (this.db.data.teachers || []).find(t => t.id === teacherId);
        if (!teacher) return null;

        const feedbacks = teacher.feedback || [];
        const avgRating = feedbacks.length > 0
            ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
            : (teacher.avgFeedbackRating ? Number(teacher.avgFeedbackRating).toFixed(1) : '5.0');

        const assigned = teacher.classesAssigned !== undefined ? teacher.classesAssigned : 120;
        const holidays = teacher.holidays !== undefined ? teacher.holidays : (teacher.classesSkipped || 0);
        const present = teacher.classesPresent !== undefined ? teacher.classesPresent : Math.max(0, assigned - holidays);

        return {
            name: teacher.name,
            department: teacher.department || teacher.dept || 'CSE',
            subjects: teacher.subjects || [],
            classesAssigned: assigned,
            classesPresent: present,
            classesSkipped: holidays,
            holidays: holidays,
            attendanceRate: assigned > 0
                ? ((present / assigned) * 100).toFixed(1) + '%'
                : '100%',
            feedbacks: feedbacks,
            avgFeedbackRating: avgRating
        };
    }

    updateProfilePic(teacherId, picDataUrl) {
        if (!this.db.data.users[teacherId]) {
            return { success: false, message: 'User not found.' };
        }
        this.db.data.users[teacherId].profilePic = picDataUrl;
        this.db.save();
        return { success: true, message: 'Profile picture updated!' };
    }
}

// ==================== MARKS SERVICE ====================
class MarksService {
    constructor(db) {
        this.db = db;
    }

    getMarks(studentId) {
        return this.db.data.marks[studentId] || {};
    }

    updateMark(studentId, subjectCode, examType, marks) {
        return this.updateMarks(studentId, subjectCode, examType, marks);
    }

    updateMarks(studentId, subjectCode, examType, marks) {
        if (!this.db.data.marks[studentId]) {
            this.db.data.marks[studentId] = {};
        }
        if (!this.db.data.marks[studentId][subjectCode]) {
            this.db.data.marks[studentId][subjectCode] = { mst1: 0, mst2: 0, internal: 0, endsem: 0, total: 100 };
        }
        const validTypes = ['mst1', 'mst2', 'internal', 'endsem'];
        if (!validTypes.includes(examType)) {
            return { success: false, message: 'Invalid exam type.' };
        }
        const maxMarks = { mst1: 50, mst2: 50, internal: 25, endsem: 75 };
        if (marks < 0 || marks > maxMarks[examType]) {
            return { success: false, message: `Marks must be between 0 and ${maxMarks[examType]}.` };
        }
        this.db.data.marks[studentId][subjectCode][examType] = marks;
        this.db.save();
        return { success: true, message: `${examType.toUpperCase()} marks updated for ${subjectCode}.` };
    }

    getSubjectWisePerformance(studentId) {
        const marks = this.db.data.marks[studentId];
        if (!marks) return [];

        return this.db.data.subjects.map(sub => {
            const m = marks[sub.code] || { mst1: 0, mst2: 0, internal: 0, endsem: 0, total: 100 };
            const obtained = (m.mst1 || 0) + (m.mst2 || 0) + (m.internal || 0) + (m.endsem || 0);
            // Assessment max: 50 + 50 + 25 + 75 = 200
            const maxAssessment = 200;
            // Default count as 100% if no exams given yet, otherwise calculate accurate percentage
            const pct = obtained > 0 ? ((obtained / maxAssessment) * 100) : 100.0;
            return {
                code: sub.code,
                name: sub.name,
                mst1: m.mst1 || 0,
                mst2: m.mst2 || 0,
                internal: m.internal || 0,
                endsem: m.endsem || 0,
                total: obtained,
                maxMarks: maxAssessment,
                percentage: pct.toFixed(1)
            };
        });
    }
}

// ==================== ATTENDANCE SERVICE ====================
class AttendanceService {
    constructor(db) {
        this.db = db;
    }

    getAttendance(studentId) {
        return this.db.data.attendance[studentId] || {};
    }

    getAttendanceForSubject(studentId, subjectCode) {
        const att = this.getAttendance(studentId);
        if (att && att[subjectCode]) {
            return att[subjectCode];
        }
        return { present: 0, total: 0, percentage: 0 };
    }

    deleteAttendance(studentId, subjectCode) {
        return this.updateAttendance(studentId, subjectCode, 0, 0);
    }

    updateAttendance(studentId, subjectCode, present, total) {
        if (!this.db.data.attendance[studentId]) {
            this.db.data.attendance[studentId] = {};
        }
        const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
        this.db.data.attendance[studentId][subjectCode] = {
            present: present,
            total: total,
            percentage: parseFloat(percentage)
        };
        this.db.save();
        return { success: true, message: 'Attendance updated successfully!' };
    }

    getOverallAttendance(studentId) {
        const att = this.db.data.attendance[studentId];
        if (!att) return { present: 0, total: 0, percentage: 100.0 };

        let totalPresent = 0, totalClasses = 0;
        Object.values(att).forEach(a => {
            totalPresent += a.present;
            totalClasses += a.total;
        });
        // Default to 100% if no classes scheduled yet, otherwise calculate accurate percentage
        const pct = totalClasses > 0 ? ((totalPresent / totalClasses) * 100).toFixed(1) : '100.0';
        return { present: totalPresent, total: totalClasses, percentage: parseFloat(pct) };
    }
}

// ==================== SUBJECT SERVICE ====================
class SubjectService {
    constructor(db) {
        this.db = db;
    }

    getAllSubjects() {
        return this.db.data.subjects;
    }

    addSubject(subject) {
        const exists = this.db.data.subjects.find(s => s.code === subject.code);
        if (exists) return { success: false, message: 'Subject code already exists.' };
        this.db.data.subjects.push(subject);
        this.db.save();
        return { success: true, message: 'Subject added successfully!' };
    }

    deleteSubject(code) {
        this.db.data.subjects = this.db.data.subjects.filter(s => s.code !== code);
        this.db.save();
        return { success: true, message: 'Subject deleted successfully!' };
    }
}

// ==================== THEME SERVICE ====================
class ThemeService {
    constructor() {
        this.themeKey = 'spts_theme';
    }

    getTheme() {
        return localStorage.getItem(this.themeKey) || 'light';
    }

    setTheme(theme) {
        localStorage.setItem(this.themeKey, theme);
        document.documentElement.setAttribute('data-theme', theme);
    }

    toggle() {
        const current = this.getTheme();
        const next = current === 'light' ? 'dark' : 'light';
        this.setTheme(next);
        return next;
    }

    init() {
        const theme = this.getTheme();
        document.documentElement.setAttribute('data-theme', theme);
    }
}

// ==================== REPORT SERVICE ====================
class ReportService {
    constructor(db, marksService, attendanceService, studentService) {
        this.db = db;
        this.marks = marksService;
        this.attendance = attendanceService;
        this.students = studentService;
    }

    generateStudentReport(studentId) {
        const student = this.students.getStudent(studentId);
        if (!student) return null;

        const subjectPerf = this.marks.getSubjectWisePerformance(studentId);
        const overallAtt = this.attendance.getOverallAttendance(studentId);
        const performance = this.students.getStudentPerformance(studentId);
        const attendanceBySubject = this.attendance.getAttendance(studentId);

        return {
            student,
            subjectPerformance: subjectPerf,
            overallAttendance: overallAtt,
            attendanceBySubject,
            performance
        };
    }
}

// ==================== EXAM SERVICE (Integrated from Online Examination System) ====================
class ExamService {
    constructor(db, marksService) {
        this.db = db;
        this.marks = marksService;
    }

    getAllQuestions() {
        return this.db.data.questions || [];
    }

    getQuestionsForExam(subjectCode, examType) {
        const list = this.getAllQuestions();
        return list.filter(q => (!subjectCode || q.subject === subjectCode) && (!examType || q.exam === examType));
    }

    addQuestion(qData) {
        if (!this.db.data.questions) this.db.data.questions = [];
        const newId = this.db.data.questions.length ? Math.max(...this.db.data.questions.map(q => q.id || 0)) + 1 : 1;
        const q = {
            id: newId,
            subject: qData.subject || 'CS301',
            exam: qData.exam || 'mst1',
            question: qData.question,
            optionA: qData.optionA,
            optionB: qData.optionB,
            optionC: qData.optionC,
            optionD: qData.optionD,
            answer: qData.answer.toUpperCase().trim()
        };
        this.db.data.questions.push(q);
        this.db.save();
        return { success: true, message: 'Question added successfully to the Online Exam Bank!', question: q };
    }

    deleteQuestion(id) {
        if (!this.db.data.questions) return { success: false, message: 'No questions found.' };
        this.db.data.questions = this.db.data.questions.filter(q => q.id !== id);
        this.db.save();
        return { success: true, message: 'Question deleted successfully.' };
    }

    submitExam(studentId, subjectCode, examType, userAnswers) {
        const questions = this.getQuestionsForExam(subjectCode, examType);
        if (!questions.length) {
            return { success: false, message: 'No questions found for this exam.' };
        }

        let correct = 0;
        questions.forEach((q, idx) => {
            const ans = userAnswers[q.id] || userAnswers[idx];
            if (ans && ans.toUpperCase() === q.answer.toUpperCase()) {
                correct++;
            }
        });

        const scorePercent = (correct / questions.length);
        const maxMarks = { mst1: 50, mst2: 50, internal: 25, endsem: 75 }[examType] || 50;
        const scaledMarks = Math.round(scorePercent * maxMarks);

        // Auto-update student marks in the performance tracker!
        this.marks.updateMarks(studentId, subjectCode, examType, scaledMarks);

        return {
            success: true,
            totalQuestions: questions.length,
            correctCount: correct,
            percentage: (scorePercent * 100).toFixed(1),
            marksAwarded: scaledMarks,
            maxMarks: maxMarks
        };
    }
}

// ==================== ASSIGNMENT SERVICE ====================
class AssignmentService {
    constructor(db) {
        this.db = db;
    }

    getAllAssignments() {
        return this.db.data.assignments || [];
    }

    getAssignmentsForSubject(subjectCode) {
        return this.getAllAssignments().filter(a => !subjectCode || a.subject === subjectCode);
    }

    addAssignment(data) {
        if (!this.db.data.assignments) this.db.data.assignments = [];
        const newId = this.db.data.assignments.length ? Math.max(...this.db.data.assignments.map(a => a.id || 0)) + 1 : 1;
        const assignment = {
            id: newId,
            title: data.title,
            subject: data.subject,
            dueDate: data.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            description: data.description,
            maxMarks: parseInt(data.maxMarks) || 25,
            submissions: {}
        };
        this.db.data.assignments.push(assignment);
        this.db.save();
        return { success: true, message: 'Assignment created successfully!', assignment };
    }

    deleteAssignment(id) {
        if (!this.db.data.assignments) return { success: false, message: 'No assignments found' };
        this.db.data.assignments = this.db.data.assignments.filter(a => a.id !== id);
        this.db.save();
        return { success: true, message: 'Assignment deleted successfully!' };
    }

    submitAssignment(assignmentId, studentId, studentName, content) {
        const assign = (this.db.data.assignments || []).find(a => a.id === assignmentId);
        if (!assign) return { success: false, message: 'Assignment not found.' };
        if (!assign.submissions) assign.submissions = {};
        assign.submissions[studentId] = {
            studentName: studentName,
            submittedAt: new Date().toLocaleString(),
            content: content,
            marks: null,
            status: 'Submitted'
        };
        this.db.save();
        return { success: true, message: 'Assignment submitted successfully!' };
    }
}

// ==================== APP INITIALIZATION ====================
const db = new SPTSDatabase();
const authService = new AuthService(db);
const studentService = new StudentService(db);
const teacherService = new TeacherService(db);
const marksService = new MarksService(db);
const attendanceService = new AttendanceService(db);
const subjectService = new SubjectService(db);
const themeService = new ThemeService();
const reportService = new ReportService(db, marksService, attendanceService, studentService);
const examService = new ExamService(db, marksService);
const assignmentService = new AssignmentService(db);

// Initialize application
async function initApp() {
    themeService.init();

    // Always synchronize data and merge missing collections into localStorage
    await db.initFromJSON();

    // Restore session if exists
    const user = authService.restoreSession();
    if (user) {
        showDashboard(user.role);
        return true;
    }

    showLoginPage();
    return true;
}

// Export for frontend use
window.SPTS = {
    db, authService, studentService, teacherService,
    marksService, attendanceService, subjectService,
    themeService, reportService, examService, assignmentService, initApp
};

