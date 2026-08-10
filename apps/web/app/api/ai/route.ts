import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function callGroq(prompt: string): Promise<string> {
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error: ${err}`);
  }

  const data = await res.json();
  return data.choices[0]?.message?.content || "No response";
}

export async function POST(req: NextRequest) {
  try {
    const { action, content, prompt } = await req.json();

    let groqPrompt = "";

    switch (action) {
      case "summarize":
        groqPrompt = `Summarize the following document in 2-3 concise paragraphs. Focus on key points and actionable items:\n\n${content}`;
        break;
      case "suggest":
        groqPrompt = `Based on this document, suggest 3-5 improvements or additions. Be specific and actionable:\n\n${content}`;
        break;
      case "tags":
        groqPrompt = `Generate 5-8 relevant tags/categories for this document. Return only the tags, one per line:\n\n${content}`;
        break;
      case "search":
        groqPrompt = `Analyze this document and identify the 3 most important concepts or themes. Explain each briefly:\n\n${content}`;
        break;
      case "custom":
        groqPrompt = `You are Nexus AI, helping with a knowledge base document. Answer based on the document content when relevant.\n\nDocument:\n${content}\n\nQuestion: ${prompt}`;
        break;
      default:
        return NextResponse.json({ result: "Unknown action" }, { status: 400 });
    }

    const result = await callGroq(groqPrompt);
    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json({ result: `Error: ${error.message}` }, { status: 500 });
  }
}
