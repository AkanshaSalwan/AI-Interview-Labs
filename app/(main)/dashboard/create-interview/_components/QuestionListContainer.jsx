import React, { useLayoutEffect, useRef } from 'react'
import { Plus, Trash2 } from 'lucide-react'

// A textarea that is always exactly as tall as its text, so it never shows a scrollbar.
function AutoGrowTextarea({ value, className, ...props }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const fit = () => {
      element.style.height = 'auto'
      element.style.height = `${element.scrollHeight}px`
    }
    fit()
    // Re-fit when the column gets narrower or wider (window resize, sidebar toggle).
    const observer = new ResizeObserver(fit)
    observer.observe(element.parentElement)
    return () => observer.disconnect()
  }, [value])

  return <textarea ref={ref} value={value} rows={1} className={`overflow-hidden ${className}`} {...props} />
}

// The AI's questions. With `onChange`, HR can rewrite, delete and add their own before saving
// (a question left empty is dropped when the interview is saved).
function QuestionListContainer({ questionList, onChange }) {
  const editable = Boolean(onChange)

  const update = (index, question) => onChange(questionList.map((item, i) => (i === index ? { ...item, question } : item)))
  const remove = (index) => onChange(questionList.filter((_, i) => i !== index))
  const add = () => onChange([...questionList, { question: '', type: 'Custom' }])

  return (
    <div>
      <div className='mb-3 flex items-baseline justify-between'>
        <h2 className='text-[15px] font-semibold text-slate-900'>{editable ? 'Review & edit questions' : 'Generated questions'}</h2>
        <span className='text-xs text-slate-400'>{questionList.length} questions</span>
      </div>
      <ol className='surface divide-y divide-orange-50 overflow-hidden rounded-2xl'>
        {questionList.map((item, index) => (
          <li key={index} className='flex gap-3.5 px-5 py-3.5'>
            <span className='mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-medium text-orange-600'>
              {index + 1}
            </span>
            <div className='min-w-0 flex-1'>
              {editable ? (
                <AutoGrowTextarea
                  value={item.question ?? ''}
                  onChange={(event) => update(index, event.target.value)}
                  placeholder='Type your question'
                  className='w-full resize-none rounded-lg border border-transparent bg-transparent px-2 py-1 -mx-2 text-sm leading-relaxed text-slate-800 outline-none transition-colors hover:border-slate-200 focus:border-orange-300 focus:bg-white focus:ring-3 focus:ring-orange-100'
                />
              ) : (
                <p className='text-sm leading-relaxed text-slate-800'>{item.question || item}</p>
              )}
              {item.type && (
                <span className='mt-1.5 inline-block rounded-full bg-[#f6eee6] px-2 py-0.5 text-[11px] text-slate-600'>
                  {item.type}
                </span>
              )}
            </div>
            {editable && (
              <button
                type='button'
                title='Delete question'
                aria-label='Delete question'
                onClick={() => remove(index)}
                disabled={questionList.length === 1}
                className='mt-0.5 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-default disabled:opacity-30'
              >
                <Trash2 className='size-3.5' />
              </button>
            )}
          </li>
        ))}
      </ol>
      {editable && (
        <button
          type='button'
          onClick={add}
          className='mt-3 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[0.625rem] border border-dashed border-orange-300 px-3.5 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-50'
        >
          <Plus className='size-4' /> Add your own question
        </button>
      )}
    </div>
  )
}

export default QuestionListContainer
