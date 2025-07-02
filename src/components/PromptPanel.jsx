import { Box, Text, Heading, VStack, Code } from "@chakra-ui/react";

const PromptPanel = ({ question, sampleInput, sampleOutput }) => (
  <Box w="100%" p={6} bg="#18122b" borderRadius={8} minH="75vh">
    <VStack align="start" spacing={6}>
      <Box>
        <Heading size="md" mb={2}>Question</Heading>
        <Text>{question}</Text>
      </Box>
      <Box>
        <Heading size="sm" mb={1}>Example Input</Heading>
        <Code p={2} borderRadius={4} bg="#232136">{sampleInput}</Code>
      </Box>
      <Box>
        <Heading size="sm" mb={1}>Example Output</Heading>
        <Code p={2} borderRadius={4} bg="#232136">{sampleOutput}</Code>
      </Box>
    </VStack>
  </Box>
);
export default PromptPanel;
