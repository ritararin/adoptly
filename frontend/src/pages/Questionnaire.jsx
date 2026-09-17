import React, { useState } from 'react';

const Questionnaire = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});

  const questions = [
    {
      id: 1,
      text: 'What is your living situation?',
      type: 'multiple-choice',
      options: ['House', 'Apartment', 'Other']
    },
    {
      id: 2,
      text: 'Do you have experience with pets?',
      type: 'yes-no'
    },
    {
      id: 3,
      text: 'What is your preferred pet type?',
      type: 'multiple-choice',
      options: ['Dog', 'Cat', 'Other']
    }
  ];

  const handleAnswer = (answer) => {
    setAnswers({
      ...answers,
      [questions[currentQuestion].id]: answer
    });

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleSubmit = () => {
    console.log('Submitted answers:', answers);
    // TODO: Send answers to backend
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const question = questions[currentQuestion];

  return (
    <div className="questionnaire-container">
      <h1>Pet Adoption Questionnaire</h1>
      
      <div className="progress-bar">
        <p>Question {currentQuestion + 1} of {questions.length}</p>
      </div>

      <div className="question-section">
        <h2>{question.text}</h2>

        {question.type === 'multiple-choice' && (
          <div className="options">
            {question.options.map((option) => (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                className={answers[question.id] === option ? 'selected' : ''}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {question.type === 'yes-no' && (
          <div className="options">
            <button
              onClick={() => handleAnswer('yes')}
              className={answers[question.id] === 'yes' ? 'selected' : ''}
            >
              Yes
            </button>
            <button
              onClick={() => handleAnswer('no')}
              className={answers[question.id] === 'no' ? 'selected' : ''}
            >
              No
            </button>
          </div>
        )}
      </div>

      <div className="button-group">
        <button onClick={handlePrevious} disabled={currentQuestion === 0}>
          Previous
        </button>
        {currentQuestion === questions.length - 1 ? (
          <button onClick={handleSubmit}>Submit</button>
        ) : (
          <button onClick={() => handleAnswer(answers[question.id])} disabled={!answers[question.id]}>
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default Questionnaire;
