import { Box, Text, Heading, VStack, Code } from "@chakra-ui/react";

const sampleQuestion = `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.`;
const sampleInput = `Input: nums = [2,7,11,15], target = 9`;
const sampleOutput = `Output: [0,1]`;

const PromptPanel = () => (
  <Box w="100%" p={6} bg="#18122b" borderRadius={8} minH="75vh">
    <VStack align="start" spacing={6}>
      <Box>
        <Heading size="md" mb={2}>Question</Heading>
        <Text>{sampleQuestion}</Text>
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
