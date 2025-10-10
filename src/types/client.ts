
export interface ClientMessage {
    questionType: 'MultipleChoiceQuestion' | 'MultipleAnswerQuestion' | 'EssayQuestion' | 'CodeQuestion';
    data: string | number[];
}

export interface BroadcastPayload {
  roomId: string;
  message: ClientMessage;
}

export interface StudentToInstructorMessagePayload {
  studentSocketId: string;
  message: ClientMessage;
}
export interface InstructorToStudentMessagePayload {
  instructorSocketId: string;
  message: ClientMessage;
}
