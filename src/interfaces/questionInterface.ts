interface IAlternative {
  letter: string;
  text: string;
  file?: string | null;
  isCorrect: boolean;
}

export interface IQuestion {
  title: string;
  index: number;
  year: number;
  language?: string | null;
  discipline: string;
  context?: string | null;
  files?: string[] | null;
  correctAlternative: string;
  alternativesIntroduction?: string | null;
  alternatives: IAlternative[];
  canceled?: boolean;
}
