// Kiểu dữ liệu lá thư dùng chung giữa trang Tâm sự, LetterPaper và LetterArrivalPrompt.
// Khớp với mapLetter ở Backend/src/services/coupleService.ts (camelCase).
export type CoupleLetter = {
  id: string;
  title: string;
  content: string;
  mood: string | null;
  unlockAt: string | null;
  isSecret: boolean;
  envelope: string | null;
  paper: string | null;
  font: string | null;
  senderId: string;
  receiverId: string | null;
  openedAt: string | null;
  isOpened: boolean;
  senderName: string | null;
  receiverName: string | null;
  createdAt: string | null;
};
