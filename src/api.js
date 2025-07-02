import axios from "axios";
import { LANGUAGE_VERSIONS } from "./constants";

const API = axios.create({
  baseURL: "https://emkc.org/api/v2/piston",
});

export const executeCode = async (language, sourceCode) => {
  const version = LANGUAGE_VERSIONS[language] || Object.values(LANGUAGE_VERSIONS)[0];
  const response = await API.post(
    "/execute",
    {
      language: language,
      version: version,
      files: [
        {
          content: sourceCode,
        },
      ],
    },
    { timeout: 8000 } // 8 seconds timeout
  );
  return response.data;
};
