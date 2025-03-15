import React, { useEffect, useState } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { Button } from "@/components/ui/button";

const CodeBlock = ({ code, maxLength = 500 }) => {
  const [highlightedCode, setHighlightedCode] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const highlightCode = () => {
      const result = hljs.highlightAuto(code);
      setHighlightedCode(result.value);
    };

    highlightCode();
  }, [code]);

  // Function to toggle the expanded state
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Split the code by lines and get the number of lines to display based on maxLength
  const lines = code.split("\n");
  const displayLines = isExpanded
    ? lines
    : lines.slice(0, Math.floor(maxLength / 100)); // Approximate number of lines to show

  // Recreate the code from the lines to render in HTML
  const displayCode = displayLines.join("\n");

  return (
    <div>
      <pre>
        <code
          dangerouslySetInnerHTML={{
            __html: hljs.highlightAuto(displayCode).value,
          }}
          style={{ overflowX: "auto", fontFamily: "monospace" }}
        />
      </pre>
      <div className="flex flex-col items-center">
        <Button variant={"ghost"} onClick={toggleExpand} className="">
          {isExpanded ? "Show Less" : "Show More"}
        </Button>
      </div>
    </div>
  );
};

export default CodeBlock;
