const parseContext = (context: string) => {
  const processed = context.replace(
    /!\[\]\(https:\/\/enem\.dev\/(\d+)\/questions\/(\d+(?:-ingles|-espanhol)?)\/([a-f0-9-]+\.(jpg|png|gif|svg))\)/g,
    (_match, year, questionNumber, filename) =>
      `<Image alt='Imagem da questão ${questionNumber}' src='exams/${year}/questions/${questionNumber}/${filename}' fluid />`
  );

  return processed.replace(/\n/g, '<br />');
};

export default parseContext;
