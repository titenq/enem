import { useEffect, useState, ChangeEvent } from 'react';
import { Container, Form, Spinner, Alert, Row, Image, Col } from 'react-bootstrap';
import styles from './Home.module.css';
import { IQuestion } from '../../interfaces/questionInterface';
import parseContext from '../../helpers/parseContext';

const Home = () => {
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [exams, setExams] = useState<IQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);

      try {
        const basePath = `../../exams/${selectedYear}/questions`;
        const totalQuestions = 180;
        const loadedExams: IQuestion[] = [];

        for (let i = 1; i <= totalQuestions; i++) {
          try {
            let questionPath = `${basePath}/${i}`;

            if ((year >= 2017 && year <= 2023 && i <= 5) || (year >= 2010 && year <= 2016 && i >= 91 && i <= 95)) {
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

        if (loadedExams.length === 0) {
          setError('Nenhuma questão encontrada para os filtros selecionados');
        } else {
          setExams(loadedExams);
        }
      } catch (error) {
        setError('Erro ao carregar questões');

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
    setSelectedYear(e.target.value);
  };

  const handleSelectLanguage = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(e.target.value);
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
        <div className="text-center mt-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Carregando...</span>
          </Spinner>
          <p>Carregando questões...</p>
        </div>
      )}

      {error && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}

      {exams.length > 0 && (
        <div className="mt-4">
          <h2>Questões do ENEM {selectedYear}</h2>
          {selectedLanguage && (
            <p>Língua Estrangeira: {selectedLanguage === 'ingles' ? 'Inglês' : 'Espanhol'}</p>
          )}

          <div className={styles.questions_container}>
            {exams.map((exam) => (
              <div key={exam.index} className={`${styles.question_card} ${exam?.canceled ? styles.canceled : ''}`}>
                <h3>{exam.title}</h3>

                {exam?.context && <div dangerouslySetInnerHTML={{ __html: parseContext(exam.context) }} />}

                {exam.alternativesIntroduction && (
                  <div className="mb-3 mt-3">
                    <p>{exam.alternativesIntroduction}</p>
                  </div>
                )}

                <div className="mb-3">
                  {exam.alternatives.map((alternative) => {
                    if (alternative?.text) {
                      return (
                        <div key={alternative.letter} className={styles.alternative}>
                          <div className={styles.alternative_letter}>{alternative.letter}</div> {alternative.text}
                        </div>
                      );
                    }

                    if (alternative?.file) {
                      const src = alternative.file.replace('https://enem.dev', 'src/exams');

                      return (
                        <div key={alternative.letter}>
                          <strong>{alternative.letter}</strong> - <Image src={src} fluid className="mb-3" />
                        </div>
                      );
                    }
                  })}
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
