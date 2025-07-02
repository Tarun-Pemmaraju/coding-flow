import React, { useState } from "react";
import { Box, HStack, Select } from "@chakra-ui/react";
import CodeEditor from "./components/CodeEditor";
import PromptPanel from "./components/PromptPanel";
import data from "./data.json";

function App() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const questionData = data[selectedIdx];

  return (
    <Box minH="100vh" bg="#0f0a19" color="gray.500" px={6} py={8}>
      <Select
        value={selectedIdx}
        onChange={(e) => setSelectedIdx(Number(e.target.value))}
        mb={4}
        maxW="400px"
      >
        {data.map((q, idx) => (
          <option key={idx} value={idx}>
            {q.question.slice(0, 60)}...
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
            codeSnippets={questionData.codeSnippets} // <-- ensure this updates per question
            defaultLanguage="javascript"
          />
        </Box>
      </HStack>
    </Box>
  );
}

export default App;
