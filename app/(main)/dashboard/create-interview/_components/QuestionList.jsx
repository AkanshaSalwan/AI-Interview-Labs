'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from '@/components/ui/toast';
import { Loader2, Loader2Icon } from 'lucide-react';
import QuestionListContainer from './QuestionListContainer';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/services/supabaseClient';
import { useUser } from '@/app/provider';
import { useRouter } from 'next/navigation';


function QuestionList({ formData, onCreateLink, finishLabel = 'Create Interview Link & Finish', editable = false }) {
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
    // Drop questions HR emptied out while editing.
    const finalQuestions = questionList
      .map((item) => ({ ...item, question: String(item.question ?? '').trim() }))
      .filter((item) => item.question);
    if (!finalQuestions.length) {
      toast.add({ title: 'Add at least one question' });
      return;
    }

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
            questionList: finalQuestions,
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
        <div className='card-soft flex items-center gap-4 rounded-2xl p-5'>
          <span className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500'>
            <Loader2Icon className='size-5 animate-spin' />
          </span>
          <div>
            <h2 className='text-sm font-medium text-slate-900'>Generating questions…</h2>
            <p className='mt-0.5 text-xs text-slate-500'>Our AI is writing questions for this role and description.</p>
          </div>
        </div>
      }

      {!loading && questionList?.length > 0 && (
        <div>
          <QuestionListContainer questionList={questionList} onChange={editable ? setQuestionList : undefined} />
          <div className='mt-6 flex justify-end'>
            <button
              type='button'
              onClick={() => onFinish()}
              disabled={saveLoading}
              className='btn-orange inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl px-5 text-sm font-medium text-white transition-[filter,transform] hover:brightness-105 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60'
            >
              {saveLoading && <Loader2 className='size-4 animate-spin' />}
              {finishLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionList
