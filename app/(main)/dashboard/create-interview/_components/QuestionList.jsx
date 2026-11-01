'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from '@/components/ui/toast';
import { Loader2, Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QuestionListContainer from './QuestionListContainer';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/services/supabaseClient';
import { useUser } from '@/app/provider';
import { useRouter } from 'next/navigation';


function QuestionList({ formData, onCreateLink, finishLabel = 'Create Interview Link & Finish' }) {
  const supabase = createClient();
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [questionList, setQuestionList] = useState([]);

  useEffect(() => {
    if (formData) {
      GenerateQuestionList();
      //we can comment this line to avoid the api call when the formData is not changed
    }
  }, [formData])

  const normalizeQuestions = (parsed) => {
    const list = parsed?.interviewQuestions || parsed?.questions || parsed;
    if (!Array.isArray(list) || list.length === 0) {
      throw new Error("Invalid AI response");
    }
    return list.map((item) => (
      typeof item === "string" ? { question: item } : item
    ));
  }

  const parseQuestions = (content) => {
    if (Array.isArray(content)) {
      content = content.map((part) => part?.text || part).join("\n");
    }
    if (typeof content !== "string") {
      content = JSON.stringify(content);
    }

    const cleaned = content
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .replace(/,\s*([}\]])/g, "$1")
      .trim();

    try {
      return normalizeQuestions(JSON.parse(cleaned));
    } catch {}

    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return normalizeQuestions(JSON.parse(objectMatch[0].replace(/,\s*([}\]])/g, "$1")));
      } catch {}
    }

    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return normalizeQuestions(JSON.parse(arrayMatch[0].replace(/,\s*([}\]])/g, "$1")));
      } catch {}
    }

    const numbered = cleaned
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^\d+[\.\)]\s+/.test(line))
      .map((line) => ({
        question: line.replace(/^\d+[\.\)]\s+/, "").trim(),
      }));

    if (numbered.length > 0) {
      return numbered;
    }

    console.log("AI content that failed to parse:", content);
    throw new Error("Invalid AI response");
  }

  const GenerateQuestionList = async () => {
    setLoading(true);
    try {
      const result = await axios.post("/api/ai-model", {
        jobPosition: formData.jobPosition,
        jobDescription: formData.jobDescription,
        duration: formData.interviewDuration,
        type: formData.types,
        difficulty: formData.difficulty,
        resumeText: formData.resumeText,
      });

      const content = result.data?.content;
      if (!content) {
        throw new Error(result.data?.error || "Empty AI response");
      }

      const questions = parseQuestions(content);
      setQuestionList(questions);
    } catch (error) {
      console.log(error);
      toast.add({
        title: error?.response?.data?.error || error.message || "Server Error, Try Again!",
      });
    } finally {
      setLoading(false);
    }
  }

  const onFinish = async () => {
    setSaveLoading(true);
    const interviewId = uuidv4();
    try {
      const { data, error } = await supabase
        .from('interviews')
        .insert([
          {
            jobPosition: formData.jobPosition,
            jobDescription: formData.jobDescription,
            duration: formData.interviewDuration,
            type: Array.isArray(formData.types) ? formData.types.join(',') : formData.types,
            questionList: questionList,
            userEmail: user?.email,
            interview_id: interviewId,
            ...(formData.isPractice && { is_practice: true }),
            ...(formData.difficulty && { difficulty: formData.difficulty }),
          },
        ])
        .select();

      console.log(data, error);

      if (error) {
        toast.add({
          title: error.message,
        });
        return;
      }

      toast.add({
        title: "Interview created successfully",
      });
      onCreateLink(interviewId);
    } finally {
      setSaveLoading(false);
    }
  }

  return (
    <div>
      {loading &&
        <div className='p-5 bg-violet-50 rounded-2xl border border-violet-500 flex gap-5 items-center'>
          <Loader2Icon className='animate-spin' />
          <div>
            <h2 className='font-medium'>Generating Question List...</h2>
            <p className='text-violet-500'>Our AI is crafting personalized questions bases on your job position and job description.</p>
          </div>
        </div>
      }

      {!loading && questionList?.length > 0 && (
        <div className='p-5 bg-white rounded-2xl'>
          <QuestionListContainer questionList={questionList} />
          <div className='flex justify-end mt-10'>
            <Button onClick={() => onFinish()} disabled={saveLoading}>
              {saveLoading && <Loader2 className='animate-spin' />}
              {finishLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionList
