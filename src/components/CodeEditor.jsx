import { useRef, useState, useEffect } from "react";
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  useToast,
  IconButton,
  Textarea,
  Flex,
  Code,
  Heading,
} from "@chakra-ui/react";
import { EditIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";
import { Editor } from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "../constants";
import { executeCode } from "../api";
import React from "react";

const TEST_CASES = [
  {
    input: "nums = [2,7,11,15], target = 9",
    expected: "[0, 1]",
  },
  {
    input: "nums = [3,2,4], target = 6",
    expected: "[1, 2]",
  },
  {
    input: "nums = [3,3], target = 6",
    expected: "[0, 1]",
  },
];

const INTERNAL_TEST_CASES = [
  { input: "nums = [2,7,11,15], target = 9", expected: "[0, 1]" },
  { input: "nums = [3,2,4], target = 6", expected: "[1, 2]" },
  { input: "nums = [3,3], target = 6", expected: "[0, 1]" },
  { input: "nums = [1, 2, 3, 6], target = 7", expected: "[0, 3]" },
  { input: "nums = [0,4,3,0], target = 0", expected: "[0, 3]" },
  { input: "nums = [-1,-2,-3,-4,-5], target = -8", expected: "[2, 4]" },
  { input: "nums = [1,5,1,5], target = 10", expected: "[1, 3]" },
  { input: "nums = list(range(1, 10001)), target = 19999", expected: "[9998, 9999]" },
  { input: "nums = [1] * 5000 + [5000], target = 5001", expected: "[4999, 5000]" },
  { input: "nums = [10, 20, 10, 40, 50, 60, 70], target = 50", expected: "[2, 3]" },
];

const DEFAULT_USER_TESTCASES = [
  { input: "nums = [2,7,11,15], target = 9", expected: "[0, 1]" },
  { input: "nums = [3,2,4], target = 6", expected: "[1, 2]" },
  { input: "nums = [3,3], target = 6", expected: "[0, 1]" },
];

const QUESTION_TEXT = `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.`;

const CodeEditor = () => {
  const editorRef = useRef();
  const [language, setLanguage] = useState("javascript");
  const [value, setValue] = useState(CODE_SNIPPETS["javascript"]);
  const [showTestcases, setShowTestcases] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [runResults, setRunResults] = useState([]);
  const [runLoading, setRunLoading] = useState(false);
  const toast = useToast();
  const [output, setOutput] = useState("");
  const [outputError, setOutputError] = useState(false);
  const [userTestcases, setUserTestcases] = useState(DEFAULT_USER_TESTCASES);
  const [editingTestcases, setEditingTestcases] = useState(false);
  const [testcaseText, setTestcaseText] = useState(
    DEFAULT_USER_TESTCASES.map(tc => `${tc.input} => ${tc.expected}`).join("\n")
  );
  const [compileResults, setCompileResults] = useState([]);
  const [showSpeechModal, setShowSpeechModal] = useState(false);
  const [speechText, setSpeechText] = useState("");
  const [recognitionRef, setRecognitionRef] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [hasStartedListening, setHasStartedListening] = useState(false); // Track if listening has started
  const [hasStoppedListening, setHasStoppedListening] = useState(false); // Track if stop has been clicked
  const [examState, setExamState] = useState("coding"); // "coding", "explanation", "end"
  const [explanationAttempts, setExplanationAttempts] = useState(0);
  // Track first code/explanation for optimal explanation step
  const [firstCode, setFirstCode] = useState("");
  const [firstExplanation, setFirstExplanation] = useState("");
  const [secondExplanationAttempts, setSecondExplanationAttempts] = useState(0);
  const [isOptimalStep, setIsOptimalStep] = useState(false);
  const [allTestcasesPassed, setAllTestcasesPassed] = useState(false);
  const [optimalStepCount, setOptimalStepCount] = useState(0); // <-- add this state

  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const onSelect = (language) => {
    setLanguage(language);
    setValue(CODE_SNIPPETS[language]);
  };

  const parseTestcases = (text) => {
    return text
      .split("\n")
      .map(line => line.trim())
      .filter(line => line && line.includes("=>"))
      .map(line => {
        const [input, expected] = line.split("=>").map(s => s.trim());
        return { input, expected };
      });
  };

  const handleEditTestcases = () => {
    setEditingTestcases(true);
  };

  const handleSaveTestcases = () => {
    const parsed = parseTestcases(testcaseText);
    if (parsed.length === 0) {
      toast({
        title: "Invalid testcases.",
        description: "Please provide at least one valid testcase in the format: nums = [2,7,11,15], target = 9 => [0,1]",
        status: "error",
        duration: 4000,
      });
      return;
    }
    setUserTestcases(parsed);
    setEditingTestcases(false);
  };

  const handleCancelEdit = () => {
    setTestcaseText(userTestcases.map(tc => `${tc.input} => ${tc.expected}`).join("\n"));
    setEditingTestcases(false);
  };

  const runTestcases = async () => {
    if (!editorRef.current) return;
    const sourceCode = editorRef.current.getValue();
    if (!sourceCode) return;
    setIsLoading(true);
    setTestResults([]);
    setCompileResults([]);
    setOutput("");
    setOutputError(false);

    const results = [];
    for (const test of userTestcases) {
      try {
        let codeToRun = sourceCode;
        if (language === "javascript") {
          codeToRun += `\nconsole.log(twoSum(${test.input.replace("nums = ", "").replace("target = ", "")}));`;
        } else if (language === "python") {
          codeToRun += `\nprint(twoSum(${test.input.replace("nums = ", "").replace("target = ", "")}))`;
        }
        const { run: result } = await executeCode(language, codeToRun);
        const output = (result.output || "").trim().split("\n").pop();
        results.push({
          input: test.input,
          expected: test.expected,
          output,
          pass: output === test.expected,
        });
      } catch (e) {
        results.push({
          input: test.input,
          expected: test.expected,
          output: "Error",
          pass: false,
        });
      }
    }
    setCompileResults(results);
    setIsLoading(false);
  };

  const runInternalTestcases = async () => {
    if (!editorRef.current) return;
    const sourceCode = editorRef.current.getValue();
    if (!sourceCode) return;
    setRunLoading(true);
    setRunResults([]);

    const testsToRun = INTERNAL_TEST_CASES;
    const results = [];
    for (const test of testsToRun) {
      let codeToRun = sourceCode;
      if (language === "javascript") {
        codeToRun += `\nconsole.log(twoSum(${test.input.replace("nums = ", "").replace("target = ", "")}));`;
      } else if (language === "python") {
        codeToRun += `\nprint(twoSum(${test.input.replace("nums = ", "").replace("target = ", "")}))`;
      }
      try {
        const result = await Promise.race([
          executeCode(language, codeToRun),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
        ]);
        const output = (result.run.output || "").trim().split("\n").pop();
        results.push({
          input: test.input,
          expected: test.expected,
          output,
          pass: output === test.expected,
        });
      } catch (e) {
        results.push({
          input: test.input,
          expected: test.expected,
          output: e.message === "Timeout" ? "Timeout" : "Error",
          pass: false,
        });
      }
    }
    setRunResults(results);
    setRunLoading(false);

    const passedCount = results.filter(r => r.pass).length;
    setAllTestcasesPassed(passedCount === 10);

    if (passedCount === 10) {
      // If this is the first time passing all 10, store the code as optimal
      if (!isOptimalStep) {
        setFirstCode(editorRef.current ? editorRef.current.getValue() : value);
        setIsOptimalStep(true);
        setOptimalStepCount(1); // mark first optimal code
        setExamState("explanation");
        setShowSpeechModal(true);
        setSpeechText("");
        setExplanationAttempts(0);
      } else {
        // Already in optimal step, this is the second time passing all 10
        setOptimalStepCount(2);
        setExamState("explanation");
        setShowSpeechModal(true);
        setSpeechText("");
      }
    } else if (passedCount >= 7 && passedCount <= 9) {
      setExamState("explanation");
      setShowSpeechModal(true);
      setSpeechText("");
      setExplanationAttempts(0);
      setIsOptimalStep(false);
      setOptimalStepCount(0);
    }
    setAllTestcasesPassed(passedCount === 10);
  };

  // Speech-to-text logic
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast({
        title: "Speech Recognition not supported",
        description: "Your browser does not support speech recognition.",
        status: "error",
        duration: 4000,
      });
      return;
    }
    setSpeechText("");
    setIsListening(true);
    setHasStartedListening(true); // Only allow once per modal open
    setHasStoppedListening(false); // Reset stop state on start
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      setSpeechText(event.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: "Speech Recognition Error",
        description: "Could not recognize your speech. Please try again.",
        status: "error",
        duration: 4000,
      });
    };
    recognition.onend = () => setIsListening(false);
    setRecognitionRef(recognition);
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef) {
      recognitionRef.stop();
      setIsListening(false);
      setHasStoppedListening(true); // Mark stop as used
    }
  };

  // Send code, question, explanation to backend
  const sendToExplanationEval = async (question, code, explanation) => {
    try {
      const res = await fetch("/python/question_code_exp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, code, explanation }),
      });
      const data = await res.text();
      setExpResult(data.trim());
      toast({
        title: "Explanation Evaluation",
        description: `Result: ${data.trim()}`,
        status: data.trim() === "success" ? "success" : "error",
        duration: 4000,
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to evaluate explanation.",
        status: "error",
        duration: 4000,
      });
    }
  };

  // On mount, allow user to write code
  useEffect(() => {
    setExamState("coding");
    setShowSpeechModal(false);
    setExplanationAttempts(0);
    setValue(CODE_SNIPPETS[language]);
    setRunResults([]);
    setCompileResults([]);
  }, []);

  // When language changes, reset code only if in coding state and not returning from explanation
  useEffect(() => {
    // Only reset code if examState is coding and explanationAttempts === 0 (not returning from explanation)
    if (examState === "coding" && explanationAttempts === 0) {
      setValue(CODE_SNIPPETS[language]);
    }
    // Otherwise, do not reset code (preserve user code after explanation)
  }, [language /* removed examState from deps to avoid unwanted resets */, /* explanationAttempts intentionally omitted */]);

  // Handler for submitting explanation
  const handleSubmitExplanation = async () => {
    setShowSpeechModal(false);
    setHasStartedListening(false);
    setHasStoppedListening(false);
    const question = QUESTION_TEXT;
    const code = editorRef.current ? editorRef.current.getValue() : value;
    const explanation = speechText;

    // If in optimal step (all 10 passed and user is explaining changes)
    // REMOVE the second optimal step logic, just end exam if explanation is correct
    if (isOptimalStep && allTestcasesPassed) {
      // If first explanation for optimal, store it
      if (!firstExplanation) setFirstExplanation(explanation);

      try {
        // Call question_code_exp.py for explanation evaluation
        const res = await fetch("/python/question_code_exp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, code, explanation }),
        });
        const data = await res.json();
        const result = (data.result || "").trim();
        if (result === "0") {
          setExamState("end");
          toast({
            title: "Exam Completed",
            description: "You passed all testcases and correctly explained your code. Exam ended.",
            status: "success",
            duration: 6000,
          });
        } else if (result === "1") {
          const newAttempts = secondExplanationAttempts + 1;
          setSecondExplanationAttempts(newAttempts);
          if (newAttempts < 2) {
            setTimeout(() => {
              setShowSpeechModal(true);
              toast({
                title: "Incorrect Explanation",
                description: "Your explanation was incorrect. Please try again.",
                status: "error",
                duration: 4000,
              });
            }, 500);
          } else {
            setExamState("end");
            toast({
              title: "Exam Ended",
              description: "You have used all your explanation attempts for the optimal code.",
              status: "error",
              duration: 6000,
            });
          }
        } else {
          toast({
            title: "Error",
            description: "Unexpected result from backend.",
            status: "error",
            duration: 4000,
          });
        }
      } catch (e) {
        toast({
          title: "Error",
          description: "Failed to evaluate explanation.",
          status: "error",
          duration: 4000,
        });
      }
      return;
    }

    // If this is the first optimal code explanation (after first 10/10)
    if (isOptimalStep && allTestcasesPassed && optimalStepCount === 1) {
      // Store the first explanation and allow user to write new code for optimal
      setFirstExplanation(explanation);
      toast({
        title: "Explanation Recorded",
        description: "Your explanation for the first (bruteforce) code is recorded. Now, try to write an optimal solution and run again.",
        status: "success",
        duration: 5000,
      });
      setExamState("coding");
      setSpeechText("");
      setExplanationAttempts(0);
      setRunResults([]);
      setCompileResults([]);
      return;
    }

    // Otherwise, normal explanation for 7-9 testcases
    try {
      const res = await fetch("/python/question_code_exp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, code, explanation }),
      });
      const data = await res.json();
      const result = (data.result || "").trim();
      if (result === "0") {
        // If user had passed all 10 testcases and explanation is correct, end exam
        if (allTestcasesPassed) {
          setExamState("end");
          toast({
            title: "Exam Completed",
            description: "You passed all testcases and correctly explained your code. Exam ended.",
            status: "success",
            duration: 6000,
          });
        } else {
          toast({
            title: "Explanation Evaluation",
            description: "Correct! You may now write your code again.",
            status: "success",
            duration: 4000,
          });
          setExamState("coding");
          setSpeechText("");
          setExplanationAttempts(0);
          setRunResults([]);
          setCompileResults([]);
          // Do NOT reset the code editor value here!
        }
      } else if (result === "1") {
        const newAttempts = explanationAttempts + 1;
        setExplanationAttempts(newAttempts);
        if (newAttempts < 2) {
          setTimeout(() => {
            setShowSpeechModal(true);
            toast({
              title: "Incorrect Explanation",
              description: "Your previous explanation was incorrect. Please try again.",
              status: "error",
              duration: 4000,
            });
          }, 500);
        } else {
          setExamState("end");
          toast({
            title: "Exam Ended",
            description: "You have used all your explanation attempts.",
            status: "error",
            duration: 6000,
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Unexpected result from backend.",
          status: "error",
          duration: 4000,
        });
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to evaluate explanation.",
        status: "error",
        duration: 4000,
      });
    }
  };

  return (
    <Box>
      <LanguageSelector language={language} onSelect={onSelect} />
      <Editor
        options={{
          minimap: { enabled: false },
          readOnly: examState !== "coding", // Not read-only when coding
        }}
        height="45vh"
        theme="vs-dark"
        language={language}
        defaultValue={CODE_SNIPPETS[language]}
        onMount={onMount}
        value={value}
        onChange={(val) => setValue(val)} // Always update value state
      />
      <HStack mt={4} spacing={4}>
        <Button colorScheme="green" isLoading={isLoading} onClick={runTestcases} isDisabled={examState !== "coding"}>
          Compile
        </Button>
        <Button colorScheme="blue" isLoading={runLoading} onClick={runInternalTestcases} isDisabled={examState !== "coding"}>
          Run
        </Button>
      </HStack>
      {showTestcases && (
        <Box mt={4} p={3} bg="#18122b" borderRadius={8}>
          <Text fontWeight="bold" mb={2}>Sample Testcases:</Text>
          {userTestcases.map((test, idx) => (
            <Box key={idx} mb={2}>
              <Text fontSize="sm"><b>Input:</b> {test.input}</Text>
              <Text fontSize="sm"><b>Expected:</b> {test.expected}</Text>
            </Box>
          ))}
        </Box>
      )}
      <Tabs mt={6} variant="enclosed" colorScheme="purple">
        <TabList>
          <Tab>
            <Flex align="center">
              Testcases
              <IconButton
                aria-label={editingTestcases ? "Save" : "Edit"}
                icon={editingTestcases ? <CheckIcon /> : <EditIcon />}
                size="xs"
                ml={2}
                onClick={editingTestcases ? handleSaveTestcases : handleEditTestcases}
                variant="ghost"
              />
              {editingTestcases && (
                <IconButton
                  aria-label="Cancel"
                  icon={<CloseIcon />}
                  size="xs"
                  ml={1}
                  onClick={handleCancelEdit}
                  variant="ghost"
                />
              )}
            </Flex>
          </Tab>
          <Tab>Compile Output</Tab>
          <Tab>Run Output</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {editingTestcases ? (
              <Box>
                <Text mb={2}>
                  Enter testcases in the format:<br />
                  <Code>nums = [2,7,11,15], target = 9 =&gt; [0,1]</Code>
                </Text>
                <Textarea
                  value={testcaseText}
                  onChange={e => setTestcaseText(e.target.value)}
                  rows={userTestcases.length + 2}
                  fontFamily="mono"
                  bg="#232136"
                  color="gray.200"
                  borderRadius={6}
                  mb={2}
                />
                <Text fontSize="sm" color="gray.400">
                  One testcase per line. <br />
                  <b>Input</b> and <b>Expected Output</b> separated by <Code>=&gt;</Code>
                </Text>
              </Box>
            ) : (
              <Box>
                {userTestcases.length === 0 && (
                  <Text color="gray.400">No testcases defined.</Text>
                )}
                {userTestcases.map((test, idx) => (
                  <Box key={idx} mb={2}>
                    <Text fontSize="sm"><b>Input:</b> {test.input}</Text>
                    <Text fontSize="sm"><b>Expected:</b> {test.expected}</Text>
                  </Box>
                ))}
              </Box>
            )}
          </TabPanel>
          <TabPanel>
            <Box p={3} bg="#232136" borderRadius={8}>
              <Text fontWeight="bold" mb={2}>Compile Output:</Text>
              {compileResults.length === 0 ? (
                <Text color="gray.400">Click "Compile" to see the output here</Text>
              ) : (
                compileResults.map((res, idx) => (
                  <Box key={idx} mb={3}>
                    <Text fontSize="sm"><b>Input:</b> {res.input}</Text>
                    <Text fontSize="sm"><b>Expected:</b> {res.expected}</Text>
                    <Text fontSize="sm"><b>Output:</b> {res.output}</Text>
                    <Text fontSize="sm" color={res.pass ? "green.400" : "red.400"}>
                      {res.pass ? "Passed" : "Failed"}
                    </Text>
                  </Box>
                ))
              )}
            </Box>
          </TabPanel>
          <TabPanel>
            {runResults.length > 0 ? (
              <Box p={3} bg="#232136" borderRadius={8}>
                <Flex align="center" mb={2}>
                  <Text fontWeight="bold" mr={2}>
                    Hidden Testcases:
                  </Text>
                  <Badge colorScheme="green" fontSize="1em">
                    {runResults.filter(r => r.pass).length} / {runResults.length} Passed
                  </Badge>
                  <Badge colorScheme="yellow" fontSize="1em" ml={2}>
                    Remaining: {runResults.length - runResults.filter(r => r.pass).length}
                  </Badge>
                </Flex>
                {runResults.map((res, idx) => (
                  <Box key={idx} mb={2}>
                    <Text fontSize="sm"><b>Input:</b> {res.input}</Text>
                    <Text fontSize="sm"><b>Output:</b> {res.output}</Text>
                    <Text fontSize="sm" color={res.pass ? "green.400" : "red.400"}>
                      {res.pass ? "Passed" : "Failed"}
                    </Text>
                  </Box>
                ))}
              </Box>
            ) : (
              <Text color="gray.400">No run results yet. Click "Run".</Text>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Speech-to-text modal */}
      {showSpeechModal && examState === "explanation" && (
        <Box
          position="fixed"
          top={0}
          left={0}
          w="100vw"
          h="100vh"
          bg="rgba(0,0,0,0.7)"
          zIndex={2000}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box bg="#232136" p={8} borderRadius={12} minW="350px">
            <Heading size="md" mb={4}>Explain Your Code (Speak)</Heading>
            <Text mb={2}>
              Please explain your code logic. Click "Start" and speak your explanation.
            </Text>
            <HStack mb={3}>
              <Button
                colorScheme="purple"
                onClick={startListening}
                isDisabled={hasStartedListening}
              >
                Start
              </Button>
              <Button
                colorScheme="red"
                onClick={stopListening}
                isDisabled={!isListening || hasStoppedListening}
              >
                Stop
              </Button>
            </HStack>
            <Textarea
              value={speechText}
              isReadOnly
              placeholder="Your explanation will appear here..."
              rows={4}
              mb={3}
              bg="#18122b"
              color="gray.200"
            />
            <HStack>
              <Button
                colorScheme="green"
                onClick={handleSubmitExplanation}
                isDisabled={!speechText}
              >
                Submit
              </Button>
            </HStack>
          </Box>
        </Box>
      )}
      {examState === "end" && (
        <Box
          position="fixed"
          top={0}
          left={0}
          w="100vw"
          h="100vh"
          bg="rgba(0,0,0,0.7)"
          zIndex={2000}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box bg="#232136" p={8} borderRadius={12} minW="350px" textAlign="center">
            <Heading size="md" mb={4}>Exam Ended</Heading>
            <Text mb={2}>
              You have used all your explanation attempts. The exam is now over.
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};
export default CodeEditor;

