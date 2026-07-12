Act as an Elite JEE / NEET Academic Expert and Active Recall Architect.
Generate high-quality, exhaustive active recall retrieval cards for the following lecture/slide content:

""

--- EXHAUSTIVE COVERAGE MANDATE (ZERO-GAP AUDIT) ---
Your goal is 100% comprehensive conceptual and factual mastery. A student revising ONLY these cards must be able to recall every concept, formula, definition, exception, diagram, and numerical trap discussed in the lecture.
1. DO NOT SKIP ANY TOPIC OR SLIDE: Deconstruct the entire lecture systematically slide-by-slide and paragraph-by-paragraph.
2. CONCEPT-BY-CONCEPT GRANULARITY: Never collapse multiple distinct rules, definitions, or exceptions into a single generic card. Every key definition, formula, law, periodic exception, reaction mechanism, or numerical trick must have its own dedicated retrieval card(s).
3. IDEAL CARD VOLUME: Do not stop early. A full lecture typically requires 15 to 40+ cards to achieve complete coverage without any omissions.

--- CATEGORIZATION & OUTPUT FORMAT ---
Format your output strictly as follows:
First, write `Topic: <Major Topic Name>` for a major section of the chapter.
Then, immediately below that topic header, output the TSV table containing all cards for that specific topic.
Repeat this header-and-TSV pattern for every major topic covered in the lecture until the entire lecture has been converted into cards.

Example structure:
Topic: Atomic Structure & Bohr's Model
type	front	back	options	correctOption	clozeTemplate	whyPrompt	tags	subtopicSlug	tier	advancedMetadata
[... all TSV rows for Atomic Structure ...]

Topic: Quantum Numbers & Aufbau Principle
type	front	back	options	correctOption	clozeTemplate	whyPrompt	tags	subtopicSlug	tier	advancedMetadata
[... all TSV rows for Quantum Numbers ...]


--- SCHEMA REFERENCE & FORMATTING RULES (CRITICAL) ---
1. type: Must be exactly one of: [flashcard, mcq, cloze, elaborative, numerical, assertion_reason, error_spotting, matrix_match, sequencing, multi_select, true_false_justify]
2. ALL INDICES MUST BE 0-BASED. (Option 1 = 0, Line 1 = 0).
3. EMPTY FIELDS (CRITICAL): If a field is not used by the card type (e.g. no options for a flashcard), you MUST output exactly the word [EMPTY]. Do NOT leave it blank or add extra tabs to align columns visually.
4. JSON in TSV: The 'advancedMetadata' field must be a valid JSON string without double-quotes wrapping the outer JSON unless escaped. Do NOT use tabs inside the JSON.
5. Formatting by type (CRITICAL: Omitted fields must be exactly [EMPTY]):
   - "flashcard": Standard Q&A. front="Question", back="Answer".
   - "cloze": Fill-in-the-blank. front=[EMPTY], back=[EMPTY], clozeTemplate="This is a {{c1::cloze template}}."
   - "mcq": front="Question", back=[EMPTY], options="Option A | Option B | Option C | Option D", correctOption="0".
   - "multi_select": front="Question", back=[EMPTY], options="Option A | Option B | Option C", advancedMetadata={"correctOptions": [0, 2]}
   - "numerical": front="Calculate value...", back=[EMPTY], advancedMetadata={"numericalAnswer": 12.27, "numericalTolerance": 0.05}
   - "assertion_reason": front="Intro...", back=[EMPTY], advancedMetadata={"assertion": "Assertion statement", "reason": "Reason statement", "correctAssertionReasonKey": "A"}.
   - "error_spotting": front="multi-line calculation using \n for new lines", back=[EMPTY], advancedMetadata={"errorLine": 4}.
   - "matrix_match":
     * front: "Introduction statement."
     * back: [EMPTY]
     * advancedMetadata must contain exactly these keys:
       {"matrixA": ["Item A1", "Item A2"], "matrixB": ["Item B1", "Item B2"], "matrixMapping": {"0": [1], "1": [0]}}
   - "sequencing": front="Order these:", back=[EMPTY], options="Item A | Item B | Item C", advancedMetadata={"sequenceOrder": [2, 0, 1]}.
   - "true_false_justify": front="Statement...", back="True or False", advancedMetadata={"justification": "Why it is true/false"}

subtopicSlug: MUST be exactly: slug
tier: free

--- GRAPH BLOCKS (USE WHEN HELPFUL) ---
The front and back fields support two special fenced code block types that render as live visuals.
Use them to make difficult concepts instantly visual. They work alongside regular markdown and LaTeX math.

CRITICAL PLACEMENT RULE FOR FLASHCARDS:
- NEVER put explanatory Mermaid diagrams, concept maps, or solution flowcharts in the 'front' (Question) column! Placing the diagram in 'front' spoils the answer for the student.
- ALL explanatory Mermaid diagrams and JSON charts MUST be placed inside the 'back' (Answer) column or 'whyPrompt' column.

RULE: Never put tabs inside graph blocks. Use spaces only inside JSON chart specs.

6. Mermaid diagrams — use ```mermaid blocks for: process flows, concept maps, sequences, relationships.
   Supported types: flowchart, graph, sequenceDiagram, pie
   Examples:
   
   Flowchart (chemistry/biology process):
   ```mermaid
   flowchart LR
     A[Glucose] --> B[Pyruvate] --> C[Acetyl-CoA] --> D[Krebs Cycle] --> E[34 ATP]
   ```
   
   Concept map (physics relationships):
   ```mermaid
   graph TD
     A[Newton's 2nd Law F=ma] --> B[Mass ↑ → Acceleration ↓]
     A --> C[Force ↑ → Acceleration ↑]
   ```
   
   Pie chart (composition/distribution):
   ```mermaid
   pie title Cell Cycle Phases
     "G1" : 43
     "S Phase" : 35
     "G2" : 15
     "Mitosis" : 7
   ```
   
   Keep diagrams concise: max 8-10 nodes. Use Unicode for subscripts: CO₂, H₂O, x².

7. JSON data charts — use ```chart blocks for: numerical comparisons, trends, part-whole data.
   Supported types: bar, line, pie
   Schema: {"type":"bar"|"line"|"pie","title":"string","xKey":"string","yKey":"string","color":"#HEX","data":[...]}
   Note: pie type uses {"name":"...","value":number} objects. bar/line use xKey/yKey to name the axis fields.
   
   Bar chart (compare quantities across categories):
   ```chart
   {"type":"bar","title":"First Ionisation Energy (kJ/mol)","xKey":"element","yKey":"energy","color":"#F59E0B","data":[{"element":"Li","energy":520},{"element":"Na","energy":496},{"element":"K","energy":419}]}
   ```
   
   Line chart (trend / change over variable):
   ```chart
   {"type":"line","title":"Free Fall: v vs t","xKey":"t_s","yKey":"v_ms","color":"#10B981","data":[{"t_s":0,"v_ms":0},{"t_s":1,"v_ms":9.8},{"t_s":2,"v_ms":19.6},{"t_s":3,"v_ms":29.4}]}
   ```
   
   Pie chart (composition):
   ```chart
   {"type":"pie","title":"Atmosphere","data":[{"name":"N₂","value":78},{"name":"O₂","value":21},{"name":"Ar","value":1}]}
   ```

Generate diverse cards focusing on deep conceptual mastery. Use LaTeX for math ($...$ or $$...$$). Ensure advancedMetadata is a valid JSON string without internal tabs. Include at least 1-2 graph blocks per batch where they add genuine visual clarity (e.g. reaction pathways, trend graphs, process maps).

--- FINAL RECALL CHECKLIST ---
Before completing your output, verify:
- Have you covered EVERY single slide, formula, definition, exception, and numerical example in the lecture?
- Did you generate dedicated cards for every subtopic without cutting corners or skipping secondary topics?
- Are cards properly grouped under `Topic: <Major Topic Name>` headers with valid TSV tables below each?
