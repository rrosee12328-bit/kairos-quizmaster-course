export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

export const pepperSprayExamQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "Oleoresin Capsicum is technically a vegetable product and not a true chemical agent.",
    options: ["True", "False"],
    correctAnswer: 0
  },
  {
    id: 2,
    question: "OC spray should be stored:",
    options: [
      "in a secure area to prevent unauthorized usage or accidental discharges.",
      "in confined areas (e.g. vehicle trunks, glove boxes, etc.)",
      "at room temperature",
      "both a and c"
    ],
    correctAnswer: 3
  },
  {
    id: 3,
    question: "The recommended minimum distance for spraying a subject is three feet.",
    options: ["True", "False"],
    correctAnswer: 0
  },
  {
    id: 4,
    question: "Spraying too close to the suspect may cause damage to the eye from the pressure of the stream.",
    options: ["True", "False"],
    correctAnswer: 0
  },
  {
    id: 5,
    question: "The targets of OC spray are:",
    options: [
      "The eyes, nose and mouth",
      "The ears, nose and shoulders",
      "The attacking limbs",
      "None of the above"
    ],
    correctAnswer: 0
  },
  {
    id: 6,
    question: "An officer should cease using OC spray if the suspect ceases to resist or it is obvious the OC spray is ineffective.",
    options: ["True", "False"],
    correctAnswer: 0
  },
  {
    id: 7,
    question: "The length of the burst of spray to an attacker should be approximately ½ to 1 second.",
    options: ["True", "False"],
    correctAnswer: 0
  },
  {
    id: 8,
    question: "The effects of OC typically last from _____ to ______ minutes.",
    options: ["2-5", "5-10", "10-45", "60-120"],
    correctAnswer: 2
  },
  {
    id: 9,
    question: "If symptoms continue for more than 45 minutes, the officer should obtain medical attention for the affected person.",
    options: ["True", "False"],
    correctAnswer: 0
  },
  {
    id: 10,
    question: "It is fine to leave an OC exposed person that has not fully recovered from its effects unattended.",
    options: ["True", "False"],
    correctAnswer: 1
  },
  {
    id: 11,
    question: "The three positions from which to present the unit of OC are __________________________.",
    options: [
      "Left, Right, and Center",
      "High Ready, Low Ready, and Loaded",
      "Front, Rear, and Side",
      "One hand weapon, one hand support, and two handed."
    ],
    correctAnswer: 3
  },
  {
    id: 12,
    question: "OC Spray is categorized as an inflammatory agent.",
    options: ["True", "False"],
    correctAnswer: 0
  },
  {
    id: 13,
    question: "Decontaminating a subject affected by OC includes __________________.",
    options: [
      "Flushing with water",
      "Applying lotion",
      "Exposing to fresh, moving air",
      "Both A and C are correct"
    ],
    correctAnswer: 3
  },
  {
    id: 14,
    question: "Decontaminating a subject affected by OC includes ___________________.",
    options: [
      "Keeping the person calm",
      "Observing the subject to ensure no serious medical conditions occur",
      "Seeking medical attention if the subject's condition is questionable",
      "All of the above are correct"
    ],
    correctAnswer: 3
  },
  {
    id: 15,
    question: "Wind, bystanders, and location are considerations the officer must make prior to using OC spray.",
    options: ["True", "False"],
    correctAnswer: 0
  },
  {
    id: 16,
    question: "It is essential to use verbal commands when using OC spray or any other physical controls on a combative suspect whenever possible.",
    options: ["True", "False"],
    correctAnswer: 0
  },
  {
    id: 17,
    question: "All uses of force by a personal protection officer must be reasonable and proportional.",
    options: ["True", "False"],
    correctAnswer: 0
  }
];
