import React from 'react'

function QuestionListContainer({ questionList }) {
  return (
    <div>
      <h2 className='font-bold text-lg mb-4'>Generated Interview Questions</h2>
      <div className='space-y-3'>
        {questionList.map((item, index) => (
          <div key={index} className='p-3 border border-gray-200 rounded-xl'>
            <h2 className='font-medium'>{index + 1}. {item.question || item}</h2>
            {item.type && (
              <span className='text-xs text-primary bg-violet-50 px-2 py-1 rounded-full mt-2 inline-block'>
                {item.type}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default QuestionListContainer
