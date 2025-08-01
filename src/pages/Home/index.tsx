import { useEffect, useState, ChangeEvent } from 'react';

import { Container, Form, Spinner, Row, Image, Col } from 'react-bootstrap';

import styles from './Home.module.css';
import { IQuestion } from '../../interfaces/questionInterface';
import parseContext from '../../helpers/parseContext';

const Home = () => {
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [exams, setExams] = useState<IQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});

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
        const basePath = `../../exams/${selectedYear}/questions`;
        const totalQuestions = 180;
        const loadedExams: IQuestion[] = [];

        for (let i = 1; i <= totalQuestions; i++) {
          try {
            let questionPath = `${basePath}/${i}`;

            if (
              (year >= 2017 && year <= 2023 && i <= 5) || (year >= 2010 && year <= 2016 && i >= 91 && i <= 95)
            ) {
              if (selectedLanguage) {
                questionPath += `-${selectedLanguage}`;
              }
            }

            questionPath += '/details.json';

            const module = await import(/* @vite-ignore */ questionPath);

            loadedExams.push(module.default as IQuestion);
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
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: letter
    }));
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
            <Col sm={3}>
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
          <h2 className={styles.year}>Questões do ENEM {selectedYear}</h2>

          {selectedLanguage && (
            <p>Língua Estrangeira: {selectedLanguage === 'ingles' ? 'Inglês' : 'Espanhol'}</p>
          )}

          <div className={styles.questions_container}>
            {exams.map((exam) => (
              <div
                key={exam.index}
                className={`${styles.question_card} ${exam?.canceled ? styles.canceled : ''}`}
              >
                <div className={styles.title}>{exam.title}</div>

                <div className='p-3'>
                  {exam?.context && <div dangerouslySetInnerHTML={{ __html: parseContext(exam.context) }} />}

                  {exam.alternativesIntroduction && (
                    <div className='mb-3 mt-3'>
                      <p>{exam.alternativesIntroduction}</p>
                    </div>
                  )}

                  <div className='mb-3'>
                    <Form>
                      {exam.alternatives.map((alternative) => (
                        <Form.Check
                          key={alternative.letter}
                          type="radio"
                          id={`${exam.index}-${alternative.letter}`}
                          name={`question-${exam.index}`}
                          className={styles.radio_check}
                        >
                          <Form.Check.Input
                            type="radio"
                            className={styles.radio_input}
                            checked={selectedAnswers[exam.index] === alternative.letter}
                            onChange={() => handleAnswerSelect(exam.index, alternative.letter)}
                          />
                          <Form.Check.Label className={styles.alternative_label}>
                            <div className={styles.alternative}>
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
                          </Form.Check.Label>
                        </Form.Check>
                      ))}
                    </Form>
                  </div>
                </div>

                {exam?.canceled && <p className={styles.canceled_message}>Questão anulada</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </Container>
  );
};

export default Home;
