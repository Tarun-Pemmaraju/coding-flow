import { Box, HStack } from "@chakra-ui/react";
import CodeEditor from "./components/CodeEditor";
import PromptPanel from "./components/PromptPanel";

function App() {
  return (
    <Box minH="100vh" bg="#0f0a19" color="gray.500" px={6} py={8}>
      <HStack align="start" spacing={8}>
        <Box w="40%">
          <PromptPanel />
        </Box>
        <Box flex="1">
          <CodeEditor />
        </Box>
      </HStack>
    </Box>
  );
}

export default App;
