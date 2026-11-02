import React from 'react'

function QuestionListContainer({ questionList }) {
  return (
    <div>
      <div className='mb-3 flex items-baseline justify-between'>
        <h2 className='text-[15px] font-semibold text-slate-900'>Generated questions</h2>
        <span className='text-xs text-slate-400'>{questionList.length} questions</span>
      </div>
      <ol className='card-soft divide-y divide-orange-50 overflow-hidden rounded-2xl'>
        {questionList.map((item, index) => (
          <li key={index} className='flex gap-3.5 px-5 py-3.5'>
            <span className='mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-medium text-orange-600'>
              {index + 1}
            </span>
            <div className='min-w-0 flex-1'>
              <p className='text-sm leading-relaxed text-slate-800'>{item.question || item}</p>
              {item.type && (
                <span className='mt-1.5 inline-block rounded-full bg-[#f6eee6] px-2 py-0.5 text-[11px] text-slate-600'>
                  {item.type}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default QuestionListContainer
