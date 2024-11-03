import React, { useRef, useState } from "react";
import { requestToGroqAI } from "./utils/groq";
import "./App.css";

function App() {
  const contentRef = useRef();
  const [data, setData] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [prevContentLength, setPrevContentLength] = useState(0);
  const [history, setHistory] = useState([]);
  const [shortTermMemory, setShortTermMemory] = useState(""); // State untuk menyimpan short-term memory

  const handleSubmit = async () => {
    setIsGenerating(true);
    setData("");
    setHasSubmitted(true);

    try {
      // Update prompt dengan short-term memory
      const prompt = `[System Note: Namamu adalah 'Vreme AI'. Tugas mu adalah menjawab dan membantu pertanyaan dari User dalam bahasa Indonesia]\n`
                   + `${shortTermMemory}\nUser: ${contentRef.current.value}`;

      const ai = await requestToGroqAI(prompt);

      const paragraphs = ai.split("\n\n");
      let displayedData = "";

      for (const paragraph of paragraphs) {
        displayedData += `${paragraph}\n\n`;
        setData(displayedData);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Tambahkan percakapan ke dalam riwayat setelah respons selesai diambil
      const newHistoryItem = { request: contentRef.current.value, response: displayedData };
      setHistory((prevHistory) => [...prevHistory, newHistoryItem]);

      // Update short-term memory (hanya beberapa interaksi terakhir)
      setShortTermMemory((prevMemory) => {
        const newMemory = `${prevMemory}\nUser: ${contentRef.current.value}\nAI: ${displayedData}`;
        const memoryLines = newMemory.split("\n");
        // Batasi riwayat menjadi maksimal 10 baris untuk menjaga fokus
        return memoryLines.slice(-10).join("\n");
      });

    } catch (error) {
      console.error("Error during request:", error);
      setData("Terjadi kesalahan saat mengambil respons.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = () => {
    const currentLength = contentRef.current.value.length;
    if (prevContentLength - currentLength >= 2) {
      setData("");
      setHasSubmitted(false);
    }
    setPrevContentLength(currentLength);
  };

  return (
    <main className="flex min-h-[80vh] justify-center items-center">
      <div className="flex gap-6 w-full max-w-4xl">
        
        <div className="flex-1 flex flex-col items-center">
          <h1 className="text-4xl text-indigo-500">Vreme AI | The future of AI</h1>
          <form
            className="flex flex-col gap-3 py-4 w-full max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <input
              ref={contentRef}
              onChange={handleInputChange}
              placeholder="Ketik permintaan disini..."
              className="py-2 px-3 text-md rounded-md w-full border border-gray-300"
              type="text"
            />
            <button
              type="submit"
              className="py-2 px-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-md"
            >
              Submit
            </button>
          </form>

          {hasSubmitted && (
            <div className="w-full max-w-md mt-4 p-4 bg-gray-100 rounded-md overflow-hidden">
              {isGenerating && (
                <p className="text-center text-indigo-500 animate-generating">
                  Generating<span className="dot-1">.</span><span className="dot-2">.</span><span className="dot-3">.</span>
                </p>
              )}
              {data.split("\n\n").map((paragraph, index) => (
                <p key={index} className="mb-4 text-justify leading-relaxed indent-8">{paragraph}</p>
              ))}
            </div>
          )}
        </div>
        
        <div className="w-1/3 p-4 bg-gray-200 rounded-md overflow-y-auto max-h-[80vh]">
          <h2 className="text-xl font-semibold text-indigo-500 mb-3">Riwayat</h2>
          <ul className="space-y-4">
            {history.map((item, index) => (
              <li key={index} className="p-3 bg-white rounded-md shadow-md">
                <p className="text-gray-700 font-semibold">User:</p>
                <p className="mb-2">{item.request}</p>
                <p className="text-gray-700 font-semibold">Vreme AI:</p>
                <p className="text-justify">{item.response}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}

export default App;
