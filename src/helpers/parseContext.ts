const parseContext = (context: string) => {
  const processed = context.replace(
    /!\[\]\(https:\/\/enem\.dev\/(\d+)\/questions\/(\d+(?:-ingles|-espanhol)?)\/([a-f0-9-]+\.(jpg|png|gif|svg))\)/g,
    (_match, year, questionNumber, filename) =>
      `<Image src="src/exams/${year}/questions/${questionNumber}/${filename}" fluid className="img-fluid mb-3" />`
  );

  return processed.replace(/\n/g, '<br />');
};

export default parseContext;
