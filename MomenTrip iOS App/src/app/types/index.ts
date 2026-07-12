export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  code: string;
  createdAt: string;
}

export interface Friend {
  id: string;
  name: string;
  code: string;
  emoji: string;
}

export interface RoomMember extends Friend {
  owner?: boolean;
}

export interface TripRoom {
  id: string;
  ownerId: string;
  name: string;
  inviteCode: string;
  planText: string;
  members: RoomMember[];
  createdAt: string;
}

export interface MissionStatus {
  id: number;
  icon: string;
  title: string;
  desc: string;
  completed: boolean;
  completedAt: string | null;
  photoId: string | null;
}

export interface RewardTransaction {
  id: string;
  userId: string;
  category: 'localMoney' | 'points';
  amount: number;
  title: string;
  desc: string;
  createdAt: string;
}

export interface RewardSummary {
  balances: {
    localMoney: number;
    points: number;
  };
  transactions: RewardTransaction[];
}

export interface TravelPhoto {
  id: string;
  userId: string;
  label: string;
  date: string;
  dataUrl: string;
  source: string;
  filename?: string | null;
  uploadPath?: string | null;
  mimeType?: string | null;
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  date: string;
  title: string;
  text: string;
  photoIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FourCut {
  id: string;
  userId: string;
  photoIds: string[];
  filter: string;
  imageDataUrl: string | null;
  createdAt: string;
}
