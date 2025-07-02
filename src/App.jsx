import React, { useState } from "react";
import { Box, HStack, Select } from "@chakra-ui/react";
import CodeEditor from "./components/CodeEditor";
import PromptPanel from "./components/PromptPanel";
import data from "./data.json";

// Utility to pick n random unique elements from an array
function getRandomQuestions(arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function App() {
  // Pick 3 random questions on first render
  const [randomQuestions] = useState(() => getRandomQuestions(data, 3));
  const [selectedIdx, setSelectedIdx] = useState(0);
  const questionData = randomQuestions[selectedIdx];

  // Track completion state for each question
  const [completed, setCompleted] = useState([false, false, false]);
  const [examEnded, setExamEnded] = useState(false);

  // Handler to mark a question as completed and move to next unanswered
  const handleQuestionComplete = () => {
    setCompleted((prev) => {
      const updated = [...prev];
      updated[selectedIdx] = true;
      // Find next unanswered question
      const nextIdx = updated.findIndex((done) => !done);
      if (nextIdx !== -1) {
        setSelectedIdx(nextIdx);
      } else {
        setExamEnded(true);
      }
      return updated;
    });
  };

  // Prevent switching to completed questions or after exam ended
  const handleSelectChange = (e) => {
    if (examEnded) return;
    const idx = Number(e.target.value);
    if (!completed[idx]) setSelectedIdx(idx);
  };

  return (
    <Box minH="100vh" bg="#0f0a19" color="gray.500" px={6} py={8}>
      <Select
        value={selectedIdx}
        onChange={handleSelectChange}
        mb={4}
        maxW="400px"
        isDisabled={examEnded}
      >
        {randomQuestions.map((q, idx) => (
          <option
            key={idx}
            value={idx}
            disabled={completed[idx] && idx !== selectedIdx}
          >
            {q.question.slice(0, 60)}...
            {completed[idx] ? " (Completed)" : ""}
          </option>
        ))}
      </Select>
      <HStack align="start" spacing={8}>
        <Box w="40%">
          <PromptPanel
            question={questionData.question}
            sampleInput={questionData.sampleInput}
            sampleOutput={questionData.sampleOutput}
          />
        </Box>
        <Box flex="1">
          <CodeEditor
            question={questionData.question}
            testCases={questionData.testCases}
            internalTestCases={questionData.internalTestCases}
            codeSnippets={questionData.codeSnippets}
            defaultLanguage="javascript"
            onQuestionComplete={handleQuestionComplete}
            key={selectedIdx} // force remount on question change
          />
        </Box>
      </HStack>
      {examEnded && (
        <Box
          position="fixed"
          top={0}
          left={0}
          w="100vw"
          h="100vh"
          bg="rgba(0,0,0,0.7)"
          zIndex={3000}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box
            bg="#232136"
            p={8}
            borderRadius={12}
            minW="350px"
            textAlign="center"
          >
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
              Exam Completed
            </h2>
            <p>Congratulations! You have solved all 3 questions.</p>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default App;
