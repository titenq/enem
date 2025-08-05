import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Button,
  Col,
  Container,
  Form,
  Image,
  Row,
  Spinner,
} from 'react-bootstrap';

import styles from './Home.module.css';
import { ILoadQuestionParams, IQuestion } from '../../interfaces/questionInterface';
import parseContext from '../../helpers/parseContext';

const Home = () => {
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [exams, setExams] = useState<IQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [results, setResults] = useState<{ [key: number]: boolean }>({});
  const [loadedCount, setLoadedCount] = useState<number>(0);
  const [totalQuestions] = useState<number>(180);

  const loadQuestions = useCallback(async () => {
    if (!selectedYear) {
      return;
    }

    const year = parseInt(selectedYear);

    if (year >= 2010 && year <= 2023 && !selectedLanguage) {
      setExams([]);

      return;
    }

    setLoading(true);
    setExams([]);
    setSelectedAnswers({});
    setLoadedCount(0);

    try {
      const basePath = 'https://titenq-enem.vercel.app/exams';
      // const basePath = 'http://localhost:5173/exams';

      let languageQuestionsRange = null;

      if (year >= 2017) {
        languageQuestionsRange = { start: 1, end: 5 };
      } else if (year >= 2010 && year <= 2016) {
        languageQuestionsRange = { start: 91, end: 95 };
      }

      const loadedExams: IQuestion[] = [];
      const batchSize = 10;
      let currentIndex = 1;

      while (currentIndex <= totalQuestions) {
        const batchEnd = Math.min(currentIndex + batchSize - 1, totalQuestions);
        const batchPromises = [];

        for (let i = currentIndex; i <= batchEnd; i++) {
          batchPromises.push(loadQuestion({
            questionNumber: i,
            year,
            basePath,
            languageQuestionsRange
          }));
        }

        const batchResults = await Promise.all(batchPromises);
        const validResults = batchResults.filter(q => q !== null) as IQuestion[];

        loadedExams.push(...validResults);

        setExams(prev => [...prev, ...validResults]);
        setLoadedCount(currentIndex + batchSize - 1);

        currentIndex += batchSize;
      }
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedLanguage, totalQuestions]);

  const loadQuestion = async (params: ILoadQuestionParams): Promise<IQuestion | null> => {
    const { questionNumber, year, basePath, languageQuestionsRange } = params;

    try {
      let isLanguageQuestion = false;

      if (languageQuestionsRange) {
        isLanguageQuestion = (
          questionNumber >= languageQuestionsRange.start &&
          questionNumber <= languageQuestionsRange.end
        );
      }

      let questionSegment = `${questionNumber}`;

      if (isLanguageQuestion && selectedLanguage) {
        questionSegment += `-${selectedLanguage}`;
      }

      const url = `${basePath}/${selectedYear}/questions/${questionSegment}/details.json`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        const text = await response.text();

        console.warn("Resposta não é JSON:", text.substring(0, 100));

        throw new Error('Resposta não é JSON');
      }

      const data = await response.json();

      return { ...data, index: questionNumber };
    } catch (error) {
      console.error(`Erro ao carregar questão ${questionNumber}:`, error);

      return ({
        index: questionNumber,
        title: `Questão ${questionNumber}`,
        context: "Erro ao carregar esta questão",
        alternatives: [],
        canceled: true,
        year: year,
        discipline: "",
        correctAlternative: ""
      });
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleSelectYear = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear('');
    setSelectedLanguage(null);
    setExams([]);
    setSelectedAnswers({});
    setResults({});
    setLoadedCount(0);
    setSelectedYear(e.target.value);
  };

  const handleSelectLanguage = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(e.target.value);
  };

  const handleAnswerSelect = (questionIndex: number, letter: string) => {
    const exam = exams.find(ex => ex.index === questionIndex);

    if (exam?.canceled) {
      return;
    }

    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: letter
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newResults: { [key: number]: boolean } = {};

    exams.forEach(exam => {
      if (exam.canceled) {
        return;
      }

      const selectedAnswer = selectedAnswers[exam.index];

      if (selectedAnswer) {
        newResults[exam.index] = selectedAnswer === exam.correctAlternative;
      }
    });

    setResults(newResults);
  };

  return (
    <Container className={styles.container}>
      <Form>
        <Row>
          <Col sm={2}>
            <Form.Label htmlFor='year'>Selecione o ano:</Form.Label>
            <Form.Select
              id='year'
              name='year'
              aria-label='Selecione o ano'
              className={styles.select}
              onChange={handleSelectYear}
              value={selectedYear}
            >
              <option value=''>Selecione o ano</option>
              {Array.from({ length: 15 }, (_, i) => 2009 + i).map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </Form.Select>
          </Col>

          {selectedYear && Number(selectedYear) >= 2010 && (
            <Col sm={5}>
              <Form.Label htmlFor='language'>Selecione a língua estrangeira:</Form.Label>
              <Form.Select
                id='language'
                name='language'
                aria-label='Selecione a língua estrangeira'
                className={styles.select}
                onChange={handleSelectLanguage}
                value={selectedLanguage || ''}
              >
                <option value=''>Selecione a língua estrangeira</option>
                <option value='ingles'>Inglês</option>
                <option value='espanhol'>Espanhol</option>
              </Form.Select>
            </Col>
          )}
        </Row>
      </Form>

      {loading && loadedCount < 10 && (
        <div className='text-center mt-4'>
          <Spinner animation='border' role='status'>
            <span className='visually-hidden'>Carregando...</span>
          </Spinner>

          <p>Carregando questões... {loadedCount} de {totalQuestions}</p>
        </div>
      )}

      {exams.length > 0 && (
        <div className='mt-4'>
          <h2 className={styles.year}>Questões do <span className={styles.arvo_bold}>ENEM</span> {selectedYear}</h2>

          {selectedLanguage && (
            <p>Língua Estrangeira: {selectedLanguage === 'ingles' ? 'Inglês' : 'Espanhol'}</p>
          )}

          <Form onSubmit={handleSubmit} className={styles.questions_container} noValidate>
            {exams.map((exam) => (
              <div
                key={exam.index}
                className={`${styles.question_card} ${exam?.canceled ? styles.canceled : ''}`}
              >
                <div
                  className={styles.title}
                  dangerouslySetInnerHTML={{
                    __html: exam.title.replace(
                      /ENEM/g,
                      `<span class="${styles.arvo_bold}">ENEM</span>`
                    )
                  }}
                />

                <div className='p-3'>
                  {exam?.context && <div dangerouslySetInnerHTML={{ __html: parseContext(exam.context) }} />}

                  {exam.alternativesIntroduction && (
                    <div className='mb-3 mt-3'>
                      <p>{exam.alternativesIntroduction}</p>
                    </div>
                  )}

                  <div className={styles.alternatives_container}>
                    {exam.alternatives.map((alternative) => {
                      const isSelected = selectedAnswers[exam.index] === alternative.letter;
                      const isCorrect = alternative.letter === exam.correctAlternative;
                      const showResult = results[exam.index] !== undefined;

                      return (
                        <div
                          key={alternative.letter}
                          className={`${styles.alternative_label} ${exam?.canceled ? styles.disabled_alternative : ''}`}
                          onClick={() => !exam?.canceled && handleAnswerSelect(exam.index, alternative.letter)}
                        >
                          <input
                            type="radio"
                            name={`question-${exam.index}`}
                            className={styles.radio_input}
                            checked={isSelected}
                            onChange={() => { }}
                            disabled={exam?.canceled}
                          />
                          <div className={`
                            ${styles.alternative}
                            ${showResult && isSelected ? (isCorrect ? styles.correct : styles.incorrect) : ''}
                          `}>
                            <div className={styles.alternative_letter}>{alternative.letter}</div>
                            {alternative?.text ? (
                              <span>{alternative.text}</span>
                            ) : alternative?.file ? (
                              <Image
                                src={alternative.file.replace('https://enem.dev', 'exams')}
                                alt={`Imagem da alternativa ${alternative.letter}`}
                                fluid
                                className='mb-3'
                              />
                            ) : null}
                          </div>
                        </div>
                      );
                    })}

                    {exam?.canceled && <p className={styles.canceled_message}>Questão anulada</p>}
                  </div>
                </div>
              </div>
            ))}

            {Object.keys(results).length > 0 && (
              <div className={styles.results_container}>
                <p className={styles.results_text}>
                  Você acertou {Object.values(results).filter(r => r).length} de {exams.filter(e => !e.canceled).length}
                </p>
              </div>
            )}

            <div className='mt-4 text-center'>
              <Button
                type='submit'
                size='lg'
                className={styles.button_submit}
                disabled={loading}
              >
                Enviar Respostas
              </Button>
            </div>
          </Form>
        </div>
      )}
    </Container>
  );
};

export default Home;
