import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Container, Form, Spinner, Row, Image, Col, Button } from 'react-bootstrap';

import styles from './Home.module.css';
import { IQuestion } from '../../interfaces/questionInterface';
import parseContext from '../../helpers/parseContext';

const Home = () => {
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [exams, setExams] = useState<IQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [results, setResults] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    if (!selectedYear) return;

    const year = parseInt(selectedYear);

    if (year >= 2010 && year <= 2023 && !selectedLanguage) {
      setExams([]);
      return;
    }

    const loadAllQuestions = async () => {
      setLoading(true);
      setExams([]);
      setSelectedAnswers({});

      try {
        const year = parseInt(selectedYear);
        const basePath = `src/exams/${selectedYear}/questions`;
        const totalQuestions = 180;

        const languageQuestionsRange = year >= 2017 ? { start: 1, end: 5 } : { start: 91, end: 95 };

        const loadedExams = [];

        for (let i = 1; i <= totalQuestions; i++) {
          try {
            const isLanguageQuestion = i >= languageQuestionsRange.start && i <= languageQuestionsRange.end;
            let questionPath = `${basePath}/${i}`;

            if (isLanguageQuestion && selectedLanguage) {
              questionPath += `-${selectedLanguage}`;
            }

            const response = await fetch(`${questionPath}/details.json`);

            const contentType = response.headers.get('content-type');

            if (!contentType || !contentType.includes('application/json')) {
              throw new Error('Resposta não é JSON');
            }

            const data = await response.json();
            loadedExams.push({ ...data, index: i });
          } catch (error) {
            console.error(`Erro ao carregar questão ${i}:`, error);
          }
        }

        setExams(loadedExams);
      } catch (error) {
        console.error('Error loading questions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllQuestions();
  }, [selectedYear, selectedLanguage]);

  const handleSelectYear = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(null);
    setExams([]);
    setSelectedAnswers({});
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

      {loading && (
        <div className='text-center mt-4'>
          <Spinner animation='border' role='status'>
            <span className='visually-hidden'>Carregando...</span>
          </Spinner>

          <p>Carregando questões...</p>
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
                            onChange={() => {}}
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
                                src={alternative.file.replace('https://enem.dev', 'src/exams')}
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

            <div className='mt-4'>
              <Button type='submit' size='lg' className={styles.button_submit}>Enviar Respostas</Button>
            </div>
          </Form>
        </div>
      )}
    </Container>
  );
};

export default Home;
